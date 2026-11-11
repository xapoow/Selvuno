export interface TransactionAttachment {
  id: string;
  transactionId: string;
  name: string;
  mimeType: string;
  size: number;
  blob: Blob;
  createdAt: string;
}

export interface TransactionDraft {
  id: string;
  updatedAt: string;
  fields: {
    type: "expense" | "income"; walletId: string; currency: string; categoryId: string;
    amount: string; date: string; note: string; tagsInput: string;
  };
  files: Array<{ name: string; type: string; lastModified: number; blob: Blob }>;
}
