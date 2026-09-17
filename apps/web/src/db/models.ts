export interface TransactionAttachment {
  id: string;
  transactionId: string;
  name: string;
  mimeType: string;
  size: number;
  blob: Blob;
  createdAt: string;
}
