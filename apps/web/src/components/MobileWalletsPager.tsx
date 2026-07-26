import type {
  Settings,
  Transaction,
  Wallet,
  WalletInput,
  WalletTransfer
} from "@myfinances/types";
import { WalletsView } from "../views/WalletsView";
import { type Dictionary } from "../i18n";

interface MobileWalletsPagerProps {
  wallets: Wallet[];
  transactions: Transaction[];
  transfers: WalletTransfer[];
  settings: Settings;
  t: Dictionary;
  onCreate: (input: WalletInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<WalletInput>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

export function MobileWalletsPager({
  wallets,
  transactions,
  transfers,
  settings,
  t,
  onCreate,
  onUpdate,
  onArchive
}: MobileWalletsPagerProps) {
  return (
    <WalletsView
      wallets={wallets}
      transactions={transactions}
      transfers={transfers}
      settings={settings}
      t={t}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onArchive={onArchive}
    />
  );
}
