import { useRef, useState } from "react";
import type { Category } from "@selvuno/types";
import { Bookmark, Check, Search, Trash2 } from "lucide-react";
import { getCategoryName, type Dictionary } from "../i18n";
import { CategoryIcon } from "../lib/icons";
import { getCurrencyLabel } from "../lib/currencies";
import { MAX_SAVED_HISTORY_FILTERS, readHistoryAmountRange, type HistoryFilters, type SavedHistoryFilter } from "../lib/historyFilters";
import { Button } from "./ui/Button";
import { TextField } from "./ui/TextField";
import { SelectField } from "./ui/SelectField";
import { SegmentedControl } from "./ui/SegmentedControl";

interface HistoryFilterFormProps {
  initial: HistoryFilters;
  categories: Category[];
  currencies: string[];
  saved: SavedHistoryFilter[];
  locale: string;
  t: Dictionary;
  onApply: (filters: HistoryFilters) => void;
  onSave: (name: string, filters: HistoryFilters) => void;
  onDeleteSaved: (id: string) => void;
}

export function HistoryFilterForm({ initial, categories, currencies, saved, locale, t, onApply, onSave, onDeleteSaved }: HistoryFilterFormProps) {
  const [draft, setDraft] = useState(initial);
  const [categorySearch, setCategorySearch] = useState("");
  const [name, setName] = useState("");
  const [naming, setNaming] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const activeCategories = categories.filter((item) => !item.deletedAt);
  const availableIds = new Set(activeCategories.map((item) => item.id));
  const hasUnavailable = draft.categoryIds.some((id) => !availableIds.has(id));
  const displayedCategories = activeCategories.filter((item) => getCategoryName(item.name, t).toLocaleLowerCase(locale).includes(categorySearch.toLocaleLowerCase(locale)));
  const currencyChoices = [...new Set([...currencies, draft.currency].map((currency) => currency.toUpperCase()))];

  function apply() {
    if (!readHistoryAmountRange(draft).valid) { setError(t.historyFilters.invalidRange); return; }
    onApply(draft);
  }

  function save() {
    if (saving.current) return;
    if (!readHistoryAmountRange(draft).valid) { setError(t.historyFilters.invalidRange); return; }
    const trimmed = name.trim();
    if (!trimmed) { setError(t.historyFilters.nameRequired); return; }
    if (saved.some((item) => item.name.normalize("NFKC").toLocaleLowerCase(locale) === trimmed.normalize("NFKC").toLocaleLowerCase(locale))) {
      setError(t.historyFilters.duplicateName); return;
    }
    if (saved.length >= MAX_SAVED_HISTORY_FILTERS) { setError(t.historyFilters.limit); return; }
    saving.current = true;
    try { onSave(trimmed, draft); onApply(draft); }
    catch { saving.current = false; setError(t.historyFilters.storageError); }
  }

  return <div className="grid gap-5">
    {saved.length ? <section className="grid gap-2">
      <h3 className="text-sm font-semibold text-foreground">{t.historyFilters.saved}</h3>
      <div className="grid max-h-40 gap-2 overflow-y-auto p-1">
        {saved.map((item) => <div key={item.id} className="app-control flex min-w-0 items-center gap-2 rounded-xl p-2">
          <button type="button" className="app-focus min-w-0 flex-1 rounded-lg p-2 text-left text-sm font-medium text-foreground" onClick={() => onApply(item.filters)}>{item.name}</button>
          <Button type="button" variant="ghost" size="icon" aria-label={`${t.historyFilters.deleteSaved}: ${item.name}`} onClick={() => {
            try { onDeleteSaved(item.id); setError(""); } catch { setError(t.historyFilters.storageError); }
          }}><Trash2 className="h-4 w-4 text-muted" /></Button>
        </div>)}
      </div>
    </section> : null}

    <TextField label={t.history.search} placeholder={t.history.searchPlaceholder} value={draft.query} maxLength={240} onChange={(event) => setDraft({ ...draft, query: event.target.value })} />
    <SegmentedControl value={draft.type} onChange={(type) => setDraft({ ...draft, type })} options={[
      { value: "all", label: t.common.all }, { value: "expense", label: t.common.expense }, { value: "income", label: t.common.income }
    ]} />

    <section className="grid gap-3" aria-label={t.historyFilters.categories}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t.historyFilters.categories}{draft.categoryIds.length ? ` (${draft.categoryIds.length})` : ""}</h3>
        <Button type="button" variant="ghost" size="small" onClick={() => setDraft({ ...draft, categoryIds: [] })}>{t.history.allCategories}</Button>
      </div>
      {activeCategories.length > 6 || categorySearch ? <TextField label={t.historyFilters.categorySearch} value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} /> : null}
      <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto p-1">
        {displayedCategories.map((category) => {
          const selected = draft.categoryIds.includes(category.id);
          return <button key={category.id} type="button" aria-pressed={selected} aria-label={getCategoryName(category.name, t)}
            onClick={() => setDraft({ ...draft, categoryIds: selected ? draft.categoryIds.filter((id) => id !== category.id) : [...draft.categoryIds, category.id] })}
            className={`app-focus flex min-w-0 items-center gap-2 rounded-xl border p-2.5 text-left ${selected ? "app-selected-control border-accent/35" : "border-line text-muted"}`}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white" style={{ backgroundColor: category.color }}><CategoryIcon name={category.icon} className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><span className="block break-words text-xs font-semibold text-foreground">{getCategoryName(category.name, t)}</span><span className="mt-0.5 block text-[10px] text-muted">{category.type === "expense" ? t.common.expense : t.common.income}</span></span>
            {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-accent" /> : null}
          </button>;
        })}
        {!displayedCategories.length ? <p className="col-span-2 py-2 text-xs text-muted">{t.historyFilters.noCategories}</p> : null}
      </div>
      {hasUnavailable ? <div className="rounded-xl bg-warning/10 p-3 text-xs leading-5 text-muted">
        <p>{t.historyFilters.unavailableCategories}</p>
        <Button type="button" variant="ghost" size="small" className="mt-1" onClick={() => setDraft({ ...draft, categoryIds: draft.categoryIds.filter((id) => availableIds.has(id)) })}>{t.historyFilters.removeUnavailable}</Button>
      </div> : null}
    </section>

    <SelectField label={t.historyFilters.attachments} value={draft.attachments} onChange={(event) => setDraft({ ...draft, attachments: event.target.value as HistoryFilters["attachments"] })}>
      <option value="all">{t.common.all}</option><option value="with">{t.historyFilters.withAttachments}</option><option value="without">{t.historyFilters.withoutAttachments}</option>
    </SelectField>

    <section className="app-control grid gap-3 rounded-xl p-3">
      <h3 className="text-sm font-semibold text-foreground">{t.historyFilters.amount}</h3>
      <SelectField label={t.historyFilters.currency} value={draft.currency} onChange={(event) => { setDraft({ ...draft, currency: event.target.value }); setError(""); }}>
        {currencyChoices.map((currency) => <option key={currency} value={currency}>{getCurrencyLabel(currency)}</option>)}
      </SelectField>
      <div className="grid grid-cols-2 gap-3">
        <TextField label={`${t.historyFilters.minimum} (${draft.currency})`} inputMode="decimal" maxLength={48} value={draft.minimum} onChange={(event) => { setDraft({ ...draft, minimum: event.target.value }); setError(""); }} />
        <TextField label={`${t.historyFilters.maximum} (${draft.currency})`} inputMode="decimal" maxLength={48} value={draft.maximum} onChange={(event) => { setDraft({ ...draft, maximum: event.target.value }); setError(""); }} />
      </div>
      <p className="text-xs leading-5 text-muted">{t.historyFilters.amountHint}</p>
    </section>

    <section className="grid gap-3 border-t border-line/60 pt-4">
      {naming ? <><TextField label={t.historyFilters.name} value={name} maxLength={48} onChange={(event) => { setName(event.target.value); setError(""); }} /><p className="text-xs leading-5 text-muted">{t.historyFilters.saveHint}</p></> : null}
      {error ? <p role="alert" className="text-sm text-expense">{error}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="secondary" onClick={() => { if (naming) save(); else { setNaming(true); setError(""); } }}><Bookmark className="h-4 w-4" />{naming ? t.historyFilters.saveApply : t.historyFilters.save}</Button>
        <Button type="button" onClick={apply}><Search className="h-4 w-4" />{t.historyFilters.apply}</Button>
      </div>
    </section>
  </div>;
}
