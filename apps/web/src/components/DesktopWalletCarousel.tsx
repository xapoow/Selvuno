import { useMemo, useRef } from "react";
import type { Settings, Transaction, Wallet, WalletTransfer, WalletView } from "@myfinances/types";
import { ChevronLeft, ChevronRight, Layers3 } from "lucide-react";
import { calculateWalletTotals, formatMoney } from "@myfinances/utils";
import { cn } from "../lib/cn";
import { WalletIcon } from "../lib/icons";
import { getCurrencyLabel } from "../lib/currencies";
import { getIncludedWalletIds } from "../lib/walletFeatures";
import type { Dictionary } from "../i18n";

interface DesktopWalletCarouselProps {
  wallets: Wallet[];
  activeWalletId: WalletView;
  transactions: Transaction[];
  transfers: WalletTransfer[];
  settings: Settings;
  t: Dictionary;
  displayCurrency: string;
  onChange: (value: WalletView, direction?: number) => void;
  onAdd: () => void;
}

interface WalletCardItem {
  id: WalletView;
  name: string;
  currency: string;
  balanceMinor: number;
  kind: "all" | "cash" | "credit";
  color?: string;
  icon?: string;
  isAll: boolean;
  creditLimitMinor?: number;
}

export function DesktopWalletCarousel({
  wallets,
  activeWalletId,
  transactions,
  transfers,
  settings,
  t,
  displayCurrency,
  onChange,
  onAdd
}: DesktopWalletCarouselProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const includedWalletIds = useMemo(
    () => getIncludedWalletIds(wallets, settings.advancedWalletsEnabled),
    [wallets, settings.advancedWalletsEnabled]
  );

  const cardItems = useMemo<WalletCardItem[]>(() => {
    // 1. Calculate for "all"
    const allBalanceMinor = wallets
      .filter((w) => !w.deletedAt && includedWalletIds.has(w.id))
      .reduce((sum, wallet) => {
        const totals = calculateWalletTotals(wallet, transactions, transfers);
        return sum + totals.balanceMinor;
      }, 0);

    const allCard: WalletCardItem = {
      id: "all",
      name: t.wallets.allWallets,
      currency: settings.currency,
      balanceMinor: allBalanceMinor,
      kind: "all",
      isAll: true
    };

    const walletCards: WalletCardItem[] = wallets
      .filter((w) => !w.deletedAt)
      .map((wallet) => {
        const totals = calculateWalletTotals(wallet, transactions, transfers);
        return {
          id: wallet.id,
          name: wallet.name,
          currency: wallet.currency,
          balanceMinor: totals.balanceMinor,
          kind: wallet.kind ?? "cash",
          color: wallet.color,
          icon: wallet.icon,
          isAll: false,
          creditLimitMinor: wallet.creditLimitMinor
        };
      });

    return [allCard, ...walletCards];
  }, [wallets, includedWalletIds, transactions, transfers, settings.currency, t.wallets.allWallets]);

  const activeIndex = cardItems.findIndex((item) => item.id === activeWalletId);
  const resolvedIndex = activeIndex >= 0 ? activeIndex : 0;

  function selectByOffset(offset: number) {
    const nextIndex = Math.max(0, Math.min(cardItems.length - 1, resolvedIndex + offset));
    if (nextIndex !== resolvedIndex) {
      onChange(cardItems[nextIndex].id, offset);
      scrollItemIntoView(nextIndex);
    }
  }

  function scrollItemIntoView(index: number) {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll("[data-wallet-card]");
    const target = items[index] as HTMLElement | undefined;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  const canGoPrev = resolvedIndex > 0;
  const canGoNext = resolvedIndex < cardItems.length - 1;

  return (
    <div className="relative mb-6 select-none">
      {/* Header controls for desktop carousel */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t.common.wallet}
          </span>
          <span className="text-xs text-muted/40">•</span>
          <span className="text-xs font-medium text-muted">
            {cardItems.length} {t.common.all.toLowerCase()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => selectByOffset(-1)}
            disabled={!canGoPrev}
            className="app-focus grid h-8 w-8 place-items-center rounded-control text-muted transition hover:bg-elevated/70 hover:text-foreground disabled:opacity-30"
            aria-label="Previous wallet"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => selectByOffset(1)}
            disabled={!canGoNext}
            className="app-focus grid h-8 w-8 place-items-center rounded-control text-muted transition hover:bg-elevated/70 hover:text-foreground disabled:opacity-30"
            aria-label="Next wallet"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cards row / carousel */}
      <div
        ref={containerRef}
        className="no-scrollbar flex gap-3.5 overflow-x-auto pb-2 pt-1 [scrollbar-width:none]"
        role="region"
        aria-label="Wallet cards carousel"
      >
        {cardItems.map((item, index) => {
          const isActive = item.id === activeWalletId;
          const hideAmounts = settings.hideAmounts;
          const formattedBalance = formatMoney(
            item.balanceMinor,
            item.currency,
            settings.locale,
            hideAmounts
          );

          return (
            <div
              key={item.id}
              data-wallet-card
              onClick={() => {
                const direction = index > resolvedIndex ? 1 : -1;
                onChange(item.id, direction);
                scrollItemIntoView(index);
              }}
              className={cn(
                "group relative flex min-w-[240px] max-w-[280px] flex-1 cursor-pointer flex-col justify-between rounded-card p-4 transition-all duration-200",
                isActive
                  ? "app-surface ring-2 ring-accent/30 shadow-iosCard scale-[1.01]"
                  : "app-control opacity-75 hover:opacity-100 hover:scale-[1.005]"
              )}
            >
              {/* Top row: icon + currency badge */}
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-control text-white shadow-sm transition-transform group-hover:scale-105",
                    item.isAll ? "bg-accent" : ""
                  )}
                  style={!item.isAll ? { backgroundColor: item.color ?? "#207a6f" } : undefined}
                >
                  {item.isAll ? (
                    <Layers3 className="h-5 w-5" />
                  ) : (
                    <WalletIcon name={item.icon ?? "wallet-cards"} className="h-5 w-5" />
                  )}
                </span>
                <span className="rounded-full bg-surface/70 px-2 py-0.5 text-xs font-semibold text-muted shadow-sm">
                  {getCurrencyLabel(item.currency)}
                </span>
              </div>

              {/* Bottom row: name + balance */}
              <div className="mt-4">
                <p className="truncate text-xs font-medium text-muted">{item.name}</p>
                <p
                  className={cn(
                    "mt-0.5 truncate text-xl font-bold tracking-tight",
                    item.balanceMinor < 0 ? "text-expense" : "text-foreground"
                  )}
                >
                  {formattedBalance}
                </p>
                {item.kind === "credit" && item.creditLimitMinor ? (
                  <p className="mt-1 text-[11px] font-medium text-muted">
                    Лимит: {formatMoney(item.creditLimitMinor, item.currency, settings.locale, hideAmounts)}
                  </p>
                ) : null}
              </div>

              {/* Active indicator dot */}
              {isActive ? (
                <span className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-accent" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
