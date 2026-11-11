import { Unzip, UnzipInflate, Zip, ZipPassThrough, strFromU8, strToU8 } from "fflate";
import { z } from "zod";
import { backupSchema, type FinanceBackup } from "@selvuno/types";
import type { TransactionAttachment } from "../db/models";
import { ATTACHMENT_ACCEPT, ATTACHMENT_MAX_FILES, ATTACHMENT_MAX_SIZE } from "./transactionAttachments";

export const MAX_ARCHIVE_BYTES = 128 * 1024 * 1024;
const MAX_JSON_BYTES = 16 * 1024 * 1024;
const MAX_FILES = 1000;
const fileMeta = z.object({
  id: z.string().regex(/^[\w-]{1,128}$/), transactionId: z.string().uuid(), name: z.string().min(1).max(240),
  mimeType: z.string(), size: z.number().int().nonnegative().max(ATTACHMENT_MAX_SIZE), createdAt: z.string().datetime()
});
const manifestSchema = z.object({
  format: z.literal("selvuno-backup"), version: z.literal(1), createdAt: z.string().datetime(),
  dataHash: z.string().regex(/^[a-f0-9]{64}$/),
  attachments: z.array(fileMeta.extend({ hash: z.string().regex(/^[a-f0-9]{64}$/) })).max(MAX_FILES)
});
export interface PreparedBackup { kind: "full-backup"; data: FinanceBackup; attachments: TransactionAttachment[] }
export interface IncomingBackup { data: FinanceBackup; attachments?: TransactionAttachment[] }
function fail(code: string): never { throw new Error(code); }

export function normalizeBackupInput(value: unknown): IncomingBackup {
  if (value && typeof value === "object" && "kind" in value && value.kind === "full-backup") {
    const incoming = value as PreparedBackup;
    const data = backupSchema.parse(incoming.data);
    if (!Array.isArray(incoming.attachments) || incoming.attachments.length > MAX_FILES) fail("archive-invalid");
    const ids = new Set<string>();
    const transactions = new Set(data.transactions.map((item) => item.id));
    const counts = new Map<string, number>();
    let total = 0;
    for (const file of incoming.attachments) {
      fileMeta.parse(file);
      if (ids.has(file.id) || !transactions.has(file.transactionId) || !ATTACHMENT_ACCEPT.includes(file.mimeType) ||
        !(file.blob instanceof Blob) || file.blob.size !== file.size || file.blob.type !== file.mimeType) fail("archive-invalid");
      ids.add(file.id);
      counts.set(file.transactionId, (counts.get(file.transactionId) ?? 0) + 1);
      if (counts.get(file.transactionId)! > ATTACHMENT_MAX_FILES) fail("archive-invalid");
      total += file.size;
    }
    if (total > MAX_ARCHIVE_BYTES) fail("archive-too-large");
    return { data, attachments: incoming.attachments };
  }
  return { data: backupSchema.parse(value) };
}
export async function blobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === "function") return new Uint8Array(await blob.arrayBuffer());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(new Error("archive-invalid"));
    reader.readAsArrayBuffer(blob);
  });
}
async function hash(bytes: Uint8Array) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
export async function createBackupArchive(input: { data: FinanceBackup; attachments: TransactionAttachment[] }): Promise<Blob> {
  const { data, attachments = [] } = normalizeBackupInput({ kind: "full-backup", ...input });
  const json = strToU8(JSON.stringify(data));
  if (json.length > MAX_JSON_BYTES || json.length + attachments.reduce((sum, file) => sum + file.size, 0) > MAX_ARCHIVE_BYTES - 1024 * 1024) fail("archive-too-large");
  const chunks: BlobPart[] = [];
  const zip = new Zip((error, chunk) => { if (error) throw error; chunks.push(Uint8Array.from(chunk).buffer); });
  const add = (path: string, bytes: Uint8Array) => { const entry = new ZipPassThrough(path); zip.add(entry); entry.push(bytes, true); };
  add("backup.json", json);
  const entries = [];
  for (const file of attachments) {
    const bytes = await blobBytes(file.blob);
    const { blob: _blob, ...metadata } = file;
    entries.push({ ...metadata, hash: await hash(bytes) });
    add(`files/${file.id}`, bytes);
  }
  add("manifest.json", strToU8(JSON.stringify({ format: "selvuno-backup", version: 1, createdAt: new Date().toISOString(), dataHash: await hash(json), attachments: entries })));
  zip.end();
  return new Blob(chunks, { type: "application/zip" });
}

async function unpack(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  // Require a complete, single-disk central-directory trailer (no partial ZIPs/ZIP64).
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === bytes.length) { end = i; break; }
  }
  if (end < 0 || view.getUint16(end + 4, true) || view.getUint16(end + 6, true) ||
    view.getUint16(end + 8, true) !== view.getUint16(end + 10, true) ||
    view.getUint32(end + 16, true) + view.getUint32(end + 12, true) !== end) fail("archive-invalid");
  const files = new Map<string, Uint8Array>();
  const seen = new Set<string>();
  let total = 0;
  const unzip = new Unzip((file) => {
    if (seen.has(file.name) || seen.size >= MAX_FILES + 2 ||
      !/^(backup\.json|manifest\.json|files\/[\w-]{1,128})$/.test(file.name)) fail("archive-invalid");
    seen.add(file.name);
    const limit = file.name.startsWith("files/") ? ATTACHMENT_MAX_SIZE : MAX_JSON_BYTES;
    if ((file.originalSize ?? 0) > limit) fail("archive-too-large");
    const chunks: Uint8Array[] = [];
    let size = 0;
    file.ondata = (error, chunk, final) => {
      if (error) { file.terminate(); fail("archive-invalid"); }
      size += chunk.length; total += chunk.length;
      if (size > limit || total > MAX_ARCHIVE_BYTES) { file.terminate(); fail("archive-too-large"); }
      chunks.push(chunk);
      if (final) {
        const joined = new Uint8Array(size); let offset = 0;
        for (const part of chunks) { joined.set(part, offset); offset += part.length; }
        files.set(file.name, joined);
      }
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  // Small compressed chunks bound inflation before the output-size guard can run.
  for (let offset = 0; offset < bytes.length; offset += 1024) {
    unzip.push(bytes.subarray(offset, offset + 1024), offset + 1024 >= bytes.length);
    if (offset && offset % (128 * 1024) === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  if (files.size !== seen.size || seen.size !== view.getUint16(end + 10, true)) fail("archive-incomplete");
  return files;
}
export async function readBackupFile(file: Blob): Promise<IncomingBackup | PreparedBackup> {
  if (file.size > MAX_ARCHIVE_BYTES) fail("archive-too-large");
  const bytes = await blobBytes(file);
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    if (bytes.length > MAX_JSON_BYTES) fail("archive-too-large");
    return { data: backupSchema.parse(JSON.parse(strFromU8(bytes))) };
  }
  const files = await unpack(bytes);
  const manifestBytes = files.get("manifest.json"), json = files.get("backup.json");
  if (!manifestBytes || !json) fail("archive-incomplete");
  const manifest = manifestSchema.parse(JSON.parse(strFromU8(manifestBytes)));
  if (await hash(json) !== manifest.dataHash || files.size !== manifest.attachments.length + 2) fail("archive-incomplete");
  const attachments: TransactionAttachment[] = [];
  for (const metadata of manifest.attachments) {
    const bytes = files.get(`files/${metadata.id}`);
    if (!bytes || bytes.length !== metadata.size || await hash(bytes) !== metadata.hash) fail("archive-incomplete");
    const { hash: _hash, ...fields } = metadata;
    attachments.push({ ...fields, blob: new Blob([Uint8Array.from(bytes).buffer], { type: metadata.mimeType }) });
  }
  const prepared: PreparedBackup = { kind: "full-backup", data: backupSchema.parse(JSON.parse(strFromU8(json))), attachments };
  normalizeBackupInput(prepared);
  return prepared;
}
