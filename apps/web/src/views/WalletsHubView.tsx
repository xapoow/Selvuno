import { useState } from "react";
import type {
  SavingsGoal,
  SavingsGoalContribution,
  SavingsGoalContributionInput,
  SavingsGoalInput,
  Settings,
  Transaction,
  Wallet,
  WalletInput
} from "@myfinances/types";
import { MobileWalletsPager } from "../components/MobileWalletsPager";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import type { Dictionary } from "../i18n";
import { SavingsGoalsView } from "./SavingsGoalsView";
import { WalletsView } from "./WalletsView";

interface WalletsHubViewProps {
  wallets: Wallet[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  contributions: SavingsGoalContribution[];
  settings: Settings;
  t: Dictionary;
  onCreateWallet: (input: WalletInput) => Promise<void>;
  onUpdateWallet: (id: string, input: Partial<WalletInput>) => Promise<void>;
  onArchiveWallet: (id: string) => Promise<void>;
  onCreateGoal: (input: SavingsGoalInput) => Promise<void>;
  onUpdateGoal: (id: string, input: SavingsGoalInput) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  onContribute: (input: SavingsGoalContributionInput) => Promise<void>;
  onDeleteContribution: (id: string) => Promise<void>;
}

export function WalletsHubView({
  wallets,
  transactions,
  goals,
  contributions,
  settings,
  t,
  onCreateWallet,
  onUpdateWallet,
  onArchiveWallet,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onContribute,
  onDeleteContribution
}: WalletsHubViewProps) {
  const [mode, setMode] = useState<"wallets" | "goals">("wallets");

  return (
    <div className="grid gap-5">
      <div className="mx-auto w-full max-w-lg">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: "wallets", label: t.goals.tabWallets },
            { value: "goals", label: t.goals.tabGoals }
          ]}
        />
      </div>

      {mode === "wallets" ? (
        <>
          <div className="md:hidden">
            <MobileWalletsPager
              wallets={wallets}
              transactions={transactions}
              settings={settings}
              t={t}
              onCreate={onCreateWallet}
              onUpdate={onUpdateWallet}
              onArchive={onArchiveWallet}
            />
          </div>
          <div className="hidden md:block">
            <WalletsView
              wallets={wallets}
              transactions={transactions}
              settings={settings}
              t={t}
              onCreate={onCreateWallet}
              onUpdate={onUpdateWallet}
              onArchive={onArchiveWallet}
            />
          </div>
        </>
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
