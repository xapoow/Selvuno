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
        app: "8px"
      },
      boxShadow: {
        soft: "0 14px 40px rgb(0 0 0 / 0.08)",
        softDark: "0 14px 40px rgb(0 0 0 / 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
