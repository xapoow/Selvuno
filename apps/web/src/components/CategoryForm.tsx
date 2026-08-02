import { useMemo, useState } from "react";
import type { Category, CategoryInput, TransactionType } from "@myfinances/types";
import { Search } from "lucide-react";
import { CategoryIcon, categoryIconNames } from "../lib/icons";
import { Button } from "./ui/Button";
import { SegmentedControl } from "./ui/SegmentedControl";
import { TextField } from "./ui/TextField";
import type { Dictionary } from "../i18n";

const swatches = ["#207a6f", "#3f73c9", "#b7791f", "#c44a42", "#7b61ff", "#1f8f66"];
const recentColorsKey = "myfinances:recent-category-colors:v1";

function loadRecentColors(): string[] {
  try {
    const stored = window.localStorage.getItem(recentColorsKey);
    return stored ? (JSON.parse(stored) as string[]).filter((value) => /^#[0-9a-f]{6}$/i.test(value)) : [];
  } catch {
    return [];
  }
}

interface CategoryFormProps {
  initial?: Category;
  t: Dictionary;
  submitLabel: string;
  onSubmit: (input: CategoryInput) => Promise<void>;
}

export function CategoryForm({ initial, t, submitLabel, onSubmit }: CategoryFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? swatches[0]);
  const [icon, setIcon] = useState(initial?.icon ?? "sparkles");
  const [iconSearch, setIconSearch] = useState("");
  const [recentColors, setRecentColors] = useState(loadRecentColors);
  const [error, setError] = useState("");
  const visibleIcons = useMemo(() => {
    const normalized = iconSearch.trim().toLowerCase();
    return normalized
      ? categoryIconNames.filter((iconName) => iconName.includes(normalized))
      : categoryIconNames;
  }, [iconSearch]);
  const visibleColors = [...new Set([...recentColors, ...swatches])].slice(0, 8);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({ name: name.trim(), type, color, icon });
      const nextRecentColors = [color, ...recentColors.filter((value) => value !== color)].slice(0, 6);
      setRecentColors(nextRecentColors);
      try {
        window.localStorage.setItem(recentColorsKey, JSON.stringify(nextRecentColors));
      } catch {
        // Recent colors remain available for the current session.
      }
      if (!initial) {
        setName("");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.categories.saveError);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <SegmentedControl
        value={type}
        onChange={setType}
        options={[
          { value: "expense", label: t.common.expense },
          { value: "income", label: t.common.income }
        ]}
      />
      <TextField label={t.common.name} value={name} onChange={(event) => setName(event.target.value)} maxLength={48} />
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium text-foreground">{t.categories.icon}</legend>
        <label className="app-field app-focus flex h-10 items-center gap-2 rounded-app px-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={iconSearch}
            onChange={(event) => setIconSearch(event.target.value)}
            placeholder={t.categories.iconSearch}
            aria-label={t.categories.iconSearch}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
        </label>
        <div className="app-field grid grid-cols-5 gap-2 rounded-app p-2 sm:grid-cols-10">
          {visibleIcons.map((iconName) => {
            const selected = icon === iconName;
            return (
              <button
                key={iconName}
                type="button"
                aria-label={iconName}
                aria-pressed={selected}
                title={iconName}
                onClick={() => setIcon(iconName)}
                className={`app-focus grid aspect-square place-items-center rounded-app ${
                  selected ? "app-navigation-active" : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                <CategoryIcon name={iconName} className="h-5 w-5" />
              </button>
            );
          })}
          {!visibleIcons.length ? (
            <p className="col-span-full py-3 text-center text-sm text-muted">{t.categories.iconSearchEmpty}</p>
          ) : null}
        </div>
      </fieldset>
      <div className="grid gap-2">
        <span className="text-sm font-medium text-foreground">{t.common.color}</span>
        {recentColors.length ? (
          <span className="text-xs font-medium text-muted">{t.categories.recentColors}</span>
        ) : null}
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {visibleColors.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={swatch}
              onClick={() => setColor(swatch)}
              className="app-swatch h-10 rounded-app transition active:scale-[0.98]"
              style={{
                backgroundColor: swatch,
                outline: color === swatch ? "2px solid rgb(var(--color-foreground))" : "none"
              }}
            />
          ))}
        </div>
        <label className="app-field app-focus flex h-11 items-center justify-between rounded-app px-3 text-sm font-medium text-foreground">
          <span>{color.toUpperCase()}</span>
          <input
            type="color"
            aria-label={t.common.color}
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-7 w-9 cursor-pointer rounded-md border-0 bg-transparent p-0"
          />
        </label>
      </div>
      {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
