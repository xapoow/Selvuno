import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        elevated: "rgb(var(--color-elevated) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        accentSoft: "rgb(var(--color-accent-soft) / <alpha-value>)",
        income: "rgb(var(--color-income) / <alpha-value>)",
        expense: "rgb(var(--color-expense) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)"
      },
      borderRadius: {
        app: "16px",
        card: "20px",
        control: "12px",
        subtle: "8px",
        pill: "9999px"
      },
      boxShadow: {
        soft: "0 14px 40px rgb(0 0 0 / 0.08)",
        softDark: "0 14px 40px rgb(0 0 0 / 0.28)",
        iosCard: "0 8px 24px -4px rgb(0 0 0 / 0.05), 0 2px 6px -1px rgb(0 0 0 / 0.02)",
        iosElevated: "0 14px 34px -6px rgb(0 0 0 / 0.08), 0 4px 12px -2px rgb(0 0 0 / 0.03)",
        iosGlass: "inset 0 1px 0 0 rgb(255 255 255 / 0.65), 0 10px 30px -10px rgb(0 0 0 / 0.06)",
        iosGlassDark: "inset 0 1px 0 0 rgb(255 255 255 / 0.1), 0 14px 34px rgb(0 0 0 / 0.3)"
      }
    }
  },
  plugins: []
};

export default config;
