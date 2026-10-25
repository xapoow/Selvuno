import type { FinanceGateway } from "./financeGateway";
import { createLocalFinanceGateway } from "./localFinanceGateway";
import { createHttpFinanceGateway } from "./httpFinanceGateway";

export function createFinanceGateway(): FinanceGateway {
  const mode = import.meta.env.VITE_DATA_MODE ?? "local";
  if (mode === "local") return createLocalFinanceGateway();
  if (mode !== "remote") throw new Error("VITE_DATA_MODE must be local or remote.");
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) throw new Error("VITE_API_BASE_URL is required in remote mode.");
  return createHttpFinanceGateway({ baseUrl });
}
