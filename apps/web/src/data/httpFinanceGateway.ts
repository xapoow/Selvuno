import { z } from "zod";
import { attachmentMetadataSchema, commandInputSchemas, FINANCE_API_VERSION } from "@myfinances/api-contracts";
import {
  commandResultSchemas, financePatchSchema, type FinanceCommand,
  type FinanceCommandInputs, type FinanceCommandResults, type FinanceGateway,
  type RequestOptions
} from "./financeGateway";
import { DataError } from "./dataError";

export interface HttpFinanceGatewayOptions {
  baseUrl: string;
  fetch?: typeof fetch;
}

export function createHttpFinanceGateway(options: HttpFinanceGatewayOptions): FinanceGateway {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);

  async function request(path: string, init: RequestInit, requestOptions?: RequestOptions) {
    let response: Response;
    try {
      response = await fetcher(`${baseUrl}/${FINANCE_API_VERSION}${path}`, {
        ...init,
        credentials: "include",
        signal: requestOptions?.signal,
        headers: {
          Accept: "application/json",
          ...init.headers,
          ...(requestOptions?.requestId ? { "Idempotency-Key": requestOptions.requestId } : {})
        }
      });
    } catch (error) {
      if (requestOptions?.signal?.aborted) throw error;
      throw new DataError({ code: "network_error", message: "Unable to reach the server.", retryable: true });
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as {
        error?: { code?: string; message?: string }
      } | null;
      throw new DataError({
        code: payload?.error?.code ?? `http_${response.status}`,
        message: payload?.error?.message ?? `Request failed (${response.status}).`,
        status: response.status,
        retryable: response.status === 429 || response.status >= 500
      });
    }
    return response;
  }

  async function json(path: string, init: RequestInit, requestOptions?: RequestOptions): Promise<unknown> {
    const response = await request(path, init, requestOptions);
    try {
      return (await response.json() as { data: unknown }).data;
    } catch {
      throw new DataError({ code: "invalid_response", message: "The server returned invalid JSON.", retryable: false });
    }
  }

  function validate<S extends z.ZodTypeAny>(schema: S, data: unknown): z.output<S> {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      throw new DataError({ code: "invalid_response", message: "The server response does not match the API contract.", retryable: false });
    }
    return parsed.data;
  }

  return {
    mode: "remote",
    async initialize() {
      // Account provisioning, schedules and migrations are server responsibilities.
    },
    async read(resources, requestOptions) {
      const query = new URLSearchParams({ resources: resources.join(",") });
      const patch = validate(financePatchSchema, await json(`/finance?${query}`, {}, requestOptions));
      if (resources.some((resource) => patch[resource] === undefined)) {
        throw new DataError({ code: "invalid_response", message: "The server omitted requested finance data.", retryable: false });
      }
      return patch;
    },
    async execute<K extends FinanceCommand>(command: K, input: FinanceCommandInputs[K], requestOptions?: RequestOptions) {
      let body: BodyInit;
      let headers: Record<string, string> = {};
      if (command === "addTransactionWithAttachments" || command === "updateTransactionWithAttachments") {
        const submission = command === "addTransactionWithAttachments"
          ? input as FinanceCommandInputs["addTransactionWithAttachments"]
          : (input as FinanceCommandInputs["updateTransactionWithAttachments"]).submission;
        const { newFiles, ...fields } = submission;
        const form = new FormData();
        form.set("input", JSON.stringify(commandInputSchemas[command].parse(command === "addTransactionWithAttachments" ? fields : {
          id: (input as FinanceCommandInputs["updateTransactionWithAttachments"]).id,
          submission: fields
        })));
        newFiles.forEach((file) => form.append("files", file, file.name));
        body = form;
      } else {
        headers = { "Content-Type": "application/json" };
        body = JSON.stringify({ input: commandInputSchemas[command].parse(input ?? null) });
      }
      const payload = await json(`/commands/${command}`, { method: "POST", headers, body }, requestOptions);
      return validate(commandResultSchemas[command], payload) as FinanceCommandResults[K];
    },
    async listAttachments(transactionId, requestOptions) {
      const path = `/transactions/${encodeURIComponent(transactionId)}/attachments`;
      const metadata = validate(z.array(attachmentMetadataSchema).max(5), await json(path, {}, requestOptions));
      if (metadata.some((item) => item.transactionId !== transactionId)) {
        throw new DataError({ code: "invalid_response", message: "Attachment belongs to another transaction.", retryable: false });
      }
      return Promise.all(metadata.map(async (item) => {
        const response = await request(`${path}/${encodeURIComponent(item.id)}/content`, {}, requestOptions);
        const blob = await response.blob();
        if (blob.size > 10 * 1024 * 1024) {
          throw new DataError({ code: "invalid_response", message: "Attachment is too large.", retryable: false });
        }
        return { ...item, blob: new Blob([blob], { type: item.mimeType }) };
      }));
    }
  };
}
