import type { ColorThemePreference, ThemePreference } from "@myfinances/types";

export const defaultColorTheme: ColorThemePreference = "sage";

export const colorThemeOptions: Array<{
  value: ColorThemePreference;
  accent: string;
  soft: string;
  background: string;
  marker: string;
}> = [
  { value: "sage", accent: "#207a6f", soft: "#d4f2eb", background: "#f5f8f5", marker: "#1f8f66" },
  { value: "rose", accent: "#d64c86", soft: "#fde2ef", background: "#faf6f8", marker: "#8d6ce8" },
  { value: "violet", accent: "#7960d9", soft: "#ece7ff", background: "#f7f6fb", marker: "#2f82c7" },
  { value: "sky", accent: "#2378b7", soft: "#dff1ff", background: "#f4f8fa", marker: "#14a58f" },
  { value: "amber", accent: "#b87014", soft: "#fff0cf", background: "#faf8f3", marker: "#2f8a6b" },
  { value: "graphite", accent: "#606a76", soft: "#e7ebef", background: "#f6f7f8", marker: "#a36b2c" },
  { value: "mint", accent: "#159c7f", soft: "#d9f8ef", background: "#f4f9f7", marker: "#4976d1" },
  { value: "coral", accent: "#d85e47", soft: "#ffe1d9", background: "#faf6f4", marker: "#2e86a6" }
];

export const colorThemeClassNames = colorThemeOptions.map((option) => `theme-${option.value}`);

export function applyRootVisualTheme(theme: ThemePreference, colorTheme: ColorThemePreference) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const root = document.documentElement;
  const shouldUseDark = theme === "dark" || (theme === "system" && media.matches);
  root.classList.toggle("dark", shouldUseDark);
  root.classList.remove(...colorThemeClassNames);
  root.classList.add(`theme-${colorTheme || defaultColorTheme}`);
  root.style.colorScheme = shouldUseDark ? "dark" : "light";
}
