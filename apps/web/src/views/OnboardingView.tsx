import { useEffect, useMemo, useState } from "react";
import type {
  ColorThemePreference,
  Settings,
  SettingsUpdate,
  ThemePreference,
  Wallet,
  WalletInput
} from "@myfinances/types";
import { Check, ChevronLeft, Languages, WalletCards } from "lucide-react";
import { ColorThemePicker } from "../components/ColorThemePicker";
import { currencyOptions, getCurrencyLabel } from "../lib/currencies";
import { applyRootVisualTheme } from "../lib/colorThemes";
import { getDictionary, languageOptions } from "../i18n";
import { Button } from "../components/ui/Button";
import { SelectField } from "../components/ui/SelectField";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { TextField } from "../components/ui/TextField";

interface OnboardingViewProps {
  settings: Settings;
  wallets: Wallet[];
  onUpdateSettings: (update: SettingsUpdate) => Promise<unknown>;
  onCreateWallet: (input: WalletInput) => Promise<Wallet>;
  onUpdateWallet: (id: string, input: Partial<WalletInput>) => Promise<Wallet>;
}

export function OnboardingView({
  settings,
  wallets,
  onUpdateSettings,
  onCreateWallet,
  onUpdateWallet
}: OnboardingViewProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [locale, setLocale] = useState("ru-RU");
  const [globalCurrency, setGlobalCurrency] = useState(settings.currency);
  const [walletCurrency, setWalletCurrency] = useState(wallets[0]?.currency ?? settings.currency);
  const [walletName, setWalletName] = useState(wallets[0]?.name === "Everyday" ? "" : wallets[0]?.name ?? "");
  const [theme, setTheme] = useState<ThemePreference>(settings.theme);
  const [colorTheme, setColorTheme] = useState<ColorThemePreference>(settings.colorTheme);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const t = useMemo(() => getDictionary(locale), [locale]);
  const walletNameValue = walletName.trim();

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => applyRootVisualTheme(theme, colorTheme);
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme, colorTheme]);

  async function finish() {
    setSaving(true);
    setError("");
    try {
      const walletInput = {
        name: walletNameValue || t.onboarding.walletNamePlaceholder,
        currency: walletCurrency
      };
      const firstWallet = wallets[0]
        ? await onUpdateWallet(wallets[0].id, walletInput)
        : await onCreateWallet(walletInput);
      await onUpdateSettings({
        locale,
        currency: globalCurrency,
        theme,
        colorTheme,
        activeWalletId: firstWallet.id,
        onboardingCompleted: true
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.onboarding.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-[calc(env(safe-area-inset-top)+20px)] text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-40px)] max-w-xl flex-col justify-center gap-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-muted">MyFinances</p>
          <div className="flex gap-1">
            {[1, 2].map((item) => (
              <span
                key={item}
                className={`h-1.5 w-6 rounded-full transition ${item === step ? "bg-accent" : "bg-line"}`}
              />
            ))}
          </div>
        </div>

        {step === 1 ? (
          <div className="grid gap-5">
            <div className="grid h-12 w-12 place-items-center rounded-app bg-accentSoft text-accent">
              <Languages className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted">{t.onboarding.welcomeEyebrow}</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-foreground">{t.onboarding.welcomeTitle}</h1>
              <p className="mt-3 text-sm leading-6 text-muted">{t.onboarding.welcomeBody}</p>
            </div>
            <SelectField label={t.onboarding.languageTitle} value={locale} onChange={(event) => setLocale(event.target.value)}>
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
            <Button onClick={() => setStep(2)}>
              {t.onboarding.start}
            </Button>
          </div>
        ) : (
          <div className="grid gap-5">
            <div className="grid h-12 w-12 place-items-center rounded-app bg-accentSoft text-accent">
              <WalletCards className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted">{t.onboarding.setupEyebrow}</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-foreground">{t.onboarding.setupTitle}</h1>
              <p className="mt-3 text-sm leading-6 text-muted">{t.onboarding.setupBody}</p>
            </div>
            <div className="grid gap-4 rounded-app border border-line bg-surface p-4">
              <SelectField
                label={t.onboarding.globalCurrency}
                value={globalCurrency}
                onChange={(event) => setGlobalCurrency(event.target.value)}
              >
                {currencyOptions.map((currency) => (
                  <option key={currency} value={currency}>
                    {getCurrencyLabel(currency)}
                  </option>
                ))}
              </SelectField>
              <TextField
                label={t.onboarding.walletName}
                value={walletName}
                placeholder={t.onboarding.walletNamePlaceholder}
                onChange={(event) => setWalletName(event.target.value)}
                maxLength={64}
              />
              <SelectField
                label={t.onboarding.walletCurrency}
                value={walletCurrency}
                onChange={(event) => setWalletCurrency(event.target.value)}
              >
                {currencyOptions.map((currency) => (
                  <option key={currency} value={currency}>
                    {getCurrencyLabel(currency)}
                  </option>
                ))}
              </SelectField>
              <div className="grid gap-2">
                <span className="text-sm font-medium text-foreground">{t.onboarding.theme}</span>
                <SegmentedControl
                  value={theme}
                  onChange={(value: ThemePreference) => setTheme(value)}
                  options={[
                    { value: "system", label: t.settings.system },
                    { value: "light", label: t.settings.light },
                    { value: "dark", label: t.settings.dark }
                  ]}
                />
              </div>
              <div className="grid gap-2">
                <span className="text-sm font-medium text-foreground">{t.onboarding.colorTheme}</span>
                <ColorThemePicker
                  value={colorTheme}
                  labels={t.settings.colorThemes}
                  onChange={setColorTheme}
                />
              </div>
            </div>
            {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4" />
                {t.onboarding.back}
              </Button>
              <Button onClick={() => void finish()} disabled={saving}>
                <Check className="h-4 w-4" />
                {t.onboarding.finish}
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
