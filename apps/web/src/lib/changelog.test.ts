import { beforeEach, describe, expect, it } from "vitest";
import { compareVersions, getChangelogHistory, changelogStorageKey } from "./changelog";

describe("changelog", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("sorts semantic version numbers descending", () => {
    expect(compareVersions("0.7.8", "0.7.7")).toBeGreaterThan(0);
    expect(compareVersions("0.7.7", "0.7.8")).toBeLessThan(0);
    expect(compareVersions("0.7.7", "0.7.7")).toBe(0);
    expect(compareVersions("0.10.0", "0.9.9")).toBeGreaterThan(0);
  });

  it("returns builtin changelogs in descending order", () => {
    const list = getChangelogHistory("ru-RU");
    expect(list.length).toBeGreaterThanOrEqual(10);
    expect(list[0].version).toBe("0.8.1");
    expect(list[1].version).toBe("0.8.0");
    expect(list[2].version).toBe("0.7.9");
  });

  it("preserves stored changelog history from previous versions", () => {
    window.localStorage.setItem(
      changelogStorageKey,
      JSON.stringify([
        {
          version: "0.5.5",
          notes: ["Previous archived custom feature"]
        }
      ])
    );

    const list = getChangelogHistory("en-US");
    expect(list.some((item) => item.version === "0.5.5")).toBe(true);
    const found = list.find((item) => item.version === "0.5.5");
    expect(found?.notes).toEqual(["Previous archived custom feature"]);
  });
});
