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
  archivedWallets: Wallet[];
  transactions: Transaction[];
  transfers: WalletTransfer[];
  settings: Settings;
  t: Dictionary;
  onCreate: (input: WalletInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<WalletInput>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onReorder?: (orderedIds: string[]) => Promise<void>;
}

export function MobileWalletsPager({
  wallets,
  archivedWallets,
  transactions,
  transfers,
  settings,
  t,
  onCreate,
  onUpdate,
  onArchive,
  onRestore,
  onReorder
}: MobileWalletsPagerProps) {
  return (
    <WalletsView
      wallets={wallets}
      archivedWallets={archivedWallets}
      transactions={transactions}
      transfers={transfers}
      settings={settings}
      t={t}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onArchive={onArchive}
      onRestore={onRestore}
      onReorder={onReorder}
    />
  );
}
