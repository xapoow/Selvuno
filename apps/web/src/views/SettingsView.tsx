import { useEffect, useMemo, useRef, useState } from "react";
import { HomeLayoutSettings } from "../components/HomeLayoutSettings";
import { EXPORT_PREFIX } from "../lib/brand";
import { motion, Reorder, useDragControls } from "framer-motion";
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
} from "@selvuno/types";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Cloud,
  Combine,
  DatabaseBackup,
  Edit3,
  FileDown,
  FileUp,
  GripVertical,
  History,
  LoaderCircle,
  Menu,
  Palette,
  RotateCcw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  Trash2,
  Zap,
  type LucideIcon
} from "lucide-react";
import { CategoryIcon } from "../lib/icons";
import { currencyOptions, getCurrencyLabel } from "../lib/currencies";
import { applyRootVisualTheme } from "../lib/colorThemes";
import { ColorThemePicker } from "../components/ColorThemePicker";
import { CategoryForm } from "../components/CategoryForm";
import { AutomationSettingsPanel } from "../components/AutomationSettingsPanel";
import { FeatureSettingsPanel } from "../components/FeatureSettingsPanel";
import { PrivacySettingsPanel } from "../components/PrivacySettingsPanel";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Section } from "../components/ui/Section";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { SelectField } from "../components/ui/SelectField";
import { appVersion, getCategoryName, languageOptions, type Dictionary, type SettingsTab } from "../i18n";
import type { PrivacyLockController } from "../state/usePrivacyLock";

interface SettingsViewProps {
  activeTab?: SettingsTab;
  onTabChange?: (tab: SettingsTab) => void;
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
  onOpenTrash?: () => void;
  deletedCount?: number;
}

const timeZoneOptions = ["UTC", "Europe/Warsaw", "Europe/Berlin", "America/New_York", "Asia/Tokyo"];
const settingsTabs: Array<{ value: SettingsTab; icon: LucideIcon }> = [
  { value: "general", icon: Settings2 },
  { value: "appearance", icon: Palette },
  { value: "automation", icon: Zap },
  { value: "features", icon: SlidersHorizontal },
  { value: "privacy", icon: ShieldCheck },
  { value: "categories", icon: Tags },
  { value: "backup", icon: DatabaseBackup },
  { value: "sync", icon: Cloud }
];

type SettingsSaveState = "idle" | "saving" | "saved" | "error";

interface ReorderCategoryRowProps {
  category: Category;
  t: Dictionary;
  onDragEnd: () => void;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
}

function ReorderCategoryRow({
  category,
  t,
  onDragEnd,
  onEdit,
  onDelete
}: ReorderCategoryRowProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      key={category.id}
      value={category.id}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      className="app-surface grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-xl p-3"
    >
      <button
        type="button"
        onPointerDown={(event) => dragControls.start(event)}
        className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted transition hover:text-foreground focus:outline-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span
        className="grid h-10 w-10 place-items-center rounded-lg text-white"
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
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onEdit(category)}
          aria-label={t.categories.editTitle}
        >
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-expense"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onDelete(category.id)}
          aria-label={t.common.delete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </span>
    </Reorder.Item>
  );
}

export function SettingsView({
  activeTab: routedTab,
  onTabChange,
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
  onDeleteBackupSnapshot,
  onOpenTrash,
  deletedCount = 0
}: SettingsViewProps) {
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [organizingCategories, setOrganizingCategories] = useState(false);
  const [categoryActionType, setCategoryActionType] = useState<TransactionType>("expense");
  const [categoryActionMode, setCategoryActionMode] = useState<"replace" | "merge">("replace");
  const [sourceCategoryId, setSourceCategoryId] = useState("");
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [categoryActionError, setCategoryActionError] = useState("");
  const [categoryListError, setCategoryListError] = useState("");
  const [categoryOrder, setCategoryOrder] = useState<Record<TransactionType, string[]>>({
    expense: [],
    income: []
  });
  const [localTab, setLocalTab] = useState<SettingsTab>("general");
  const activeTab = routedTab ?? localTab;
  const setActiveTab = (tab: SettingsTab) => { if (onTabChange) onTabChange(tab); else setLocalTab(tab); };
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [settingsSaveState, setSettingsSaveState] = useState<SettingsSaveState>("idle");
  const [visualTheme, setVisualTheme] = useState<ThemePreference>(settings.theme);
  const [visualColorTheme, setVisualColorTheme] = useState<ColorThemePreference>(settings.colorTheme);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const settingsTopRef = useRef<HTMLDivElement | null>(null);
  const pendingSettingsTabRef = useRef<SettingsTab | null>(null);
  const saveRevisionRef = useRef(0);
  const saveStateTimerRef = useRef<number | null>(null);
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
  const activeTabMeta = settingsTabs.find((tab) => tab.value === activeTab) ?? settingsTabs[0];
  const ActiveTabIcon = activeTabMeta.icon;

  useEffect(() => {
    // Browser navigation must not leave an old menu selection queued.
    pendingSettingsTabRef.current = null;
    setSettingsMenuOpen(false);
  }, [routedTab]);

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

  useEffect(
    () => () => {
      if (saveStateTimerRef.current !== null) {
        window.clearTimeout(saveStateTimerRef.current);
      }
    },
    []
  );

  async function updateSettings(update: SettingsUpdate) {
    const revision = saveRevisionRef.current + 1;
    saveRevisionRef.current = revision;
    if (saveStateTimerRef.current !== null) {
      window.clearTimeout(saveStateTimerRef.current);
    }
    setSettingsSaveState("saving");
    try {
      await onUpdateSettings(update);
      if (saveRevisionRef.current === revision) {
        setSettingsSaveState("saved");
        saveStateTimerRef.current = window.setTimeout(() => {
          setSettingsSaveState("idle");
          saveStateTimerRef.current = null;
        }, 1800);
      }
    } catch (cause) {
      if (saveRevisionRef.current === revision) {
        setSettingsSaveState("error");
      }
      throw cause;
    }
  }

  function selectSettingsTab(tab: SettingsTab) {
    setActiveTab(tab);
    setSettingsMenuOpen(false);
    window.requestAnimationFrame(() => {
      settingsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function finishSettingsMenuExit() {
    const tab = pendingSettingsTabRef.current;
    pendingSettingsTabRef.current = null;
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
      window.requestAnimationFrame(() => {
        settingsTopRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
      });
    }
  }

  function handleThemeChange(theme: ThemePreference) {
    setVisualTheme(theme);
    applyRootVisualTheme(theme, visualColorTheme);
    void updateSettings({ theme }).catch(() => {
      setVisualTheme(settings.theme);
      applyRootVisualTheme(settings.theme, settings.colorTheme);
    });
  }

  function handleColorThemeChange(colorTheme: ColorThemePreference) {
    setVisualColorTheme(colorTheme);
    applyRootVisualTheme(visualTheme, colorTheme);
    void updateSettings({ colorTheme }).catch(() => {
      setVisualColorTheme(settings.colorTheme);
      applyRootVisualTheme(settings.theme, settings.colorTheme);
    });
  }

  async function handleExport() {
    setImportError("");
    try {
      const backup = await onExportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${EXPORT_PREFIX}-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.hidden = true;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (cause) {
      setImportError(cause instanceof Error ? cause.message : t.settings.exportError);
    }
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

  async function saveCategoryOrder(type: TransactionType) {
    setCategoryListError("");
    try {
      await onReorderCategories(type, categoryOrder[type]);
    } catch {
      setCategoryListError(t.categories.saveError);
      setCategoryOrder((current) => ({
        ...current,
        [type]: groupedCategories[type].map((category) => category.id)
      }));
    }
  }

  return (
    <div ref={settingsTopRef} className="grid scroll-mt-4 gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-foreground">{t.settings.title}</h2>
          <p
            className={`mt-1 flex min-h-5 items-center gap-1.5 text-xs ${
              settingsSaveState === "error" ? "text-expense" : "text-muted"
            }`}
            aria-live="polite"
          >
            {settingsSaveState === "saving" ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : settingsSaveState === "saved" ? (
              <Check className="h-3.5 w-3.5 text-income" />
            ) : settingsSaveState === "error" ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : null}
            <span>
              {settingsSaveState === "saving"
                ? t.settings.saving
                : settingsSaveState === "saved"
                  ? t.settings.saved
                  : settingsSaveState === "error"
                    ? t.settings.saveError
                    : t.settings.tabs[activeTab]}
            </span>
          </p>
        </div>
        <Button
          variant="secondary"
          className="h-11 max-w-[min(68vw,240px)] gap-2 px-3 md:hidden"
          onClick={() => setSettingsMenuOpen(true)}
          aria-label={`${t.settings.section}: ${t.settings.tabs[activeTab]}`}
          aria-expanded={settingsMenuOpen}
        >
          <ActiveTabIcon className="h-4 w-4 shrink-0 text-accent" />
          <span className="min-w-0 truncate">{t.settings.tabs[activeTab]}</span>
          <Menu className="h-4 w-4 shrink-0 text-muted" />
        </Button>
      </div>

      <BottomSheet
        open={settingsMenuOpen}
        title={t.settings.section}
        closeLabel={t.common.close}
        onClose={() => {
          pendingSettingsTabRef.current = null;
          setSettingsMenuOpen(false);
        }}
        onExitComplete={finishSettingsMenuExit}
      >
        <nav className="grid grid-cols-2 gap-2" aria-label={t.settings.section}>
          {settingsTabs.map((tab) => {
            const isActive = activeTab === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  pendingSettingsTabRef.current = tab.value;
                  setSettingsMenuOpen(false);
                }}
                className={`app-focus relative flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center text-xs font-medium active:scale-[0.98] ${
                  isActive
                    ? "app-selected-control border-accent/25 text-foreground"
                    : "border-line/60 text-muted hover:bg-elevated/70 hover:text-foreground"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                    isActive ? "bg-accent-soft text-accent" : "bg-elevated/70"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 leading-4">{t.settings.tabs[tab.value]}</span>
                {isActive ? (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
                ) : null}
              </button>
            );
          })}
        </nav>
        <p className="mt-4 border-t border-line/60 pt-3 text-center text-xs font-medium text-muted">
          {t.settings.version} {appVersion}
        </p>
      </BottomSheet>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <aside className="app-surface sticky top-5 hidden rounded-2xl p-2 lg:block">
          <nav className="grid gap-1" aria-label={t.settings.section}>
            {settingsTabs.map((tab) => {
              const isActive = activeTab === tab.value;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => selectSettingsTab(tab.value)}
                  className={`app-focus flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium active:scale-[0.98] ${
                    isActive
                      ? "app-selected-control text-foreground"
                      : "text-muted hover:bg-elevated/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate">{t.settings.tabs[tab.value]}</span>
                </button>
              );
            })}
          </nav>
          <p className="mt-3 border-t border-line/60 px-3 pt-3 text-xs font-medium text-muted">
            {t.settings.version} {appVersion}
          </p>
        </aside>

        <div className="grid min-w-0 gap-5">
          <div className="-mx-4 hidden overflow-x-auto px-4 pb-1 no-scrollbar md:block lg:hidden">
            <div className="app-control flex min-w-max gap-1 rounded-xl p-1">
              {settingsTabs.map((tab) => {
                const isActive = activeTab === tab.value;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => selectSettingsTab(tab.value)}
                    className={`app-focus flex h-10 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium active:scale-[0.98] ${
                      isActive
                        ? "app-selected-control text-foreground"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.settings.tabs[tab.value]}
                  </button>
                );
              })}
            </div>
          </div>

          <motion.div
            key={activeTab}
            className="grid min-w-0 gap-5 gpu-layer"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
      {activeTab === "general" ? (
        <Section title={t.settings.general}>
          <div className="app-surface grid gap-4 rounded-2xl p-4 sm:grid-cols-2">
            <SelectField
              label={t.common.language}
              value={settings.locale}
              onChange={(event) =>
                void updateSettings({ locale: event.target.value }).catch(() => undefined)
              }
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
              onChange={(event) =>
                void updateSettings({ currency: event.target.value }).catch(() => undefined)
              }
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
                void updateSettings({
                  dateFormat: event.target.value as DateFormatPreference
                }).catch(() => undefined)
              }
            >
              <option value="short">{t.settings.dateFormats.short}</option>
              <option value="medium">{t.settings.dateFormats.medium}</option>
              <option value="long">{t.settings.dateFormats.long}</option>
            </SelectField>
            <SelectField
              label={t.common.timeZone}
              value={settings.timeZone}
              onChange={(event) =>
                void updateSettings({ timeZone: event.target.value }).catch(() => undefined)
              }
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

      {activeTab === "general" && onOpenTrash ? (
        <button type="button" onClick={onOpenTrash} aria-label={t.undo.openTrash} className="app-surface app-focus flex w-full items-center gap-3 rounded-2xl p-4 text-left">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><Trash2 className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{t.undo.trash}</span><span className="mt-1 block text-xs leading-5 text-muted">{t.undo.entryHint}</span></span>
          <span className="app-control rounded-full px-2.5 py-1 text-xs font-semibold text-muted">{deletedCount}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
        </button>
      ) : null}

      {activeTab === "appearance" ? (
        <>
          <Section title={t.settings.appearance}>
            <div className="app-surface grid gap-4 rounded-2xl p-4">
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
          <Section title={t.homeLayout.title}>
            <HomeLayoutSettings settings={settings} t={t} onUpdateSettings={updateSettings} />
          </Section>
        </>
      ) : null}

      {activeTab === "privacy" ? (
        <Section title={t.settings.privacy}>
          <PrivacySettingsPanel
            settings={settings}
            privacy={privacy}
            t={t}
            onUpdateSettings={updateSettings}
          />
        </Section>
      ) : null}

      {activeTab === "automation" ? (
        <Section title={t.settings.automation}>
          <AutomationSettingsPanel
            settings={settings}
            t={t}
            onUpdateSettings={updateSettings}
          />
        </Section>
      ) : null}

      {activeTab === "features" ? (
        <Section title={t.settings.features}>
          <FeatureSettingsPanel
            settings={settings}
            t={t}
            onUpdateSettings={updateSettings}
          />
        </Section>
      ) : null}

      {activeTab === "categories" ? (
        <Section
          title={t.categories.title}
          action={
            <span className="flex flex-wrap gap-2">
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
              {categoryListError ? (
                <p className="text-sm font-medium text-expense" role="alert">
                  {categoryListError}
                </p>
              ) : null}
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
                        <ReorderCategoryRow
                          key={category.id}
                          category={category}
                          t={t}
                          onDragEnd={() => void saveCategoryOrder(type)}
                          onEdit={setEditingCategory}
                          onDelete={(id) => {
                            if (window.confirm(t.categories.confirmDelete)) {
                              setCategoryListError("");
                              void onDeleteCategory(id).catch(() =>
                                setCategoryListError(t.categories.saveError)
                              );
                            }
                          }}
                        />
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
            <div className="app-surface grid gap-3 rounded-2xl p-4 sm:grid-cols-2">
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

            <div className="app-surface grid gap-3 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
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
                      className="app-control grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl p-3"
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
                              setImportError("");
                              void onDeleteBackupSnapshot(snapshot.id).catch((cause: unknown) =>
                                setImportError(
                                  cause instanceof Error ? cause.message : t.settings.deleteBackupError
                                )
                              );
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
                <p className="app-control rounded-xl p-4 text-center text-sm text-muted">
                  {t.settings.backupHistoryEmpty}
                </p>
              )}
            </div>
          </div>
        </Section>
      ) : null}

      {activeTab === "sync" ? (
        <Section title={t.settings.sync}>
          <div className="app-surface rounded-2xl p-5">
            <p className="text-sm font-semibold uppercase text-muted">{t.settings.comingSoon}</p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">{t.settings.syncTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              {t.settings.syncBody}
            </p>
          </div>
        </Section>
      ) : null}

            <p className="text-center text-xs font-medium text-muted lg:hidden">
              {t.settings.version} {appVersion}
            </p>
          </motion.div>
        </div>
      </div>

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

    </div>
  );
}
