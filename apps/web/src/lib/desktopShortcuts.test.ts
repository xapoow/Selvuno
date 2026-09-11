import { describe, expect, it } from "vitest";
import { getDesktopShortcut } from "./desktopShortcuts";

const baseEvent = {
  key: "",
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  defaultPrevented: false
};

describe("getDesktopShortcut", () => {
  it("maps Ctrl+N and Cmd+N to adding a transaction", () => {
    expect(getDesktopShortcut({ ...baseEvent, key: "n", ctrlKey: true })).toBe(
      "add-transaction"
    );
    expect(getDesktopShortcut({ ...baseEvent, key: "N", metaKey: true })).toBe(
      "add-transaction"
    );
  });

  it("maps Ctrl+K and Cmd+K to history search", () => {
    expect(getDesktopShortcut({ ...baseEvent, key: "k", ctrlKey: true })).toBe(
      "search-history"
    );
    expect(getDesktopShortcut({ ...baseEvent, key: "K", metaKey: true })).toBe(
      "search-history"
    );
  });

  it("ignores modified, handled and unrelated key presses", () => {
    expect(
      getDesktopShortcut({ ...baseEvent, key: "n", ctrlKey: true, shiftKey: true })
    ).toBeNull();
    expect(
      getDesktopShortcut({ ...baseEvent, key: "k", ctrlKey: true, defaultPrevented: true })
    ).toBeNull();
    expect(getDesktopShortcut({ ...baseEvent, key: "x", ctrlKey: true })).toBeNull();
  });
});
