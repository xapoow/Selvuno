import { useEffect, useMemo, useRef, useState } from "react";
import type { Settings, Transaction, Wallet, WalletTransfer, WalletView } from "@myfinances/types";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Layers3, ShieldCheck, WalletCards } from "lucide-react";
import { calculateWalletTotals, formatMoney } from "@myfinances/utils";
import { cn } from "../lib/cn";
import { WalletIcon } from "../lib/icons";
import { getCurrencyLabel } from "../lib/currencies";
import { getIncludedWalletIds, shouldHideWalletAmounts } from "../lib/walletFeatures";
import type { Dictionary } from "../i18n";

interface MonobankWalletCarouselProps {
  wallets: Wallet[];
  activeWalletId: WalletView;
  transactions: Transaction[];
  transfers: WalletTransfer[];
  settings: Settings;
  t: Dictionary;
  onChange: (value: WalletView, direction?: number) => void;
  className?: string;
}

export interface MonobankCardData {
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

const cardVariants = {
  enter: (dir: number) => ({
    x: (dir || 1) > 0 ? 440 : -440,
    opacity: 0,
    scale: 0.94
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (dir: number) => ({
    zIndex: 0,
    x: (dir || 1) > 0 ? -440 : 440,
    opacity: 0,
    scale: 0.94
  })
};

export function MonobankWalletCarousel({
  wallets,
  activeWalletId,
  transactions,
  transfers,
  settings,
  t,
  onChange,
  className
}: MonobankWalletCarouselProps) {
  const [transitionDirection, setTransitionDirection] = useState(1);
  const [internalActiveId, setInternalActiveId] = useState<WalletView>(activeWalletId);

  useEffect(() => {
    setInternalActiveId(activeWalletId);
  }, [activeWalletId]);

  const includedWalletIds = useMemo(
    () => getIncludedWalletIds(wallets, settings.advancedWalletsEnabled),
    [wallets, settings.advancedWalletsEnabled]
  );

  const cardItems = useMemo<MonobankCardData[]>(() => {
    // 1. Calculate for "all"
    const allBalanceMinor = wallets
      .filter((w) => !w.deletedAt && includedWalletIds.has(w.id))
      .reduce((sum, wallet) => {
        const totals = calculateWalletTotals(wallet, transactions, transfers);
        return sum + totals.balanceMinor;
      }, 0);

    const allCard: MonobankCardData = {
      id: "all",
      name: t.wallets.allWallets,
      currency: settings.currency,
      balanceMinor: allBalanceMinor,
      kind: "all",
      isAll: true
    };

    // 2. Individual wallet cards
    const individualCards: MonobankCardData[] = wallets
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

    return [allCard, ...individualCards];
  }, [wallets, transactions, transfers, settings.currency, includedWalletIds, t.wallets.allWallets]);

  const rawIndex = cardItems.findIndex((item) => item.id === internalActiveId);
  const resolvedIndex = rawIndex >= 0 ? rawIndex : 0;
  const currentCard = cardItems[resolvedIndex] ?? cardItems[0];
  const canSwitch = cardItems.length > 1;

  const prevIndexRef = useRef(resolvedIndex);
  useEffect(() => {
    if (resolvedIndex !== prevIndexRef.current) {
      setTransitionDirection(resolvedIndex > prevIndexRef.current ? 1 : -1);
      prevIndexRef.current = resolvedIndex;
    }
  }, [resolvedIndex]);

  function selectByIndex(index: number) {
    if (index === resolvedIndex || index < 0 || index >= cardItems.length) return;
    const direction = index > resolvedIndex ? 1 : -1;
    prevIndexRef.current = resolvedIndex;
    setTransitionDirection(direction);
    setInternalActiveId(cardItems[index].id);
    onChange(cardItems[index].id, direction);
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (!canSwitch) return;
    const swipeThreshold = 35;
    const velocityThreshold = 250;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      if (resolvedIndex < cardItems.length - 1) {
        selectByIndex(resolvedIndex + 1);
      }
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      if (resolvedIndex > 0) {
        selectByIndex(resolvedIndex - 1);
      }
    }
  }

  if (!currentCard) return null;

  const hideAmounts = settings.hideAmounts;
  const canGoPrev = resolvedIndex > 0;
  const canGoNext = resolvedIndex < cardItems.length - 1;

  return (
    <div className={cn("relative mx-auto w-full max-w-md select-none", className)}>
      {/* Monobank Card Viewport */}
      <div className="relative flex items-center justify-center">
        {/* Previous Card Peek (left preview button) */}
        {canGoPrev ? (
          <button
            type="button"
            onClick={() => selectByIndex(resolvedIndex - 1)}
            className="absolute -left-12 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-2 text-muted/60 transition hover:bg-elevated/80 hover:text-foreground md:grid place-items-center"
            aria-label="Previous card"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : null}

        {/* Main Swipeable Card Deck Viewport */}
        <div
          className="relative w-full aspect-[1.586/1] overflow-hidden rounded-[24px]"
          style={
            !currentCard.isAll
              ? {
                  boxShadow: `0 18px 40px -10px ${currentCard.color ?? "#207a6f"}44`
                }
              : {
                  boxShadow: "0 18px 40px -10px rgba(0,0,0,0.5)"
                }
          }
        >
          <AnimatePresence initial={false} custom={transitionDirection}>
            <motion.div
              key={currentCard.id}
              custom={transitionDirection}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 380, damping: 32, mass: 0.55 },
                opacity: { duration: 0.2, ease: "easeInOut" },
                scale: { duration: 0.22, ease: "easeOut" }
              }}
              drag={canSwitch ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className={cn(
                "absolute inset-0 flex flex-col justify-between p-5 text-white cursor-grab active:cursor-grabbing touch-pan-y select-none",
                currentCard.isAll
                  ? "bg-gradient-to-br from-[#24272c] via-[#1a1c20] to-[#0f1012] border border-white/10"
                  : "border border-white/15"
              )}
              style={
                !currentCard.isAll
                  ? {
                      background: `linear-gradient(135deg, ${currentCard.color ?? "#207a6f"}dd 0%, #13171b 100%)`,
                      boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.25)"
                    }
                  : {
                      boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.2)"
                    }
              }
            >
              {/* Subtle background card watermark pattern */}
              <div
                className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full opacity-10 blur-xl"
                style={{ backgroundColor: currentCard.color ?? "#ffffff" }}
              />

              {/* Top Row: Wallet Icon & Name + Kind Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-control text-white backdrop-blur-md shadow-sm",
                      currentCard.isAll ? "bg-white/20" : "bg-black/25"
                    )}
                  >
                    {currentCard.isAll ? (
                      <Layers3 className="h-4 w-4" />
                    ) : (
                      <WalletIcon name={currentCard.icon ?? "wallet-cards"} className="h-4 w-4" />
                    )}
                  </span>
                  <span className="text-sm font-semibold tracking-wide text-white drop-shadow-sm">
                    {currentCard.name}
                  </span>
                </div>

                {/* Right Badge: Kind */}
                <div className="flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-xs font-semibold backdrop-blur-md text-white/90">
                  {currentCard.isAll ? (
                    <span>{t.wallets.allWallets}</span>
                  ) : currentCard.kind === "credit" ? (
                    <span className="flex items-center gap-1 text-amber-300">
                      <ShieldCheck className="h-3 w-3" />
                      Кредитный
                    </span>
                  ) : (
                    <span>{t.common.wallet}</span>
                  )}
                </div>
              </div>

              {/* Center: Main Balance */}
              <div className="relative z-10 my-auto py-2">
                <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                  {t.common.balance}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="truncate text-3xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-4xl">
                    {formatMoney(
                      currentCard.balanceMinor,
                      currentCard.currency,
                      settings.locale,
                      hideAmounts
                    )}
                  </p>
                </div>
              </div>

              {/* Bottom Row: Currency info & Credit Limit bar */}
              <div className="relative z-10">
                {currentCard.kind === "credit" && currentCard.creditLimitMinor ? (
                  <div className="mb-2">
                    <div className="flex justify-between text-[11px] font-medium text-white/70">
                      <span>Лимит</span>
                      <span>
                        {formatMoney(
                          currentCard.creditLimitMinor,
                          currentCard.currency,
                          settings.locale,
                          hideAmounts
                        )}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              ((currentCard.balanceMinor + currentCard.creditLimitMinor) /
                                currentCard.creditLimitMinor) *
                                100
                            )
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/75">
                    {currentCard.currency}
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                    {getCurrencyLabel(currentCard.currency)}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Next Card Peek (right preview button) */}
        {canGoNext ? (
          <button
            type="button"
            onClick={() => selectByIndex(resolvedIndex + 1)}
            className="absolute -right-12 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-2 text-muted/60 transition hover:bg-elevated/80 hover:text-foreground md:grid place-items-center"
            aria-label="Next card"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        ) : null}
      </div>

      {/* Monobank Pagination Dots */}
      <div className="mt-3 flex items-center justify-center gap-1.5" role="tablist" aria-label="Wallet selector">
        {cardItems.map((item, idx) => {
          const isActive = idx === resolvedIndex;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={item.name}
              onClick={() => selectByIndex(idx)}
              className="p-1 outline-none"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-300",
                  isActive ? "w-6 bg-accent" : "w-1.5 bg-muted/30 hover:bg-muted/60"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
