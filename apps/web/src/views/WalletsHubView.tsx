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
  WalletReconciliationInput,
  WalletTransfer,
  WalletTransferInput
} from "@myfinances/types";
import { MobileWalletsPager } from "../components/MobileWalletsPager";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import type { Dictionary } from "../i18n";
import type { WalletTab } from "../lib/routes";
import { SavingsGoalsView } from "./SavingsGoalsView";
import { WalletsView } from "./WalletsView";
import { WalletTransfersView } from "./WalletTransfersView";

interface WalletsHubViewProps {
  mode?: WalletTab;
  onModeChange?: (mode: WalletTab) => void;
  initialMode?: "wallets" | "transfers" | "goals";
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
  onReorderWallet?: (orderedIds: string[]) => Promise<void>;
  onReconcileWallet?: (input: WalletReconciliationInput) => Promise<void>;
}

export function WalletsHubView({
  mode: routedMode,
  onModeChange,
  initialMode = "wallets",
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
  onReorderWallet,
  onReconcileWallet,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onContribute,
  onDeleteContribution,
  onCreateTransfer,
  onDeleteTransfer
}: WalletsHubViewProps) {
  const [localMode, setLocalMode] = useState<WalletTab>(initialMode);
  const mode = routedMode ?? localMode;
  const setMode = (next: WalletTab) => { if (onModeChange) onModeChange(next); else setLocalMode(next); };

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
              onReorder={onReorderWallet}
              onReconcile={onReconcileWallet}
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
              onReorder={onReorderWallet}
              onReconcile={onReconcileWallet}
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
