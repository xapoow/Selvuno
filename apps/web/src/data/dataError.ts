export interface DataFailure {
  code: string;
  message: string;
  status?: number;
  retryable: boolean;
}

export class DataError extends Error {
  constructor(public readonly failure: DataFailure) {
    super(failure.message);
    this.name = "DataError";
  }
}

export function toDataFailure(error: unknown): DataFailure {
  if (error instanceof DataError) return error.failure;
  return {
    code: error instanceof Error && error.name === "AbortError" ? "aborted" : "storage_error",
    message: error instanceof Error ? error.message : "Unable to complete the operation.",
    retryable: false
  };
}
