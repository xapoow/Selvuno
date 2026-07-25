import { useState } from "react";
import type { Category, CategoryInput, TransactionType } from "@myfinances/types";
import { categoryIconNames } from "../lib/icons";
import { Button } from "./ui/Button";
import { SelectField } from "./ui/SelectField";
import { SegmentedControl } from "./ui/SegmentedControl";
import { TextField } from "./ui/TextField";
import type { Dictionary } from "../i18n";

const swatches = ["#207a6f", "#3f73c9", "#b7791f", "#c44a42", "#7b61ff", "#1f8f66"];

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
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({ name: name.trim(), type, color, icon });
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
      <SelectField label={t.categories.icon} value={icon} onChange={(event) => setIcon(event.target.value)}>
        {categoryIconNames.map((iconName) => (
          <option key={iconName} value={iconName}>
            {iconName}
          </option>
        ))}
      </SelectField>
      <div className="grid gap-2">
        <span className="text-sm font-medium text-foreground">{t.common.color}</span>
        <div className="grid grid-cols-6 gap-2">
          {swatches.map((swatch) => (
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
