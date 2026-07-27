import { useState } from "react";
import type {
  SavingsGoal,
  SavingsGoalContribution,
  SavingsGoalContributionInput,
  SavingsGoalInput,
  Settings,
  Transaction,
  Wallet,
  WalletInput,
  WalletTransfer,
  WalletTransferInput
} from "@myfinances/types";
import { MobileWalletsPager } from "../components/MobileWalletsPager";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import type { Dictionary } from "../i18n";
import { SavingsGoalsView } from "./SavingsGoalsView";
import { WalletsView } from "./WalletsView";
import { WalletTransfersView } from "./WalletTransfersView";

interface WalletsHubViewProps {
  wallets: Wallet[];
  archivedWallets: Wallet[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  contributions: SavingsGoalContribution[];
  transfers: WalletTransfer[];
  settings: Settings;
  t: Dictionary;
  onCreateWallet: (input: WalletInput) => Promise<void>;
  onUpdateWallet: (id: string, input: Partial<WalletInput>) => Promise<void>;
  onArchiveWallet: (id: string) => Promise<void>;
  onRestoreWallet: (id: string) => Promise<void>;
  onCreateGoal: (input: SavingsGoalInput) => Promise<void>;
  onUpdateGoal: (id: string, input: SavingsGoalInput) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  onContribute: (input: SavingsGoalContributionInput) => Promise<void>;
  onDeleteContribution: (id: string) => Promise<void>;
  onCreateTransfer: (input: WalletTransferInput) => Promise<void>;
  onDeleteTransfer: (id: string) => Promise<void>;
}

export function WalletsHubView({
  wallets,
  archivedWallets,
  transactions,
  goals,
  contributions,
  transfers,
  settings,
  t,
  onCreateWallet,
  onUpdateWallet,
  onArchiveWallet,
  onRestoreWallet,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onContribute,
  onDeleteContribution,
  onCreateTransfer,
  onDeleteTransfer
}: WalletsHubViewProps) {
  const [mode, setMode] = useState<"wallets" | "transfers" | "goals">("wallets");

  return (
    <div className="grid gap-5">
      <div className="mx-auto w-full max-w-lg">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: "wallets", label: t.goals.tabWallets },
            { value: "transfers", label: t.wallets.transfers },
            { value: "goals", label: t.goals.tabGoals }
          ]}
        />
      </div>

      {mode === "wallets" ? (
        <>
          <div className="md:hidden">
            <MobileWalletsPager
              wallets={wallets}
              archivedWallets={archivedWallets}
              transactions={transactions}
              transfers={transfers}
              settings={settings}
              t={t}
              onCreate={onCreateWallet}
              onUpdate={onUpdateWallet}
              onArchive={onArchiveWallet}
              onRestore={onRestoreWallet}
            />
          </div>
          <div className="hidden md:block">
            <WalletsView
              wallets={wallets}
              archivedWallets={archivedWallets}
              transactions={transactions}
              transfers={transfers}
              settings={settings}
              t={t}
              onCreate={onCreateWallet}
              onUpdate={onUpdateWallet}
              onArchive={onArchiveWallet}
              onRestore={onRestoreWallet}
            />
          </div>
        </>
      ) : mode === "transfers" ? (
        <WalletTransfersView
          wallets={wallets}
          transfers={transfers}
          settings={settings}
          t={t}
          onCreate={onCreateTransfer}
          onDelete={onDeleteTransfer}
        />
      ) : (
        <SavingsGoalsView
          wallets={wallets}
          goals={goals}
          contributions={contributions}
          settings={settings}
          t={t}
          onCreate={onCreateGoal}
          onUpdate={onUpdateGoal}
          onDelete={onDeleteGoal}
          onContribute={onContribute}
          onDeleteContribution={onDeleteContribution}
        />
      )}
    </div>
  );
}
