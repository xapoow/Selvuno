import { useEffect, useMemo, useRef } from "react";
import type { Category, Settings, Transaction, Wallet, WalletView } from "@myfinances/types";
import { AnimatePresence, motion } from "framer-motion";
import { Layers3, WalletCards } from "lucide-react";
import { DashboardView } from "../views/DashboardView";
import { type Dictionary } from "../i18n";
import { getCurrencyLabel } from "../lib/currencies";
import { useExchangeRates } from "../lib/exchangeRates";

interface MobileWalletDashboardPagerProps {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  settings: Settings;
  activeWalletId: WalletView;
  allLabel: string;
  t: Dictionary;
  onChange: (value: WalletView) => void;
  onAdd: () => void;
}

interface WalletPageOption {
  value: WalletView;
  name: string;
  currency: string;
  kind: "all" | "wallet";
}

function getWalletOptions(wallets: Wallet[], allLabel: string, allCurrency: string): WalletPageOption[] {
  return [
    { value: "all", name: allLabel, currency: allCurrency, kind: "all" },
    ...wallets.map((wallet) => ({
      value: wallet.id,
      name: wallet.name,
      currency: wallet.currency,
      kind: "wallet" as const
    }))
  ];
}

function MobileWalletDashboardSlide({
  walletView,
  wallets,
  categories,
  transactions,
  settings,
  t,
  onAdd
}: Omit<MobileWalletDashboardPagerProps, "activeWalletId" | "allLabel" | "onChange"> & {
  walletView: WalletView;
}) {
  const activeWallet = walletView === "all" ? undefined : wallets.find((wallet) => wallet.id === walletView);
  const displayCurrency = activeWallet?.currency ?? settings.currency;
  const conversionNeeded = transactions.some(
    (transaction) =>
      !transaction.deletedAt &&
      (walletView === "all" || transaction.walletId === walletView) &&
      transaction.currency.toUpperCase() !== displayCurrency
  );
  const exchangeRates = useExchangeRates(displayCurrency, conversionNeeded);

  return (
    <DashboardView
      wallets={wallets}
      categories={categories}
      transactions={transactions}
      settings={settings}
      activeWalletId={walletView}
      displayCurrency={displayCurrency}
      exchangeRates={exchangeRates.data}
      isUpdatingExchangeRates={exchangeRates.isFetching && conversionNeeded}
      hasExchangeRateError={exchangeRates.isError && conversionNeeded}
      t={t}
      onAdd={onAdd}
    />
  );
}

export function MobileWalletDashboardPager({
  wallets,
  categories,
  transactions,
  settings,
  activeWalletId,
  allLabel,
  t,
  onChange,
  onAdd
}: MobileWalletDashboardPagerProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollEndRef = useRef<number | null>(null);
  const options = useMemo(
    () => getWalletOptions(wallets, allLabel, settings.currency),
    [allLabel, settings.currency, wallets]
  );
  const resolvedActiveIndex = options.findIndex((option) => option.value === activeWalletId);
  const activeIndex = resolvedActiveIndex >= 0 ? resolvedActiveIndex : 0;
  const activeOption = options[activeIndex] ?? options[0];
  const ActiveIcon = activeOption.kind === "all" ? Layers3 : WalletCards;

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
            <MobileWalletDashboardSlide
              walletView={option.value}
              wallets={wallets}
              categories={categories}
              transactions={transactions}
              settings={settings}
              t={t}
              onAdd={onAdd}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
