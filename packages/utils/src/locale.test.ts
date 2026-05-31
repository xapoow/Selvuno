import { describe, expect, it } from "vitest";
import { detectDefaultLocaleSettings, inferCurrencyFromLocale, normalizeLocale } from "./locale";

describe("locale helpers", () => {
  it("normalizes valid locales", () => {
    expect(normalizeLocale("pl-pl")).toBe("pl-PL");
  });

  it("infers currency from locale region", () => {
    expect(inferCurrencyFromLocale("pl-PL")).toBe("PLN");
    expect(inferCurrencyFromLocale("en-US")).toBe("USD");
  });

  it("returns default locale settings", () => {
    expect(detectDefaultLocaleSettings("de-DE")).toMatchObject({
      locale: "de-DE",
      currency: "USD",
      dateFormat: "medium"
    });
  });
});
