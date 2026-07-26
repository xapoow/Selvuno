import { useMemo, useState } from "react";
import type { Category } from "@myfinances/types";
import { ChevronDown } from "lucide-react";
import { getCategoryName, type Dictionary } from "../i18n";
import { cn } from "../lib/cn";
import { CategoryIcon } from "../lib/icons";

const PREVIEW_LIMIT = 8;

interface TransactionCategoryPickerProps {
  categories: Category[];
  value: string;
  t: Dictionary;
  onChange: (categoryId: string) => void;
}

export function TransactionCategoryPicker({
  categories,
  value,
  t,
  onChange
}: TransactionCategoryPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleCategories = useMemo(() => {
    if (expanded || categories.length <= PREVIEW_LIMIT) {
      return categories;
    }

    const preview = categories.slice(0, PREVIEW_LIMIT);
    const selected = categories.find((category) => category.id === value);
    if (selected && !preview.some((category) => category.id === selected.id)) {
      preview[PREVIEW_LIMIT - 1] = selected;
    }
    return preview;
  }, [categories, expanded, value]);

  return (
    <fieldset className="grid gap-2.5">
      <legend className="text-sm font-semibold text-foreground">{t.common.category}</legend>
      <div
        role="radiogroup"
        aria-label={t.common.category}
        className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        {visibleCategories.map((category) => {
          const selected = category.id === value;
          return (
            <button
              key={category.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(category.id)}
              className={cn(
                "app-focus app-control grid min-h-20 place-items-center gap-1.5 rounded-app border border-transparent px-2 py-2.5 text-center active:scale-[0.98]",
                selected && "border-accent/60 bg-accent-soft ring-1 ring-accent/15"
              )}
            >
              <span
                className="grid h-9 w-9 place-items-center rounded-app text-white shadow-sm"
                style={{ backgroundColor: category.color }}
              >
                <CategoryIcon name={category.icon} className="h-4 w-4" />
              </span>
              <span className="line-clamp-2 text-xs font-semibold text-foreground">
                {getCategoryName(category.name, t)}
              </span>
            </button>
          );
        })}
      </div>
      {categories.length > PREVIEW_LIMIT ? (
        <button
          type="button"
          className="app-focus mx-auto flex items-center gap-1 rounded-app px-2 py-1 text-xs font-semibold text-muted hover:text-foreground"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? t.transaction.fewerCategories : t.transaction.allCategories}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
        </button>
      ) : null}
    </fieldset>
  );
}
