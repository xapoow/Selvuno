import { describe, expect, it } from "vitest";
import { nextRecurringDate } from "./dates";

describe("recurring calendar dates", () => {
  it("advances daily and weekly schedules", () => {
    expect(nextRecurringDate("2026-07-31", "2026-07-31", "daily")).toBe("2026-08-01");
    expect(nextRecurringDate("2026-07-31", "2026-07-31", "weekly")).toBe("2026-08-07");
  });

  it("keeps the original day for monthly schedules after a shorter month", () => {
    expect(nextRecurringDate("2026-01-31", "2026-01-31", "monthly")).toBe("2026-02-28");
    expect(nextRecurringDate("2026-02-28", "2026-01-31", "monthly")).toBe("2026-03-31");
  });

  it("restores leap day when the next leap year arrives", () => {
    expect(nextRecurringDate("2024-02-29", "2024-02-29", "yearly")).toBe("2025-02-28");
    expect(nextRecurringDate("2027-02-28", "2024-02-29", "yearly")).toBe("2028-02-29");
  });
});
