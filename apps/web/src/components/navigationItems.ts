import { Home, List, PlusCircle, Settings, WalletCards, type LucideIcon } from "lucide-react";
import type { AppView } from "../state/appStore";

export const navigationItems: Array<{ view: AppView; label: string; icon: LucideIcon }> = [
  { view: "dashboard", label: "Home", icon: Home },
  { view: "history", label: "History", icon: List },
  { view: "add", label: "Add", icon: PlusCircle },
  { view: "wallets", label: "Wallets", icon: WalletCards },
  { view: "settings", label: "Settings", icon: Settings }
];
