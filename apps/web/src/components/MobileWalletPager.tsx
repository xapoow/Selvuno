import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import type { Wallet, WalletView } from "@myfinances/types";
import { AnimatePresence, motion } from "framer-motion";
import { Layers3, WalletCards } from "lucide-react";
import { getCurrencyLabel } from "../lib/currencies";

const PAGE_GAP_PX = 16;

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

  function getSlideLeft(scroller: HTMLDivElement, index: number) {
    const slide = scroller.children[index] as HTMLElement | undefined;
    return slide?.offsetLeft ?? index * (scroller.clientWidth + PAGE_GAP_PX);
  }

  function getNearestSlideIndex(scroller: HTMLDivElement) {
    return Array.from(scroller.children).reduce((nearestIndex, child, index) => {
      const slide = child as HTMLElement;
      const currentDistance = Math.abs(slide.offsetLeft - scroller.scrollLeft);
      const nearestSlide = scroller.children[nearestIndex] as HTMLElement | undefined;
      const nearestDistance = nearestSlide
        ? Math.abs(nearestSlide.offsetLeft - scroller.scrollLeft)
        : Number.POSITIVE_INFINITY;
      return currentDistance < nearestDistance ? index : nearestIndex;
    }, 0);
  }

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const targetLeft = getSlideLeft(scroller, activeIndex);
    if (Math.abs(scroller.scrollLeft - targetLeft) > 2) {
      scroller.scrollTo({ left: targetLeft, behavior: "auto" });
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
      const nextIndex = getNearestSlideIndex(scroller);
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
    <div className="grid gap-4">
      <div className="flex min-h-11 items-center gap-3" aria-live="polite">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-app bg-accent-soft text-accent">
          <ActiveIcon className="h-[18px] w-[18px]" />
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeOption.value}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="min-w-0 flex-1"
          >
            {eyebrow ? <p className="text-xs font-semibold uppercase text-muted">{eyebrow}</p> : null}
            <h2 className="truncate text-lg font-semibold leading-tight text-foreground">{activeOption.name}</h2>
            <p className="mt-0.5 text-xs font-medium text-muted">{getCurrencyLabel(activeOption.currency)}</p>
          </motion.div>
        </AnimatePresence>
        <div className="flex shrink-0 items-center justify-end gap-1.5 px-1" aria-hidden>
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
        className="relative flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ columnGap: PAGE_GAP_PX }}
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
