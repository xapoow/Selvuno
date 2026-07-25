import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Category,
  CategoryInput,
  ColorThemePreference,
  DateFormatPreference,
  Settings,
  SettingsUpdate,
  ThemePreference
} from "@myfinances/types";
import { Edit3, FileDown, FileUp, Tags, Trash2 } from "lucide-react";
import { CategoryIcon } from "../lib/icons";
import { currencyOptions, getCurrencyLabel } from "../lib/currencies";
import { applyRootVisualTheme } from "../lib/colorThemes";
import { resetLocalApplicationData } from "../lib/resetLocalData";
import { ColorThemePicker } from "../components/ColorThemePicker";
import { CategoryForm } from "../components/CategoryForm";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { ErrorScreen, type ErrorScreenKind, errorPresets } from "../components/ErrorScreen";
import { EmptyState } from "../components/ui/EmptyState";
import { Section } from "../components/ui/Section";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { SelectField } from "../components/ui/SelectField";
import { appVersion, getCategoryName, languageOptions, type Dictionary, type SettingsTab } from "../i18n";

interface SettingsViewProps {
  settings: Settings;
  categories: Category[];
  t: Dictionary;
  onUpdateSettings: (update: SettingsUpdate) => Promise<void>;
  onCreateCategory: (input: CategoryInput) => Promise<void>;
  onUpdateCategory: (id: string, input: Partial<CategoryInput>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onExportBackup: () => Promise<unknown>;
  onImportBackup: (backup: unknown) => Promise<void>;
}

const timeZoneOptions = ["UTC", "Europe/Warsaw", "Europe/Berlin", "America/New_York", "Asia/Tokyo"];
const debugErrorKinds: ErrorScreenKind[] = [
  "bad-request",
  "unauthorized",
  "forbidden",
  "not-found",
  "server",
  "unavailable",
  "offline",
  "storage"
];
const settingsTabs: Array<{ value: SettingsTab }> = [
  { value: "general" },
  { value: "appearance" },
  { value: "categories" },
  { value: "backup" },
  { value: "sync" },
  { value: "debug" }
];

export function SettingsView({
  settings,
  categories,
  t,
  onUpdateSettings,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onExportBackup,
  onImportBackup
}: SettingsViewProps) {
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [debugError, setDebugError] = useState<ErrorScreenKind | null>(null);
  const [shouldCrash, setShouldCrash] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [visualTheme, setVisualTheme] = useState<ThemePreference>(settings.theme);
  const [visualColorTheme, setVisualColorTheme] = useState<ColorThemePreference>(settings.colorTheme);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const displayedTimeZones = useMemo(
    () => Array.from(new Set([settings.timeZone, ...timeZoneOptions].filter(Boolean))),
    [settings.timeZone]
  );
  const groupedCategories = useMemo(
    () => ({
      expense: categories.filter((category) => category.type === "expense"),
      income: categories.filter((category) => category.type === "income")
    }),
    [categories]
  );

  useEffect(() => {
    setVisualTheme(settings.theme);
    setVisualColorTheme(settings.colorTheme);
  }, [settings.theme, settings.colorTheme]);

  function handleThemeChange(theme: ThemePreference) {
    setVisualTheme(theme);
    applyRootVisualTheme(theme, visualColorTheme);
    void onUpdateSettings({ theme }).catch(() => {
      setVisualTheme(settings.theme);
      applyRootVisualTheme(settings.theme, settings.colorTheme);
    });
  }

  function handleColorThemeChange(colorTheme: ColorThemePreference) {
    setVisualColorTheme(colorTheme);
    applyRootVisualTheme(visualTheme, colorTheme);
    void onUpdateSettings({ colorTheme }).catch(() => {
      setVisualColorTheme(settings.colorTheme);
      applyRootVisualTheme(settings.theme, settings.colorTheme);
    });
  }

  async function handleExport() {
    const backup = await onExportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `myfinances-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File | undefined) {
    setImportError("");
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (window.confirm(t.settings.replaceBackup)) {
        await onImportBackup(parsed);
      }
    } catch (cause) {
      setImportError(cause instanceof Error ? cause.message : t.settings.importError);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  if (shouldCrash) {
    throw new Error("Manual debug crash from Settings.");
  }

  async function handleResetLocalData() {
    if (!window.confirm(t.settings.resetLocalDataConfirm)) {
      return;
    }
    await resetLocalApplicationData();
    window.location.reload();
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t.settings.title}</h2>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="app-control flex min-w-max gap-2 rounded-app p-1">
          {settingsTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`h-9 rounded-[6px] px-3 text-sm font-medium transition duration-200 active:scale-[0.98] ${
                activeTab === tab.value ? "app-selected-control text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {t.settings.tabs[tab.value]}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "general" ? (
        <Section title={t.settings.general}>
          <div className="app-surface grid gap-4 rounded-app p-4 sm:grid-cols-2">
            <SelectField
              label={t.common.language}
              value={settings.locale}
              onChange={(event) => void onUpdateSettings({ locale: event.target.value })}
            >
              {languageOptions.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </SelectField>
            <SelectField
              label={t.settings.globalCurrency}
              value={settings.currency}
              onChange={(event) => void onUpdateSettings({ currency: event.target.value })}
            >
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {getCurrencyLabel(currency)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label={t.settings.dateFormat}
              value={settings.dateFormat}
              onChange={(event) =>
                void onUpdateSettings({ dateFormat: event.target.value as DateFormatPreference })
              }
            >
              <option value="short">{t.settings.dateFormats.short}</option>
              <option value="medium">{t.settings.dateFormats.medium}</option>
              <option value="long">{t.settings.dateFormats.long}</option>
            </SelectField>
            <SelectField
              label={t.common.timeZone}
              value={settings.timeZone}
              onChange={(event) => void onUpdateSettings({ timeZone: event.target.value })}
            >
              {displayedTimeZones.map((timeZone) => (
                <option key={timeZone} value={timeZone}>
                  {timeZone}
                </option>
              ))}
            </SelectField>
          </div>
        </Section>
      ) : null}

      {activeTab === "appearance" ? (
        <Section title={t.settings.appearance}>
          <div className="app-surface grid gap-4 rounded-app p-4">
            <SegmentedControl
              value={visualTheme}
              onChange={handleThemeChange}
              options={[
                { value: "system", label: t.settings.system },
                { value: "light", label: t.settings.light },
                { value: "dark", label: t.settings.dark }
              ]}
            />
            <div className="grid gap-2">
              <span className="text-sm font-medium text-foreground">{t.settings.colorTheme}</span>
              <ColorThemePicker
                value={visualColorTheme}
                labels={t.settings.colorThemes}
                onChange={handleColorThemeChange}
              />
            </div>
          </div>
        </Section>
      ) : null}

      {activeTab === "categories" ? (
        <Section
          title={t.categories.title}
          action={
            <Button variant="secondary" size="small" onClick={() => setCreatingCategory(true)}>
              {t.common.add}
            </Button>
          }
        >
          {categories.length ? (
            <div className="grid gap-3">
              {(["expense", "income"] as const).map((type) => (
                <div key={type} className="grid gap-2">
                  <h3 className="text-sm font-semibold capitalize text-foreground">
                    {type === "expense" ? t.common.expense : t.common.income}
                  </h3>
                  <div className="grid gap-2">
                    {groupedCategories[type].map((category) => (
                      <article
                        key={category.id}
                        className="app-surface grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-app p-3"
                      >
                        <span
                          className="grid h-10 w-10 place-items-center rounded-app text-white"
                          style={{ backgroundColor: category.color }}
                        >
                          <CategoryIcon name={category.icon} className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-semibold text-foreground">{getCategoryName(category.name, t)}</span>
                        <span className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingCategory(category)}
                            aria-label={t.categories.editTitle}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-expense"
                            onClick={() => {
                              if (window.confirm(t.categories.confirmDelete)) {
                                void onDeleteCategory(category.id);
                              }
                            }}
                            aria-label={t.common.delete}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </span>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Tags} title={t.categories.empty} />
          )}
        </Section>
      ) : null}

      {activeTab === "backup" ? (
        <Section title={t.settings.backup}>
          <div className="app-surface grid gap-3 rounded-app p-4 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => void handleExport()}>
              <FileDown className="h-4 w-4" />
              {t.settings.exportJson}
            </Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="h-4 w-4" />
              {t.settings.importJson}
            </Button>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="application/json"
              onChange={(event) => void handleImport(event.target.files?.[0])}
            />
            {importError ? <p className="text-sm font-medium text-expense sm:col-span-2">{importError}</p> : null}
          </div>
        </Section>
      ) : null}

      {activeTab === "sync" ? (
        <Section title={t.settings.sync}>
          <div className="app-surface rounded-app p-5">
            <p className="text-sm font-semibold uppercase text-muted">{t.settings.comingSoon}</p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">{t.settings.syncTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              {t.settings.syncBody}
            </p>
          </div>
        </Section>
      ) : null}

      {activeTab === "debug" ? (
        <Section title={t.settings.debug}>
          <div className="app-surface grid gap-3 rounded-app p-4">
            <div className="app-control rounded-app px-3 py-2 text-sm text-muted">
              {t.settings.version}: <span className="font-semibold text-foreground">{appVersion}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {debugErrorKinds.map((kind) => (
                <Button key={kind} variant="secondary" size="small" onClick={() => setDebugError(kind)}>
                  {errorPresets[kind].status}
                </Button>
              ))}
            </div>
            <Button variant="danger" size="small" onClick={() => setShouldCrash(true)}>
              {t.settings.triggerRuntimeError}
            </Button>
            <Button variant="danger" size="small" onClick={() => void handleResetLocalData()}>
              {t.settings.resetLocalData}
            </Button>
          </div>
        </Section>
      ) : null}

      <BottomSheet open={creatingCategory} title={t.categories.newTitle} onClose={() => setCreatingCategory(false)}>
        <CategoryForm
          t={t}
          submitLabel={t.categories.create}
          onSubmit={async (input) => {
            await onCreateCategory(input);
            setCreatingCategory(false);
          }}
        />
      </BottomSheet>

      <BottomSheet open={Boolean(editingCategory)} title={t.categories.editTitle} onClose={() => setEditingCategory(null)}>
        {editingCategory ? (
          <CategoryForm
            initial={editingCategory}
            t={t}
            submitLabel={t.categories.update}
            onSubmit={async (input) => {
              await onUpdateCategory(editingCategory.id, input);
              setEditingCategory(null);
            }}
          />
        ) : null}
      </BottomSheet>

      <BottomSheet open={Boolean(debugError)} title={t.settings.errorPreview} onClose={() => setDebugError(null)}>
        {debugError ? (
          <ErrorScreen
            kind={debugError}
            copy={t.errors}
            compact
            details={[
              `Preview: ${debugError}`,
              `Status: ${errorPresets[debugError].status}`,
              `Time: ${new Date().toISOString()}`
            ].join("\n")}
            primaryAction={{
              label: t.settings.closePreview,
              onClick: () => setDebugError(null)
            }}
            secondaryAction={{
              label: t.common.reload,
              variant: "secondary",
              onClick: () => window.location.reload()
            }}
          />
        ) : null}
      </BottomSheet>
    </div>
  );
}
