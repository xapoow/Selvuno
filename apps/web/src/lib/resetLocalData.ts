import { financeDb } from "../db/database";

export async function resetLocalApplicationData(): Promise<void> {
  await financeDb.delete();
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.clear();
  }
  if (typeof document !== "undefined") {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0]?.trim();
      if (!name) {
        return;
      }
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  }
}
