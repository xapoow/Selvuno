import { useEffect, useMemo, useRef, type ReactNode } from "react";
import type { Wallet, WalletView } from "@myfinances/types";
import { AnimatePresence, motion } from "framer-motion";
import { Layers3, WalletCards } from "lucide-react";
import { getCurrencyLabel } from "../lib/currencies";

export interface MobileWalletPageOption {
  value: WalletView;
  name: string;
  currency: string;
  kind: "all" | "wallet";
}

interface MobileWalletPagerProps {
  wallets: Wallet[];
  activeWalletId: WalletView;
  allLabel: string;
  allCurrency: string;
  eyebrow?: string;
  includeAll?: boolean;
  onChange: (value: WalletView) => void;
  children: (option: MobileWalletPageOption) => ReactNode;
}

export function getMobileWalletOptions(
  wallets: Wallet[],
  allLabel: string,
  allCurrency: string,
  includeAll = true
): MobileWalletPageOption[] {
  const walletOptions = wallets.map((wallet) => ({
    value: wallet.id,
    name: wallet.name,
    currency: wallet.currency,
    kind: "wallet" as const
  }));

  return includeAll
    ? [{ value: "all", name: allLabel, currency: allCurrency, kind: "all" }, ...walletOptions]
    : walletOptions;
}

export function MobileWalletPager({
  wallets,
  activeWalletId,
  allLabel,
  allCurrency,
  eyebrow,
  includeAll = true,
  onChange,
  children
}: MobileWalletPagerProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollEndRef = useRef<number | null>(null);
  const options = useMemo(
    () => getMobileWalletOptions(wallets, allLabel, allCurrency, includeAll),
    [allCurrency, allLabel, includeAll, wallets]
  );
  const resolvedActiveIndex = options.findIndex((option) => option.value === activeWalletId);
  const activeIndex = resolvedActiveIndex >= 0 ? resolvedActiveIndex : 0;
  const activeOption = options[activeIndex] ?? options[0];
  const ActiveIcon = activeOption?.kind === "all" ? Layers3 : WalletCards;

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const targetLeft = activeIndex * scroller.clientWidth;
    if (Math.abs(scroller.scrollLeft - targetLeft) > 2) {
      scroller.scrollTo({ left: targetLeft, behavior: "smooth" });
    }
  }, [activeIndex]);

  useEffect(
    () => () => {
      if (scrollEndRef.current) {
        window.clearTimeout(scrollEndRef.current);
      }
    },
    []
  );

  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    if (scrollEndRef.current) {
      window.clearTimeout(scrollEndRef.current);
    }
    scrollEndRef.current = window.setTimeout(() => {
      const nextIndex = Math.round(scroller.scrollLeft / scroller.clientWidth);
      const nextOption = options[Math.max(0, Math.min(options.length - 1, nextIndex))];
      if (nextOption && nextOption.value !== activeWalletId) {
        onChange(nextOption.value);
      }
    }, 120);
  }

  if (!activeOption) {
    return null;
  }

  return (
    <div className="grid gap-5">
      <div className="grid justify-items-center gap-2 text-center" aria-live="polite">
        <span className="app-control grid h-9 w-9 place-items-center rounded-app text-accent">
          <ActiveIcon className="h-4 w-4" />
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeOption.value}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="grid gap-0.5"
          >
            {eyebrow ? <p className="text-xs font-semibold uppercase text-muted">{eyebrow}</p> : null}
            <h2 className="text-xl font-semibold leading-tight text-foreground">{activeOption.name}</h2>
            <p className="text-xs font-medium text-muted">{getCurrencyLabel(activeOption.currency)}</p>
          </motion.div>
        </AnimatePresence>
        <div className="flex justify-center gap-1.5" aria-hidden>
          {options.map((option) => (
            <span
              key={option.value}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                option.value === activeOption.value ? "w-5 bg-accent" : "w-1.5 bg-muted/25"
              }`}
            />
          ))}
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={handleScroll}
      >
        {options.map((option) => (
          <section key={option.value} className="w-full shrink-0 snap-center">
            {children(option)}
          </section>
        ))}
      </div>
    </div>
  );
}
