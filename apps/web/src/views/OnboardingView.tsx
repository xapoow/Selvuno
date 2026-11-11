import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  ColorThemePreference,
  Settings,
  SettingsUpdate,
  ThemePreference,
  Wallet,
  WalletInput
} from "@selvuno/types";
import { Check, ChevronLeft, Languages, WalletCards } from "lucide-react";
import { ColorThemePicker } from "../components/ColorThemePicker";
import { currencyOptions, getCurrencyLabel } from "../lib/currencies";
import { applyRootVisualTheme } from "../lib/colorThemes";
import { getDictionary, languageOptions } from "../i18n";
import { cn } from "../lib/cn";
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
  const [direction, setDirection] = useState<1 | -1>(1);
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

  function goToStep(nextStep: 1 | 2) {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  }

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
    <main className="app-page-bg min-h-dvh px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+20px)] text-foreground">
      <section className="mx-auto flex min-h-[calc(100dvh-40px)] max-w-xl flex-col justify-center gap-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t.brand}</p>
          <div className="flex items-center gap-2">
            {[1, 2].map((item) => (
              <motion.span
                key={item}
                layout
                animate={{
                  width: item === step ? 32 : 8,
                  opacity: item === step ? 1 : 0.35
                }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                className={cn(
                  "h-1.5 rounded-full transition-colors duration-300",
                  item === step ? "bg-accent" : "bg-muted/40"
                )}
              />
            ))}
          </div>
        </div>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 48, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{
                opacity: 0,
                x: -direction * 36,
                scale: 0.98,
                transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] }
              }}
              transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
              className="gpu-layer"
            >
              {step === 1 ? (
                <div className="grid gap-6">
                  <div className="app-control grid h-14 w-14 place-items-center rounded-2xl text-accent shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                    <Languages className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t.onboarding.welcomeEyebrow}</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t.onboarding.welcomeTitle}</h1>
                    <p className="mt-3 text-base leading-relaxed text-muted">{t.onboarding.welcomeBody}</p>
                  </div>
                  <SelectField label={t.onboarding.languageTitle} value={locale} onChange={(event) => setLocale(event.target.value)}>
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>
                  <Button onClick={() => goToStep(2)} className="h-12 text-base font-semibold">
                    {t.onboarding.start}
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6">
                  <div className="app-control grid h-14 w-14 place-items-center rounded-2xl text-accent shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                    <WalletCards className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t.onboarding.setupEyebrow}</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t.onboarding.setupTitle}</h1>
                    <p className="mt-3 text-base leading-relaxed text-muted">{t.onboarding.setupBody}</p>
                  </div>
                  <div className="app-surface grid gap-4 rounded-2xl p-5 shadow-sm ring-1 ring-line/50">
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
                    <Button variant="secondary" onClick={() => goToStep(1)}>
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
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
