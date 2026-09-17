import { useEffect, useState } from "react";
import type {
  Category,
  Settings,
  TransactionTemplate,
  TransactionTemplateInput,
  TransactionType,
  Wallet
} from "@myfinances/types";
import { decimalToMinor, formatMoney } from "@myfinances/utils";
import { LayoutTemplate, Plus, Trash2 } from "lucide-react";
import { getCategoryName, type Dictionary } from "../i18n";
import { evaluateAmountExpression } from "../lib/amountExpression";
import { CategoryIcon } from "../lib/icons";
import { formatTagsInput, parseTagsInput } from "../lib/tags";
import { TransactionCategoryPicker } from "./TransactionCategoryPicker";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import { SegmentedControl } from "./ui/SegmentedControl";
import { TextField } from "./ui/TextField";

interface TransactionTemplateManagerProps {
  wallet: Wallet;
  categories: Category[];
  templates: TransactionTemplate[];
  settings: Settings;
  t: Dictionary;
  onCreate: (input: TransactionTemplateInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TransactionTemplateManager({
  wallet,
  categories,
  templates,
  settings,
  t,
  onCreate,
  onDelete
}: TransactionTemplateManagerProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const typeCategories = categories.filter((category) => category.type === type);
  const walletTemplates = templates.filter((template) => template.walletId === wallet.id);

  useEffect(() => {
    if (!typeCategories.some((category) => category.id === categoryId)) {
      setCategoryId(typeCategories[0]?.id ?? "");
    }
  }, [categoryId, typeCategories]);

  const resetForm = () => {
    setName("");
    setAmount("");
    setNote("");
    setTags("");
    setError("");
    setCreating(false);
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-6 text-muted">{t.transaction.templateManagerHint}</p>
        {!creating ? (
          <Button size="small" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            {t.transaction.newTemplate}
          </Button>
        ) : null}
      </div>

      {creating ? (
        <form
          className="app-control grid gap-4 rounded-2xl p-3 sm:p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            if (!name.trim() || !categoryId) {
              setError(t.transaction.templateRequired);
              return;
            }
            let amountMinor: number | undefined;
            try {
              amountMinor = amount.trim()
                ? decimalToMinor(evaluateAmountExpression(amount), wallet.currency)
                : undefined;
            } catch {
              setError(t.transaction.calculatorError);
              return;
            }
            void onCreate({
              name: name.trim(),
              walletId: wallet.id,
              categoryId,
              type,
              amountMinor,
              currency: wallet.currency,
              note: note.trim() || undefined,
              tags: parseTagsInput(tags)
            })
              .then(resetForm)
              .catch((cause: unknown) =>
                setError(cause instanceof Error ? cause.message : t.transaction.templateSaveError)
              );
          }}
        >
          <TextField
            label={t.transaction.templateName}
            value={name}
            placeholder={t.transaction.templateNamePlaceholder}
            maxLength={48}
            onChange={(event) => setName(event.target.value)}
          />
          <SegmentedControl
            value={type}
            onChange={setType}
            options={[
              { value: "expense", label: t.common.expense },
              { value: "income", label: t.common.income }
            ]}
          />
          <TransactionCategoryPicker
            categories={typeCategories}
            value={categoryId}
            t={t}
            onChange={setCategoryId}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={`${t.transaction.templateAmount} (${wallet.currency})`}
              value={amount}
              inputMode="decimal"
              placeholder={t.transaction.templateAmountPlaceholder}
              onChange={(event) => setAmount(event.target.value)}
            />
            <TextField
              label={t.common.note}
              value={note}
              maxLength={240}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <TextField
            label={t.transaction.tags}
            value={tags}
            placeholder={t.transaction.tagsPlaceholder}
            maxLength={220}
            onChange={(event) => setTags(event.target.value)}
          />
          {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {t.transaction.saveTemplate}
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm}>
              {t.common.cancel}
            </Button>
          </div>
        </form>
      ) : null}

      {walletTemplates.length ? (
        <div className="grid gap-2">
          {walletTemplates.map((template) => {
            const category = categories.find((item) => item.id === template.categoryId);
            return (
              <article
                key={template.id}
                className="app-control grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl p-3"
              >
                <span
                  className="grid h-10 w-10 place-items-center rounded-lg text-white"
                  style={{ backgroundColor: category?.color ?? "#676761" }}
                >
                  <CategoryIcon name={category?.icon ?? "sparkles"} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{template.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {getCategoryName(category?.name, t)}
                    {template.amountMinor
                      ? ` · ${formatMoney(
                          template.amountMinor,
                          template.currency,
                          settings.locale,
                          settings.hideAmounts
                        )}`
                      : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-expense"
                  aria-label={t.common.delete}
                  onClick={() => {
                    if (window.confirm(t.transaction.confirmDeleteTemplate)) {
                      void onDelete(template.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </article>
            );
          })}
        </div>
      ) : !creating ? (
        <EmptyState icon={LayoutTemplate} title={t.transaction.templateEmpty} />
      ) : null}
    </div>
  );
}
