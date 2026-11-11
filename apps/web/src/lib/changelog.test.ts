import { beforeEach, describe, expect, it } from "vitest";
import { appVersion } from "../i18n";
import { BUILTIN_CHANGELOG, compareVersions, getChangelogHistory, changelogStorageKey } from "./changelog";

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
    expect(list[0].version).toBe(appVersion);
    expect(list[1].version).toBe("0.9.8");
    expect(list[2].version).toBe("0.9.7");
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

  it("preserves the release date across repeated current-note updates and storage reloads", () => {
    const date = BUILTIN_CHANGELOG.en.find((item) => item.version === appVersion)?.date;
    expect(date).toBeTruthy();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = getChangelogHistory("en-US", ["Fixed camera", "Fixed camera"]).find((item) => item.version === appVersion);
      expect(current?.date).toBe(date);
      expect(current?.notes).toEqual(["Fixed camera"]);
    }
    expect(getChangelogHistory("en-US").every((item) => item.date)).toBe(true);
  });

  it("restores canonical localized notes and dates instead of stale stored release data", () => {
    localStorage.setItem(changelogStorageKey, JSON.stringify([
      { version: "0.9.0", notes: ["Stale or wrong-language description"] },
      { version: "bad", notes: [] },
      { version: "0.1.1", notes: "corrupt" }
    ]));
    const history = getChangelogHistory("ru-RU");
    expect(history.find((item) => item.version === "0.9.0")).toEqual(BUILTIN_CHANGELOG.ru.find((item) => item.version === "0.9.0"));
    expect(history.some((item) => item.version === "bad" || item.version === "0.1.1")).toBe(false);
  });
});
