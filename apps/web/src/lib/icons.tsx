import {
  Banknote,
  Briefcase,
  Car,
  CircleDollarSign,
  Coins,
  CreditCard,
  Gift,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  LucideIcon,
  PiggyBank,
  ShoppingBasket,
  Sparkles,
  Utensils,
  WalletCards
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  banknote: Banknote,
  briefcase: Briefcase,
  car: Car,
  "circle-dollar-sign": CircleDollarSign,
  coins: Coins,
  "credit-card": CreditCard,
  gift: Gift,
  "heart-pulse": HeartPulse,
  home: Home,
  landmark: Landmark,
  laptop: Laptop,
  "piggy-bank": PiggyBank,
  "shopping-basket": ShoppingBasket,
  sparkles: Sparkles,
  utensils: Utensils,
  "wallet-cards": WalletCards
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}

export function WalletIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? WalletCards;
  return <Icon className={className} aria-hidden="true" />;
}

export const categoryIconNames = [
  "banknote",
  "briefcase",
  "car",
  "gift",
  "heart-pulse",
  "home",
  "laptop",
  "shopping-basket",
  "sparkles",
  "utensils"
];

export const walletIconNames = [
  "wallet-cards",
  "credit-card",
  "landmark",
  "piggy-bank",
  "banknote",
  "coins",
  "circle-dollar-sign",
  "briefcase",
  "home"
];
