import {
  Banknote,
  Briefcase,
  Car,
  Gift,
  HeartPulse,
  Home,
  Laptop,
  LucideIcon,
  ShoppingBasket,
  Sparkles,
  Utensils
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  banknote: Banknote,
  briefcase: Briefcase,
  car: Car,
  gift: Gift,
  "heart-pulse": HeartPulse,
  home: Home,
  laptop: Laptop,
  "shopping-basket": ShoppingBasket,
  sparkles: Sparkles,
  utensils: Utensils
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}

export const categoryIconNames = Object.keys(icons);
