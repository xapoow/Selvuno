import type { TransactionInput } from "@myfinances/types";

export const ATTACHMENT_MAX_FILES = 5;
export const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024;
export const ATTACHMENT_ACCEPT = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export interface TransactionSubmission {
  input: TransactionInput;
  newFiles: File[];
  removedAttachmentIds: string[];
}

export function validateAttachment(file: File): "type" | "size" | null {
  if (!ATTACHMENT_ACCEPT.includes(file.type)) {
    return "type";
  }
  if (file.size > ATTACHMENT_MAX_SIZE) {
    return "size";
  }
  return null;
}
