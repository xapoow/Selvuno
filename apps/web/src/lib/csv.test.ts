import { describe, expect, it } from "vitest";
import { createCsv } from "./csv";

describe("CSV export", () => {
  it("adds a UTF-8 marker and escapes commas, quotes, and new lines", () => {
    expect(
      createCsv([
        ["Name", "Note"],
        ["Coffee, work", 'He said "hello"\nToday']
      ])
    ).toBe('\uFEFFName,Note\r\n"Coffee, work","He said ""hello""\nToday"');
  });
});
