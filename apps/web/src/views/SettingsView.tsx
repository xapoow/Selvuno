import { useMemo, useRef, useState } from "react";
import type {
  Category,
  CategoryInput,
  DateFormatPreference,
  Settings,
  SettingsUpdate,
  ThemePreference
} from "@myfinances/types";
import { Edit3, FileDown, FileUp, Tags, Trash2 } from "lucide-react";
import { CategoryIcon } from "../lib/icons";
import { CategoryForm } from "../components/CategoryForm";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { ErrorScreen, type ErrorScreenKind, errorPresets } from "../components/ErrorScreen";
import { EmptyState } from "../components/ui/EmptyState";
import { Section } from "../components/ui/Section";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { SelectField } from "../components/ui/SelectField";

interface SettingsViewProps {
  settings: Settings;
  categories: Category[];
  onUpdateSettings: (update: SettingsUpdate) => Promise<void>;
  onCreateCategory: (input: CategoryInput) => Promise<void>;
  onUpdateCategory: (id: string, input: Partial<CategoryInput>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onExportBackup: () => Promise<unknown>;
  onImportBackup: (backup: unknown) => Promise<void>;
}

const localeOptions = ["en-US", "pl-PL", "ru-RU", "de-DE"];
const currencyOptions = ["USD", "PLN", "EUR", "GBP", "UAH", "RUB"];
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
type SettingsTab = "general" | "appearance" | "categories" | "backup" | "sync" | "debug";

const settingsTabs: Array<{ value: SettingsTab; label: string }> = [
  { value: "general", label: "General" },
  { value: "appearance", label: "Appearance" },
  { value: "categories", label: "Categories" },
  { value: "backup", label: "Backup" },
  { value: "sync", label: "Sync" },
  { value: "debug", label: "Debug" }
];

export function SettingsView({
  settings,
  categories,
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
      if (window.confirm("Replace local data with this backup?")) {
        await onImportBackup(parsed);
      }
    } catch (cause) {
      setImportError(cause instanceof Error ? cause.message : "Unable to import backup.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  if (shouldCrash) {
    throw new Error("Manual debug crash from Settings.");
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Settings</h2>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex min-w-max gap-2 rounded-app bg-elevated p-1 ring-1 ring-line">
          {settingsTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`h-9 rounded-[6px] px-3 text-sm font-medium transition duration-200 active:scale-[0.98] ${
                activeTab === tab.value ? "bg-surface text-foreground shadow-sm" : "text-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "general" ? (
        <Section title="General">
          <div className="grid gap-4 rounded-app border border-line bg-surface p-4 sm:grid-cols-2">
            <SelectField
              label="Language"
              value={settings.locale}
              onChange={(event) => void onUpdateSettings({ locale: event.target.value })}
            >
              {localeOptions.map((locale) => (
                <option key={locale} value={locale}>
                  {locale}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Currency"
              value={settings.currency}
              onChange={(event) => void onUpdateSettings({ currency: event.target.value })}
            >
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Date format"
              value={settings.dateFormat}
              onChange={(event) =>
                void onUpdateSettings({ dateFormat: event.target.value as DateFormatPreference })
              }
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </SelectField>
            <SelectField
              label="Time zone"
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
        <Section title="Appearance">
          <div className="grid gap-4 rounded-app border border-line bg-surface p-4">
            <SegmentedControl
              value={settings.theme}
              onChange={(theme: ThemePreference) => void onUpdateSettings({ theme })}
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" }
              ]}
            />
          </div>
        </Section>
      ) : null}

      {activeTab === "categories" ? (
        <Section
          title="Categories"
          action={
            <Button variant="secondary" size="small" onClick={() => setCreatingCategory(true)}>
              Add
            </Button>
          }
        >
          {categories.length ? (
            <div className="grid gap-3">
              {(["expense", "income"] as const).map((type) => (
                <div key={type} className="grid gap-2">
                  <h3 className="text-sm font-semibold capitalize text-foreground">{type}</h3>
                  <div className="grid gap-2">
                    {groupedCategories[type].map((category) => (
                      <article
                        key={category.id}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-app border border-line bg-surface p-3"
                      >
                        <span
                          className="grid h-10 w-10 place-items-center rounded-app text-white"
                          style={{ backgroundColor: category.color }}
                        >
                          <CategoryIcon name={category.icon} className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-semibold text-foreground">{category.name}</span>
                        <span className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingCategory(category)}
                            aria-label="Edit category"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-expense"
                            onClick={() => {
                              if (window.confirm("Delete this category?")) {
                                void onDeleteCategory(category.id);
                              }
                            }}
                            aria-label="Delete category"
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
            <EmptyState icon={Tags} title="Add categories for income and expenses." />
          )}
        </Section>
      ) : null}

      {activeTab === "backup" ? (
        <Section title="Backup">
          <div className="grid gap-3 rounded-app border border-line bg-surface p-4 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => void handleExport()}>
              <FileDown className="h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="h-4 w-4" />
              Import JSON
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
        <Section title="Sync">
          <div className="rounded-app border border-line bg-surface p-5">
            <p className="text-sm font-semibold uppercase text-muted">Coming soon</p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">Cloud sync is planned</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Accounts, cloud backup, restore, and multi-device synchronization will live here.
            </p>
          </div>
        </Section>
      ) : null}

      {activeTab === "debug" ? (
        <Section title="Debug">
          <div className="grid gap-3 rounded-app border border-line bg-surface p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {debugErrorKinds.map((kind) => (
                <Button key={kind} variant="secondary" size="small" onClick={() => setDebugError(kind)}>
                  {errorPresets[kind].status}
                </Button>
              ))}
            </div>
            <Button variant="danger" size="small" onClick={() => setShouldCrash(true)}>
              Trigger runtime error
            </Button>
          </div>
        </Section>
      ) : null}

      <BottomSheet open={creatingCategory} title="New category" onClose={() => setCreatingCategory(false)}>
        <CategoryForm
          submitLabel="Create category"
          onSubmit={async (input) => {
            await onCreateCategory(input);
            setCreatingCategory(false);
          }}
        />
      </BottomSheet>

      <BottomSheet open={Boolean(editingCategory)} title="Edit category" onClose={() => setEditingCategory(null)}>
        {editingCategory ? (
          <CategoryForm
            initial={editingCategory}
            submitLabel="Update category"
            onSubmit={async (input) => {
              await onUpdateCategory(editingCategory.id, input);
              setEditingCategory(null);
            }}
          />
        ) : null}
      </BottomSheet>

      <BottomSheet open={Boolean(debugError)} title="Error preview" onClose={() => setDebugError(null)}>
        {debugError ? (
          <ErrorScreen
            kind={debugError}
            compact
            details={[
              `Preview: ${debugError}`,
              `Status: ${errorPresets[debugError].status}`,
              `Time: ${new Date().toISOString()}`
            ].join("\n")}
            primaryAction={{
              label: "Close preview",
              onClick: () => setDebugError(null)
            }}
            secondaryAction={{
              label: "Reload",
              variant: "secondary",
              onClick: () => window.location.reload()
            }}
          />
        ) : null}
      </BottomSheet>
    </div>
  );
}
