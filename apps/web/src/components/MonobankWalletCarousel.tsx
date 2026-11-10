import { useEffect, useMemo, useRef, useState } from "react";
import type { Settings, Transaction, Wallet, WalletTransfer, WalletView } from "@selvuno/types";
import { AnimatePresence, animate, motion, useMotionValue, useTransform, type MotionValue, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Layers3, ShieldCheck } from "lucide-react";
import { calculateWalletTotals, formatMoney } from "@selvuno/utils";
import { cn } from "../lib/cn";
import { WalletIcon } from "../lib/icons";
import { getCurrencyLabel } from "../lib/currencies";
import { getIncludedWalletIds } from "../lib/walletFeatures";
import { convertMinorToBaseCurrency, type ExchangeRateTable, useExchangeRates } from "../lib/exchangeRates";
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
  conversionMissing?: boolean;
}

export function calculateCombinedWalletBalance(
  wallets: Wallet[],
  transactions: Transaction[],
  transfers: WalletTransfer[],
  includedWalletIds: Set<string>,
  baseCurrency: string,
  exchangeRates?: ExchangeRateTable
): { balanceMinor: number; conversionMissing: boolean } {
  return wallets
    .filter((wallet) => !wallet.deletedAt && includedWalletIds.has(wallet.id))
    .reduce<{ balanceMinor: number; conversionMissing: boolean }>(
      (result, wallet) => {
        const totals = calculateWalletTotals(wallet, transactions, transfers);
        const converted = convertMinorToBaseCurrency(
          totals.balanceMinor,
          wallet.currency,
          baseCurrency,
          exchangeRates
        );
        if (converted === null) {
          result.conversionMissing = true;
        } else {
          result.balanceMinor += converted;
        }
        return result;
      },
      { balanceMinor: 0, conversionMissing: false }
    );
}

const GAP = 14;
const MAX_CAROUSEL_WIDTH = 576;

export function clampCarouselWidth(measuredWidth: number, viewportWidth: number): number {
  return Math.max(
    1,
    Math.floor(Math.min(measuredWidth, Math.max(1, viewportWidth - 32), MAX_CAROUSEL_WIDTH))
  );
}

export function getCarouselGeometry(containerWidth: number, cardCount: number) {
  const canSwitch = cardCount > 1;
  const peek = canSwitch
    ? containerWidth < 400
      ? 18
      : containerWidth < 520
        ? 28
        : 36
    : 0;
  const cardWidth = Math.max(1, containerWidth - peek * 2);
  const step = cardWidth + GAP;
  return {
    peek,
    cardWidth,
    step,
    trackWidth: cardCount * cardWidth + Math.max(0, cardCount - 1) * GAP
  };
}

interface CarouselCardSlideProps {
  card: MonobankCardData;
  idx: number;
  cardWidth: number;
  step: number;
  peek: number;
  trackX: MotionValue<number>;
  settings: Settings;
  t: Dictionary;
  hideAmounts: boolean;
}

function CarouselCardSlide({
  card,
  idx,
  cardWidth,
  step,
  peek,
  trackX,
  settings,
  t,
  hideAmounts
}: CarouselCardSlideProps) {
  const centerPos = peek - idx * step;
  const opacity = useTransform(
    trackX,
    [centerPos - step, centerPos - step * 0.35, centerPos, centerPos + step * 0.35, centerPos + step],
    [0.2, 0.96, 1, 0.96, 0.2]
  );
  const scale = useTransform(
    trackX,
    [centerPos - step, centerPos, centerPos + step],
    [0.93, 1, 0.93]
  );

  return (
    <div
      style={{ width: `${cardWidth}px`, maxWidth: "100%" }}
      className="min-w-0 flex-shrink-0"
    >
      <motion.div
        style={{
          aspectRatio: "1.586 / 1",
          opacity,
          scale,
          background: !card.isAll
            ? `linear-gradient(135deg, ${card.color ?? "#207a6f"}dd 0%, #13171b 100%)`
            : undefined,
          boxShadow: !card.isAll
            ? "inset 0 1px 0 0 rgba(255,255,255,0.25)"
            : "inset 0 1px 0 0 rgba(255,255,255,0.2)"
        }}
        className={cn(
          "relative flex w-full flex-col justify-between overflow-hidden rounded-[24px] p-5 text-white select-none",
          card.isAll
            ? "bg-gradient-to-br from-[#24272c] via-[#1a1c20] to-[#0f1012] border border-white/10"
            : "border border-white/15"
        )}
      >
        {/* Subtle background card watermark pattern */}
        <div
          className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 rounded-full opacity-10 blur-xl"
          style={{ backgroundColor: card.color ?? "#ffffff" }}
        />

        {/* Top Row: Wallet Icon & Name + Kind Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "grid h-9 w-9 place-items-center rounded-control text-white backdrop-blur-md shadow-sm",
                card.isAll ? "bg-white/20" : "bg-black/25"
              )}
            >
              {card.isAll ? (
                <Layers3 className="h-4 w-4" />
              ) : (
                <WalletIcon name={card.icon ?? "wallet-cards"} className="h-4 w-4" />
              )}
            </span>
            <span className="text-sm font-semibold tracking-wide text-white drop-shadow-sm">
              {card.name}
            </span>
          </div>

          {/* Right Badge: Kind */}
          <div className="flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-xs font-semibold backdrop-blur-md text-white/90">
            {card.isAll ? (
              <span>{t.wallets.allWallets}</span>
            ) : card.kind === "credit" ? (
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
                card.balanceMinor,
                card.currency,
                settings.locale,
                hideAmounts
              )}
              {card.conversionMissing ? " *" : ""}
            </p>
          </div>
        </div>

        {/* Bottom Row: Currency info & Credit Limit bar */}
        <div className="relative z-10">
          {card.kind === "credit" && card.creditLimitMinor ? (
            <div className="mb-2">
              <div className="flex justify-between text-[11px] font-medium text-white/70">
                <span>Лимит</span>
                <span>
                  {formatMoney(
                    card.creditLimitMinor,
                    card.currency,
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
                        ((card.balanceMinor + card.creditLimitMinor) /
                          card.creditLimitMinor) *
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
              {card.currency}
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm backdrop-blur-md">
              {getCurrencyLabel(card.currency)}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalActiveId, setInternalActiveId] = useState<WalletView>(activeWalletId);

  useEffect(() => {
    setInternalActiveId(activeWalletId);
  }, [activeWalletId]);

  const includedWalletIds = useMemo(
    () => getIncludedWalletIds(wallets, settings.advancedWalletsEnabled),
    [wallets, settings.advancedWalletsEnabled]
  );
  const combinedBalanceNeedsRates = useMemo(
    () =>
      wallets.some(
        (wallet) =>
          !wallet.deletedAt &&
          includedWalletIds.has(wallet.id) &&
          wallet.currency.toUpperCase() !== settings.currency.toUpperCase()
      ),
    [includedWalletIds, settings.currency, wallets]
  );
  const combinedBalanceRates = useExchangeRates(settings.currency, combinedBalanceNeedsRates);

  const cardItems = useMemo<MonobankCardData[]>(() => {
    // 1. Calculate for "all"
    const combinedBalance = calculateCombinedWalletBalance(
      wallets,
      transactions,
      transfers,
      includedWalletIds,
      settings.currency,
      combinedBalanceRates.data
    );

    const allCard: MonobankCardData = {
      id: "all",
      name: t.wallets.allWallets,
      currency: settings.currency,
      balanceMinor: combinedBalance.balanceMinor,
      kind: "all",
      isAll: true,
      conversionMissing: combinedBalance.conversionMissing
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
  }, [wallets, transactions, transfers, settings.currency, includedWalletIds, t.wallets.allWallets, combinedBalanceRates.data]);

  const rawIndex = cardItems.findIndex((item) => item.id === internalActiveId);
  const resolvedIndex = rawIndex >= 0 ? rawIndex : 0;
  const canSwitch = cardItems.length > 1;

  const [containerWidth, setContainerWidth] = useState(340);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const measuredWidth = containerRef.current.getBoundingClientRect().width;
        const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
        const safeWidth = clampCarouselWidth(measuredWidth, viewportWidth);
        if (safeWidth > 0) {
          setContainerWidth((current) => (current === safeWidth ? current : safeWidth));
        }
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { peek, cardWidth, step, trackWidth } = getCarouselGeometry(
    containerWidth,
    cardItems.length
  );
  const trackX = useMotionValue(peek - resolvedIndex * step);

  useEffect(() => {
    if (!containerWidth) return;
    void animate(trackX, peek - resolvedIndex * step, {
      type: "spring",
      stiffness: 380,
      damping: 32,
      mass: 0.55
    });
  }, [resolvedIndex, containerWidth, step, trackX, peek]);

  function snapTo(index: number, fireChange = true) {
    if (index < 0 || index >= cardItems.length) return;
    if (fireChange && index !== resolvedIndex) {
      const direction = index > resolvedIndex ? 1 : -1;
      setInternalActiveId(cardItems[index].id);
      onChange(cardItems[index].id, direction);
    }
    void animate(trackX, peek - index * step, {
      type: "spring",
      stiffness: 380,
      damping: 32,
      mass: 0.55
    });
  }

  function selectByIndex(index: number) {
    snapTo(index, true);
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (!canSwitch) return;
    const swipeThreshold = cardWidth * 0.16;
    const velocityThreshold = 250;

    let targetIndex = resolvedIndex;
    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      if (resolvedIndex < cardItems.length - 1) {
        targetIndex = resolvedIndex + 1;
      }
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      if (resolvedIndex > 0) {
        targetIndex = resolvedIndex - 1;
      }
    }

    snapTo(targetIndex, targetIndex !== resolvedIndex);
  }

  if (!cardItems.length) return null;

  const hideAmounts = settings.hideAmounts;
  const canGoPrev = resolvedIndex > 0;
  const canGoNext = resolvedIndex < cardItems.length - 1;
  const fadeWidth = Math.max(10, peek - 6);
  const activeCard = cardItems[resolvedIndex];
  const glowColor = activeCard.isAll ? "#000000" : activeCard.color ?? "#207a6f";

  return (
    <div
      className={cn(
        "relative mx-auto w-full min-w-0 max-w-[calc(100vw-2rem)] select-none md:max-w-xl",
        className
      )}
    >
      {/* Monobank Card Viewport */}
      <div className="relative flex w-full min-w-0 items-center justify-center">
        {/* Ambient light stays outside the clipped track and fades before reaching its own bounds. */}
        <div className="pointer-events-none absolute -inset-x-8 -bottom-10 -top-6" aria-hidden="true">
          <AnimatePresence initial={false}>
            <motion.div
              key={`${activeCard.id}:${glowColor}`}
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 65% 60% at 50% 55%, ${glowColor}28 0%, ${glowColor}14 42%, ${glowColor}00 75%)`
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            />
          </AnimatePresence>
        </div>

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

        {/* Carousel Viewport Container with Soft Feather Mask */}
        <div
          ref={containerRef}
          className="relative isolate w-full min-w-0 max-w-full overflow-hidden rounded-[26px] py-2 [contain:inline-size]"
          style={
            canSwitch
              ? {
                  maskImage: `linear-gradient(to right, transparent 0px, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent 100%)`,
                  WebkitMaskImage: `linear-gradient(to right, transparent 0px, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent 100%)`
                }
              : undefined
          }
        >
          <motion.div
            style={{
              x: trackX,
              gap: `${GAP}px`,
              width: `${trackWidth}px`
            }}
            drag={canSwitch ? "x" : false}
            dragConstraints={{
              left: peek - (cardItems.length - 1) * step,
              right: peek
            }}
            dragElastic={0.16}
            onDragEnd={handleDragEnd}
            className="flex cursor-grab active:cursor-grabbing touch-pan-y"
          >
            {cardItems.map((card, idx) => (
              <CarouselCardSlide
                key={card.id}
                card={card}
                idx={idx}
                cardWidth={cardWidth}
                step={step}
                peek={peek}
                trackX={trackX}
                settings={settings}
                t={t}
                hideAmounts={hideAmounts}
              />
            ))}
          </motion.div>
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
