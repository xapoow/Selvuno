import { z } from "zod";
import { financeDb } from "../db/database";
import type { TransactionDraft } from "../db/models";
import { validateAttachment } from "../lib/transactionAttachments";

const fieldsSchema = z.object({
  type: z.enum(["expense", "income"]), walletId: z.string().uuid(), currency: z.string().length(3), categoryId: z.string().max(128),
  amount: z.string().max(512), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }), note: z.string().max(10000), tagsInput: z.string().max(2000)
});
const queues = new Map<string, Promise<unknown>>();
function validateDraft(draft: TransactionDraft) {
  fieldsSchema.parse(draft.fields);
  if (!Array.isArray(draft.files) || draft.files.length > 5 || draft.files.some((file) =>
    !(file.blob instanceof Blob) || typeof file.name !== "string" || !file.name.length || file.name.length > 240 ||
    file.type !== file.blob.type || !Number.isFinite(file.lastModified) ||
    validateAttachment(new File([file.blob], file.name, { type: file.type }))
  )) throw new Error("draft-invalid");
}
function queue<T>(id: string, task: () => Promise<T>): Promise<T> {
  const next = (queues.get(id) ?? Promise.resolve()).catch(() => undefined).then(task);
  queues.set(id, next);
  void next.finally(() => { if (queues.get(id) === next) queues.delete(id); }).catch(() => undefined);
  return next;
}
export function meaningfulDraft(draft: Pick<TransactionDraft, "fields" | "files">) {
  return Boolean(draft.fields.amount.trim() || draft.fields.note.trim() || draft.fields.tagsInput.trim() || draft.files.length);
}
export const draftRepository = {
  async read(id: string): Promise<TransactionDraft | null> {
    const draft = await financeDb.transactionDrafts.get(id);
    if (!draft) return null;
    if (!Number.isFinite(Date.parse(draft.updatedAt)) || Date.now() - Date.parse(draft.updatedAt) > 30 * 86400000) {
      await this.remove(id); return null;
    }
    validateDraft(draft);
    return draft;
  },
  save(draft: TransactionDraft) {
    validateDraft(draft);
    return queue(draft.id, () => financeDb.transaction("rw", financeDb.settings, financeDb.transactionDrafts, async () => {
      if ((await financeDb.settings.get("default"))?.draftsEnabled === false) return;
      if (meaningfulDraft(draft)) await financeDb.transactionDrafts.put(draft);
      else await financeDb.transactionDrafts.delete(draft.id);
    }));
  },
  remove(id: string) { return queue(id, () => financeDb.transactionDrafts.delete(id)); }
};
