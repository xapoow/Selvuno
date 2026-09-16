import type { ColorThemePreference, ThemePreference } from "@myfinances/types";

export const defaultColorTheme: ColorThemePreference = "sage";

export const themeBackgroundHex: Record<"light" | "dark", Record<ColorThemePreference, string>> = {
  light: {
    sage: "#f5f8f5",
    rose: "#faf6f8",
    violet: "#f7f6fb",
    sky: "#f4f8fa",
    amber: "#faf8f3",
    graphite: "#f6f7f8",
    mint: "#f4f9f7",
    coral: "#faf6f4"
  },
  dark: {
    sage: "#101412",
    rose: "#151214",
    violet: "#131217",
    sky: "#101316",
    amber: "#151310",
    graphite: "#121314",
    mint: "#0f1513",
    coral: "#161211"
  }
};

export const colorThemeOptions: Array<{
  value: ColorThemePreference;
  accent: string;
  soft: string;
  background: string;
  darkBackground: string;
}> = [
  { value: "sage", accent: "#207a6f", soft: "#d4f2eb", background: "#f5f8f5", darkBackground: "#101412" },
  { value: "rose", accent: "#d64c86", soft: "#fde2ef", background: "#faf6f8", darkBackground: "#151214" },
  { value: "violet", accent: "#7960d9", soft: "#ece7ff", background: "#f7f6fb", darkBackground: "#131217" },
  { value: "sky", accent: "#2378b7", soft: "#dff1ff", background: "#f4f8fa", darkBackground: "#101316" },
  { value: "amber", accent: "#b87014", soft: "#fff0cf", background: "#faf8f3", darkBackground: "#151310" },
  { value: "graphite", accent: "#606a76", soft: "#e7ebef", background: "#f6f7f8", darkBackground: "#121314" },
  { value: "mint", accent: "#159c7f", soft: "#d9f8ef", background: "#f4f9f7", darkBackground: "#0f1513" },
  { value: "coral", accent: "#d85e47", soft: "#ffe1d9", background: "#faf6f4", darkBackground: "#161211" }
];

export const colorThemeClassNames = colorThemeOptions.map((option) => `theme-${option.value}`);

export function applyRootVisualTheme(theme: ThemePreference, colorTheme: ColorThemePreference) {
  const media = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : { matches: false };
  const root = document.documentElement;
  const shouldUseDark = theme === "dark" || (theme === "system" && media.matches);
  const activeColorTheme = colorTheme || defaultColorTheme;

  root.classList.toggle("dark", shouldUseDark);
  root.classList.remove(...colorThemeClassNames);
  root.classList.add(`theme-${activeColorTheme}`);
  root.style.colorScheme = shouldUseDark ? "dark" : "light";

  const modeKey = shouldUseDark ? "dark" : "light";
  const hex = themeBackgroundHex[modeKey]?.[activeColorTheme] || (shouldUseDark ? "#101412" : "#f5f8f5");

  // Keep every browser and installed-PWA theme source in sync. Some mobile
  // browsers choose a matching media-tag before application JavaScript runs.
  const themeColorMetas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeColorMetas.length) {
    themeColorMetas.forEach((meta) => {
      meta.content = hex;
      meta.removeAttribute("media");
    });
  } else {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.setAttribute("content", hex);
    document.head.appendChild(meta);
  }

  document.documentElement.style.backgroundColor = hex;
  document.body.style.backgroundColor = hex;

  // Update Apple Mobile Web App status bar style
  const appleStatusBarMeta = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (appleStatusBarMeta) {
    appleStatusBarMeta.setAttribute("content", shouldUseDark ? "black-translucent" : "default");
  } else {
    const meta = document.createElement("meta");
    meta.name = "apple-mobile-web-app-status-bar-style";
    meta.setAttribute("content", shouldUseDark ? "black-translucent" : "default");
    document.head.appendChild(meta);
  }
}
