import type { Wallet, WalletView } from "@myfinances/types";
import { cn } from "../lib/cn";

interface WalletSwitcherProps {
  wallets: Wallet[];
  value: WalletView;
  allLabel: string;
  onChange: (value: WalletView) => void;
}

export function WalletSwitcher({ wallets, value, allLabel, onChange }: WalletSwitcherProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1">
      <div className="flex min-w-max gap-2">
        <button
          type="button"
          onClick={() => onChange("all")}
          className={cn(
            "h-10 rounded-app border border-line bg-surface px-4 text-sm font-medium text-muted transition active:scale-[0.98]",
            value === "all" && "border-foreground bg-foreground text-background"
          )}
        >
          {allLabel}
        </button>
        {wallets.map((wallet) => (
          <button
            key={wallet.id}
            type="button"
            onClick={() => onChange(wallet.id)}
            className={cn(
              "h-10 rounded-app border border-line bg-surface px-4 text-sm font-medium text-muted transition active:scale-[0.98]",
              value === wallet.id && "border-foreground bg-foreground text-background"
            )}
          >
            {wallet.name}
          </button>
        ))}
      </div>
    </div>
  );
}
