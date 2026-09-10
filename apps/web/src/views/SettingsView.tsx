import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import type {
  BackupSnapshot,
  Category,
  CategoryInput,
  ColorThemePreference,
  DateFormatPreference,
  Settings,
  SettingsUpdate,
  ThemePreference,
  TransactionType
} from "@myfinances/types";
import {
  Combine,
  Edit3,
  FileDown,
  FileUp,
  GripVertical,
  History,
  Menu,
  RotateCcw,
  Tags,
  Trash2,
  X
} from "lucide-react";
import { CategoryIcon } from "../lib/icons";
import { currencyOptions, getCurrencyLabel } from "../lib/currencies";
import { applyRootVisualTheme } from "../lib/colorThemes";
import { resetLocalApplicationData } from "../lib/resetLocalData";
import { ColorThemePicker } from "../components/ColorThemePicker";
import { CategoryForm } from "../components/CategoryForm";
import { AutomationSettingsPanel } from "../components/AutomationSettingsPanel";
import { PrivacySettingsPanel } from "../components/PrivacySettingsPanel";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { ErrorScreen, type ErrorScreenKind, errorPresets } from "../components/ErrorScreen";
import { EmptyState } from "../components/ui/EmptyState";
import { Section } from "../components/ui/Section";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { SelectField } from "../components/ui/SelectField";
import { appVersion, getCategoryName, languageOptions, type Dictionary, type SettingsTab } from "../i18n";
import type { PrivacyLockController } from "../state/usePrivacyLock";

interface SettingsViewProps {
  settings: Settings;
  categories: Category[];
  backupSnapshots: BackupSnapshot[];
  privacy: PrivacyLockController;
  t: Dictionary;
  onUpdateSettings: (update: SettingsUpdate) => Promise<void>;
  onCreateCategory: (input: CategoryInput) => Promise<void>;
  onUpdateCategory: (id: string, input: Partial<CategoryInput>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onReorderCategories: (type: TransactionType, orderedIds: string[]) => Promise<void>;
  onReplaceCategory: (sourceId: string, targetId: string, deleteSource: boolean) => Promise<void>;
  onExportBackup: () => Promise<unknown>;
  onImportBackup: (backup: unknown) => Promise<void>;
  onRestoreBackupSnapshot: (id: string) => Promise<void>;
  onDeleteBackupSnapshot: (id: string) => Promise<void>;
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
  { value: "automation" },
  { value: "privacy" },
  { value: "categories" },
  { value: "backup" },
  { value: "sync" },
  { value: "debug" }
];

export function SettingsView({
  settings,
  categories,
  backupSnapshots,
  privacy,
  t,
  onUpdateSettings,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
  onReplaceCategory,
  onExportBackup,
  onImportBackup,
  onRestoreBackupSnapshot,
  onDeleteBackupSnapshot
}: SettingsViewProps) {
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [organizingCategories, setOrganizingCategories] = useState(false);
  const [categoryActionType, setCategoryActionType] = useState<TransactionType>("expense");
  const [categoryActionMode, setCategoryActionMode] = useState<"replace" | "merge">("replace");
  const [sourceCategoryId, setSourceCategoryId] = useState("");
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [categoryActionError, setCategoryActionError] = useState("");
  const [categoryOrder, setCategoryOrder] = useState<Record<TransactionType, string[]>>({
    expense: [],
    income: []
  });
  const [debugError, setDebugError] = useState<ErrorScreenKind | null>(null);
  const [shouldCrash, setShouldCrash] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
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
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  useEffect(() => {
    setVisualTheme(settings.theme);
    setVisualColorTheme(settings.colorTheme);
  }, [settings.theme, settings.colorTheme]);

  useEffect(() => {
    setCategoryOrder({
      expense: groupedCategories.expense.map((category) => category.id),
      income: groupedCategories.income.map((category) => category.id)
    });
  }, [groupedCategories]);

  useEffect(() => {
    const actionCategories = groupedCategories[categoryActionType];
    setSourceCategoryId(actionCategories[0]?.id ?? "");
    setTargetCategoryId(actionCategories[1]?.id ?? "");
    setCategoryActionError("");
  }, [categoryActionType, groupedCategories, organizingCategories]);

  useEffect(() => {
    if (!settingsMenuOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsMenuOpen(false);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsMenuOpen]);

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
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-foreground">{t.settings.title}</h2>
        <Button
          variant="secondary"
          size="icon"
          className="md:hidden"
          onClick={() => setSettingsMenuOpen(true)}
          aria-label={t.settings.section}
          aria-expanded={settingsMenuOpen}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <AnimatePresence>
        {settingsMenuOpen ? (
          <motion.div
            className="fixed inset-0 z-50 bg-black/28 backdrop-blur-[3px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              onClick={() => setSettingsMenuOpen(false)}
              aria-label={t.common.close}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={t.settings.section}
              className="app-surface relative grid h-full w-[min(82vw,304px)] content-start gap-4 rounded-r-[8px] px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-[calc(env(safe-area-inset-top)+16px)]"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted">{t.settings.section}</p>
                  <h3 className="text-lg font-semibold text-foreground">{t.settings.title}</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSettingsMenuOpen(false)} aria-label={t.common.close}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="grid gap-2" aria-label={t.settings.section}>
                {settingsTabs.map((tab) => {
                  const isActive = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.value);
                        setSettingsMenuOpen(false);
                      }}
                      className={`app-focus flex h-11 items-center justify-between rounded-app px-3 text-left text-sm font-medium active:scale-[0.98] ${
                        isActive ? "app-selected-control text-foreground" : "text-muted hover:bg-elevated/70 hover:text-foreground"
                      }`}
                    >
                      <span>{t.settings.tabs[tab.value]}</span>
                      {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-accent" /> : null}
                    </button>
                  );
                })}
              </nav>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="hidden overflow-x-auto pb-1 md:block">
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

      {activeTab === "privacy" ? (
        <Section title={t.settings.privacy}>
          <PrivacySettingsPanel
            settings={settings}
            privacy={privacy}
            t={t}
            onUpdateSettings={onUpdateSettings}
          />
        </Section>
      ) : null}

      {activeTab === "automation" ? (
        <Section title={t.settings.automation}>
          <AutomationSettingsPanel
            settings={settings}
            t={t}
            onUpdateSettings={onUpdateSettings}
          />
        </Section>
      ) : null}

      {activeTab === "categories" ? (
        <Section
          title={t.categories.title}
          action={
            <span className="flex gap-2">
              <Button variant="secondary" size="small" onClick={() => setOrganizingCategories(true)}>
                <Combine className="h-4 w-4" />
                {t.categories.organize}
              </Button>
              <Button variant="secondary" size="small" onClick={() => setCreatingCategory(true)}>
                {t.common.add}
              </Button>
            </span>
          }
        >
          {categories.length ? (
            <div className="grid gap-3">
              <p className="text-xs text-muted">{t.categories.reorderHint}</p>
              {(["expense", "income"] as const).map((type) => (
                <div key={type} className="grid gap-2">
                  <h3 className="text-sm font-semibold capitalize text-foreground">
                    {type === "expense" ? t.common.expense : t.common.income}
                  </h3>
                  <Reorder.Group
                    axis="y"
                    values={categoryOrder[type]}
                    onReorder={(orderedIds) =>
                      setCategoryOrder((current) => ({ ...current, [type]: orderedIds }))
                    }
                    className="grid gap-2"
                  >
                    {categoryOrder[type].map((categoryId) => {
                      const category = categoryById.get(categoryId);
                      if (!category) {
                        return null;
                      }
                      return (
                        <Reorder.Item
                          key={category.id}
                          value={category.id}
                          onDragEnd={() => void onReorderCategories(type, categoryOrder[type])}
                          className="app-surface grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-app p-3"
                        >
                          <GripVertical className="h-4 w-4 cursor-grab text-muted active:cursor-grabbing" />
                          <span
                            className="grid h-10 w-10 place-items-center rounded-app text-white"
                            style={{ backgroundColor: category.color }}
                          >
                            <CategoryIcon name={category.icon} className="h-5 w-5" />
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {getCategoryName(category.name, t)}
                          </span>
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
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
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
          <div className="grid gap-4">
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

            <div className="app-surface grid gap-3 rounded-app p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-app bg-accent-soft text-accent">
                  <History className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t.settings.automaticBackup}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted">{t.settings.automaticBackupHint}</p>
                </div>
              </div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t.settings.backupHistory}
              </h4>
              {backupSnapshots.length ? (
                <div className="grid gap-2">
                  {backupSnapshots.map((snapshot) => (
                    <article
                      key={snapshot.id}
                      className="app-control grid grid-cols-[1fr_auto] items-center gap-3 rounded-app p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {snapshot.reason === "before-restore"
                            ? t.settings.backupReasonRestore
                            : t.settings.backupReasonAutomatic}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {new Intl.DateTimeFormat(settings.locale, {
                            dateStyle: "medium",
                            timeStyle: "short"
                          }).format(new Date(snapshot.createdAt))}
                          {" · "}
                          {snapshot.backup.transactions.length} {t.settings.backupOperations}
                        </p>
                      </div>
                      <span className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={t.settings.restoreBackup}
                          onClick={() => {
                            if (window.confirm(t.settings.restoreBackupConfirm)) {
                              setImportError("");
                              void onRestoreBackupSnapshot(snapshot.id).catch((cause: unknown) =>
                                setImportError(
                                  cause instanceof Error ? cause.message : t.settings.importError
                                )
                              );
                            }
                          }}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-expense"
                          aria-label={t.settings.deleteBackup}
                          onClick={() => {
                            if (window.confirm(t.settings.deleteBackupConfirm)) {
                              void onDeleteBackupSnapshot(snapshot.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="app-control rounded-app p-4 text-center text-sm text-muted">
                  {t.settings.backupHistoryEmpty}
                </p>
              )}
            </div>
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

      <p className="text-center text-xs font-medium text-muted">
        {t.settings.version} {appVersion}
      </p>

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

      <BottomSheet
        open={organizingCategories}
        title={t.categories.organize}
        onClose={() => setOrganizingCategories(false)}
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setCategoryActionError("");
            if (!sourceCategoryId || !targetCategoryId || sourceCategoryId === targetCategoryId) {
              setCategoryActionError(t.categories.chooseDifferent);
              return;
            }
            void onReplaceCategory(
              sourceCategoryId,
              targetCategoryId,
              categoryActionMode === "merge"
            )
              .then(() => setOrganizingCategories(false))
              .catch((cause: unknown) =>
                setCategoryActionError(
                  cause instanceof Error ? cause.message : t.categories.saveError
                )
              );
          }}
        >
          <SegmentedControl
            value={categoryActionType}
            onChange={setCategoryActionType}
            options={[
              { value: "expense", label: t.common.expense },
              { value: "income", label: t.common.income }
            ]}
          />
          <SegmentedControl
            value={categoryActionMode}
            onChange={setCategoryActionMode}
            options={[
              { value: "replace", label: t.categories.actionReplace },
              { value: "merge", label: t.categories.actionMerge }
            ]}
          />
          <p className="text-sm leading-6 text-muted">
            {categoryActionMode === "merge"
              ? t.categories.mergeDescription
              : t.categories.replaceDescription}
          </p>
          <SelectField
            label={t.categories.source}
            value={sourceCategoryId}
            onChange={(event) => setSourceCategoryId(event.target.value)}
          >
            {groupedCategories[categoryActionType].map((category) => (
              <option key={category.id} value={category.id}>
                {getCategoryName(category.name, t)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={t.categories.target}
            value={targetCategoryId}
            onChange={(event) => setTargetCategoryId(event.target.value)}
          >
            {groupedCategories[categoryActionType].map((category) => (
              <option key={category.id} value={category.id}>
                {getCategoryName(category.name, t)}
              </option>
            ))}
          </SelectField>
          {categoryActionError ? (
            <p className="text-sm font-medium text-expense">{categoryActionError}</p>
          ) : null}
          <Button type="submit" disabled={groupedCategories[categoryActionType].length < 2}>
            {t.categories.applyAction}
          </Button>
        </form>
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
