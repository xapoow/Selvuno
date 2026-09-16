import { beforeEach, describe, expect, it } from "vitest";
import { applyRootVisualTheme, themeBackgroundHex } from "./colorThemes";

describe("colorThemes and status bar", () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <meta name="theme-color" content="#ffffff" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    `;
    document.documentElement.className = "";
  });

  it("updates theme-color and apple status bar for dark theme with sage color", () => {
    applyRootVisualTheme("dark", "sage");

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("theme-sage")).toBe(true);

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    expect(themeColor?.content).toBe(themeBackgroundHex.dark.sage);
    expect(themeColor?.hasAttribute("media")).toBe(false);

    const statusBar = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    expect(statusBar?.content).toBe("black-translucent");
  });

  it("updates theme-color and apple status bar for light theme with violet color", () => {
    applyRootVisualTheme("light", "violet");

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.classList.contains("theme-violet")).toBe(true);

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    expect(themeColor?.content).toBe(themeBackgroundHex.light.violet);

    const statusBar = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    expect(statusBar?.content).toBe("default");
  });

  it("updates status bar to match dark rose theme", () => {
    applyRootVisualTheme("dark", "rose");

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    expect(themeColor?.content).toBe("#151214");
  });
});
