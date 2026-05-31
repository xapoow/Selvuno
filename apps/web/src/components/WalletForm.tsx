import { useState } from "react";
import type { Wallet, WalletInput } from "@myfinances/types";
import { Button } from "./ui/Button";
import { TextField } from "./ui/TextField";

interface WalletFormProps {
  initial?: Wallet;
  defaultCurrency: string;
  submitLabel: string;
  onSubmit: (input: WalletInput) => Promise<void>;
}

export function WalletForm({ initial, defaultCurrency, submitLabel, onSubmit }: WalletFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? defaultCurrency);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({ name: name.trim(), currency: currency.trim().toUpperCase() });
      if (!initial) {
        setName("");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save wallet.");
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} maxLength={64} />
      <TextField
        label="Currency"
        value={currency}
        onChange={(event) => setCurrency(event.target.value)}
        maxLength={3}
      />
      {error ? <p className="text-sm font-medium text-expense">{error}</p> : null}
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
