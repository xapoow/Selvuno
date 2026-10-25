import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHttpFinanceGateway } from "./httpFinanceGateway";
import { createLocalFinanceGateway } from "./localFinanceGateway";
import { financeResources, type FinanceSnapshot } from "./financeGateway";
import { resetDatabaseForTests } from "../db/database";

describe("HTTP finance gateway contract", () => {
  let snapshot: FinanceSnapshot;
  beforeEach(async () => {
    await resetDatabaseForTests();
    const local = createLocalFinanceGateway();
    await local.initialize();
    snapshot = await local.read(financeResources) as FinanceSnapshot;
  });

  it("loads and validates only the requested resources using the versioned API", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: { wallets: snapshot.wallets } }));
    const gateway = createHttpFinanceGateway({ baseUrl: "https://api.example.test/", fetch: fetcher });
    expect(await gateway.read(["wallets"])).toEqual({ wallets: snapshot.wallets });
    expect(fetcher).toHaveBeenCalledWith("https://api.example.test/v1/finance?resources=wallets", expect.objectContaining({ credentials: "include" }));
  });

  it("rejects missing or malformed resources instead of replacing state with incomplete data", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ data: {} }))
      .mockResolvedValueOnce(Response.json({ data: { wallets: [{ id: "not-a-uuid" }] } }));
    const gateway = createHttpFinanceGateway({ baseUrl: "/api", fetch: fetcher });
    await expect(gateway.read(["wallets"])).rejects.toMatchObject({ failure: { code: "invalid_response" } });
    await expect(gateway.read(["wallets"])).rejects.toMatchObject({ failure: { code: "invalid_response" } });
  });

  it("sends typed commands with a stable idempotency key and validates the result", async () => {
    const updated = { ...snapshot.settings, hideAmounts: true };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: updated }));
    const gateway = createHttpFinanceGateway({ baseUrl: "/api", fetch: fetcher });
    expect(await gateway.execute("updateSettings", { hideAmounts: true }, { requestId: "request-123" })).toEqual(updated);
    const [url, request] = fetcher.mock.calls[0];
    expect(url).toBe("/api/v1/commands/updateSettings");
    expect(request).toMatchObject({ method: "POST", credentials: "include", headers: { "Idempotency-Key": "request-123", "Content-Type": "application/json" } });
    expect(JSON.parse(request!.body as string)).toEqual({ input: { hideAmounts: true } });
  });

  it("uploads files as multipart instead of JSON and keeps removals in the command input", async () => {
    const transaction = {
      id: "20000000-0000-4000-8000-000000000001", userId: null, createdAt: "2026-10-25T12:00:00.000Z",
      updatedAt: "2026-10-25T12:00:00.000Z", deletedAt: null, syncStatus: "synced", tags: [], attachmentCount: 1,
      walletId: snapshot.wallets[0].id, categoryId: snapshot.categories[0].id, type: "expense", amountMinor: 1200,
      currency: "USD", transactionDate: "2026-10-25T12:00:00.000Z"
    };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: transaction }));
    const gateway = createHttpFinanceGateway({ baseUrl: "/api", fetch: fetcher });
    const file = new File(["receipt"], "receipt.pdf", { type: "application/pdf" });
    await gateway.execute("addTransactionWithAttachments", {
      input: { ...transaction, type: "expense" }, newFiles: [file], removedAttachmentIds: []
    });
    const request = fetcher.mock.calls[0][1]!;
    const body = request.body as FormData;
    expect(body.getAll("files")).toHaveLength(1);
    expect(JSON.parse(body.get("input") as string)).toMatchObject({ removedAttachmentIds: [], input: { amountMinor: 1200 } });
    expect(request.headers).not.toHaveProperty("Content-Type");
  });

  it("distinguishes authentication, conflict and network errors without retrying writes", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ error: { code: "unauthenticated", message: "Sign in again." } }, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ error: { code: "conflict", message: "Data changed on another device." } }, { status: 409 }))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const gateway = createHttpFinanceGateway({ baseUrl: "/api", fetch: fetcher });
    await expect(gateway.execute("updateSettings", {})).rejects.toMatchObject({ failure: { code: "unauthenticated", status: 401, retryable: false } });
    await expect(gateway.execute("updateSettings", {})).rejects.toMatchObject({ failure: { code: "conflict", status: 409, retryable: false } });
    await expect(gateway.execute("updateSettings", {})).rejects.toMatchObject({ failure: { code: "network_error", retryable: true } });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("passes cancellation to HTTP requests", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: { wallets: snapshot.wallets } }));
    const gateway = createHttpFinanceGateway({ baseUrl: "/api", fetch: fetcher });
    await gateway.read(["wallets"], { signal: controller.signal });
    expect(fetcher.mock.calls[0][1]?.signal).toBe(controller.signal);
  });

  it("loads attachment content through authenticated API endpoints", async () => {
    const transactionId = "20000000-0000-4000-8000-000000000001";
    const attachmentId = "30000000-0000-4000-8000-000000000001";
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ data: [{
        id: attachmentId, transactionId, name: "receipt.pdf", mimeType: "application/pdf", size: 7,
        createdAt: "2026-10-25T12:00:00.000Z"
      }] }))
      .mockResolvedValueOnce(new Response("receipt", { headers: { "Content-Type": "application/pdf" } }));
    const gateway = createHttpFinanceGateway({ baseUrl: "/api", fetch: fetcher });
    const [attachment] = await gateway.listAttachments(transactionId);
    expect(attachment.name).toBe("receipt.pdf");
    expect(attachment.blob.size).toBe(7);
    expect(fetcher.mock.calls[1][0]).toBe(`/api/v1/transactions/${transactionId}/attachments/${attachmentId}/content`);
  });
});
