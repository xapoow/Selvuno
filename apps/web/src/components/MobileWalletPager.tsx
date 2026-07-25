import { useMemo, useState, type ReactNode } from "react";
import type { Wallet, WalletView } from "@myfinances/types";
import { AnimatePresence, motion } from "framer-motion";
import { Layers3, WalletCards } from "lucide-react";
import { getCurrencyLabel } from "../lib/currencies";

const SWIPE_DISTANCE_PX = 64;
const SWIPE_VELOCITY_PX = 520;

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
  const [transitionDirection, setTransitionDirection] = useState<1 | -1>(1);
  const options = useMemo(
    () => getMobileWalletOptions(wallets, allLabel, allCurrency, includeAll),
    [allCurrency, allLabel, includeAll, wallets]
  );
  const resolvedActiveIndex = options.findIndex((option) => option.value === activeWalletId);
  const activeIndex = resolvedActiveIndex >= 0 ? resolvedActiveIndex : 0;
  const activeOption = options[activeIndex] ?? options[0];
  const ActiveIcon = activeOption?.kind === "all" ? Layers3 : WalletCards;
  const previousOption = options[activeIndex - 1];
  const nextOption = options[activeIndex + 1];

  function selectWallet(index: number) {
    const nextIndex = Math.max(0, Math.min(options.length - 1, index));
    const nextOption = options[nextIndex];
    if (!nextOption || nextIndex === activeIndex) {
      return;
    }
    setTransitionDirection(nextIndex > activeIndex ? 1 : -1);
    onChange(nextOption.value);
  }

  function handleDragEnd(offsetX: number, velocityX: number) {
    const intent = offsetX + velocityX * 0.16;
    if (intent <= -SWIPE_DISTANCE_PX || velocityX <= -SWIPE_VELOCITY_PX) {
      selectWallet(activeIndex + 1);
      return;
    }
    if (intent >= SWIPE_DISTANCE_PX || velocityX >= SWIPE_VELOCITY_PX) {
      selectWallet(activeIndex - 1);
    }
  }

  if (!activeOption) {
    return null;
  }

  return (
    <div className="grid gap-4">
      <div className="relative h-[88px] overflow-hidden [perspective:900px]">
        <div className="absolute inset-x-3 bottom-0 h-[76px] rounded-app bg-accent/10" aria-hidden />
        <div className="absolute inset-x-1 bottom-1 h-[78px] rounded-app bg-accent/15" aria-hidden />
        <motion.div
          className="app-surface relative flex h-[76px] touch-pan-y items-center overflow-hidden rounded-app px-4 py-3 shadow-[0_14px_30px_rgb(var(--color-accent)/0.12)]"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          dragSnapToOrigin
          onDragEnd={(_, info) => handleDragEnd(info.offset.x, info.velocity.x)}
        >
          {previousOption ? (
            <span className="absolute -left-5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted/40" aria-hidden>
              {previousOption.name}
            </span>
          ) : null}
          {nextOption ? (
            <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted/40" aria-hidden>
              {nextOption.name}
            </span>
          ) : null}
          <AnimatePresence initial={false} mode="wait" custom={transitionDirection}>
            <motion.div
              key={activeOption.value}
              initial={{ opacity: 0, x: transitionDirection * 32, rotateY: transitionDirection * 7, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, x: transitionDirection * -32, rotateY: transitionDirection * -7, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.72 }}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-app bg-accent-soft text-accent">
                <ActiveIcon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                {eyebrow ? <span className="block text-xs font-semibold uppercase text-muted">{eyebrow}</span> : null}
                <span className="block truncate text-lg font-semibold leading-tight text-foreground">{activeOption.name}</span>
                <span className="mt-0.5 block text-xs font-medium text-muted">{getCurrencyLabel(activeOption.currency)}</span>
              </span>
            </motion.div>
          </AnimatePresence>
          <div className="flex shrink-0 items-center gap-1.5" role="tablist" aria-label={allLabel}>
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-label={option.name}
                aria-selected={option.value === activeOption.value}
                className={`h-6 rounded-full px-1 transition-all duration-200 ${
                  option.value === activeOption.value ? "w-7" : "w-3"
                }`}
                onClick={() => selectWallet(index)}
              >
                <span
                  className={`block h-1.5 rounded-full transition-colors ${
                    option.value === activeOption.value ? "bg-accent" : "bg-muted/25"
                  }`}
                />
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="overflow-hidden">
        <AnimatePresence initial={false} mode="wait" custom={transitionDirection}>
          <motion.section
            key={activeOption.value}
            initial={{ opacity: 0, x: transitionDirection * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: transitionDirection * -24 }}
            transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.75 }}
          >
            {children(activeOption)}
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  );
}
