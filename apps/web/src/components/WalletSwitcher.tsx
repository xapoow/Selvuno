import type { Wallet, WalletView } from "@myfinances/types";
import { useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Layers3 } from "lucide-react";
import { cn } from "../lib/cn";
import { WalletIcon } from "../lib/icons";

interface WalletSwitcherProps {
  wallets: Wallet[];
  value: WalletView;
  label: string;
  allLabel: string;
  allCurrency: string;
  className?: string;
  includeAll?: boolean;
  onChange: (value: WalletView, direction?: number) => void;
}

interface WalletOption {
  value: WalletView;
  name: string;
  currency: string;
  kind: "all" | "wallet";
  color?: string;
  icon?: string;
}

export function WalletSwitcher({
  wallets,
  value,
  label,
  allLabel,
  allCurrency,
  className,
  includeAll = true,
  onChange
}: WalletSwitcherProps) {
  const walletOptions: WalletOption[] = wallets.map((wallet) => ({
      value: wallet.id,
      name: wallet.name,
      currency: wallet.currency,
      kind: "wallet" as const,
      color: wallet.color,
      icon: wallet.icon
    }));
  const options: WalletOption[] = includeAll
    ? [{ value: "all", name: allLabel, currency: allCurrency, kind: "all" }, ...walletOptions]
    : walletOptions;
  const [transitionDirection, setTransitionDirection] = useState(0);
  const resolvedActiveIndex = options.findIndex((option) => option.value === value);
  const activeIndex = resolvedActiveIndex >= 0 ? resolvedActiveIndex : 0;
  const activeOption = options[activeIndex] ?? options[0];
  if (!activeOption) {
    return null;
  }
  const canSwitch = options.length > 1;

  function selectByOffset(offset: number) {
    if (!canSwitch) {
      return;
    }
    const nextIndex = (activeIndex + offset + options.length) % options.length;
    setTransitionDirection(offset);
    onChange(options[nextIndex].value, offset);
  }

  function selectOption(index: number) {
    if (index === activeIndex) {
      return;
    }
    const direction = index > activeIndex ? 1 : -1;
    setTransitionDirection(direction);
    onChange(options[index].value, direction);
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x < -36 || info.velocity.x < -350) {
      selectByOffset(1);
    }
    if (info.offset.x > 36 || info.velocity.x > 350) {
      selectByOffset(-1);
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="md:hidden">
        <motion.div
          role="group"
          tabIndex={0}
          aria-label={`${label}: ${activeOption.name}`}
          drag={canSwitch ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.08}
          onDragEnd={handleDragEnd}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              selectByOffset(-1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              selectByOffset(1);
            }
          }}
          className="app-surface app-focus touch-pan-y select-none rounded-2xl px-3 py-3 outline-none active:scale-[0.99]"
          whileTap={canSwitch ? { scale: 0.99 } : undefined}
        >
          <div className="grid grid-cols-[24px_1fr_24px] items-center gap-2">
            <ChevronLeft className={cn("h-4 w-4 text-muted transition", !canSwitch && "opacity-35")} aria-hidden />
            <div className="grid justify-items-center gap-1 overflow-hidden text-center">
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-xl",
                  activeOption.kind === "all" ? "app-control text-accent" : "text-white"
                )}
                style={
                  activeOption.kind === "wallet"
                    ? { backgroundColor: activeOption.color }
                    : undefined
                }
              >
                {activeOption.kind === "all" ? (
                  <Layers3 className="h-4 w-4" />
                ) : (
                  <WalletIcon name={activeOption.icon ?? "wallet-cards"} className="h-4 w-4" />
                )}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={activeOption.value}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="grid min-w-0 gap-0.5"
                  aria-live="polite"
                >
                  <span className="truncate text-lg font-semibold leading-tight text-foreground">{activeOption.name}</span>
                  <span className="text-xs font-medium uppercase text-muted">{activeOption.currency}</span>
                </motion.span>
              </AnimatePresence>
            </div>
            <ChevronRight className={cn("h-4 w-4 text-muted transition", !canSwitch && "opacity-35")} aria-hidden />
          </div>
        </motion.div>
        <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
          {options.map((option) => (
            <span
              key={option.value}
              className={cn(
                "h-1.5 rounded-full bg-muted/25 transition-all duration-200",
                option.value === activeOption.value ? "w-5 bg-accent" : "w-1.5"
              )}
            />
          ))}
        </div>
      </div>

      <div className="hidden md:grid md:justify-items-center md:gap-2">
        <motion.div
          role="group"
          tabIndex={0}
          aria-label={`${label}: ${activeOption.name}`}
          drag={canSwitch ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          dragSnapToOrigin
          onDragEnd={handleDragEnd}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              selectByOffset(-1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              selectByOffset(1);
            }
          }}
          className="app-surface app-focus grid h-[72px] w-full max-w-[430px] cursor-grab touch-pan-y select-none grid-cols-[32px_1fr_32px] items-center rounded-2xl px-3 outline-none active:cursor-grabbing"
          whileDrag={{ scale: 0.985 }}
        >
          <ChevronLeft className={cn("h-4 w-4 justify-self-center text-muted", !canSwitch && "opacity-30")} />
          <AnimatePresence initial={false} mode="wait" custom={transitionDirection}>
            <motion.div
              key={activeOption.value}
              custom={transitionDirection}
              initial={{ opacity: 0, x: transitionDirection * 28, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: transitionDirection * -28, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-w-0 items-center justify-center gap-3"
              aria-live="polite"
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  activeOption.kind === "all" ? "app-control text-accent" : "text-white"
                )}
                style={
                  activeOption.kind === "wallet"
                    ? { backgroundColor: activeOption.color }
                    : undefined
                }
              >
                {activeOption.kind === "all" ? (
                  <Layers3 className="h-5 w-5" />
                ) : (
                  <WalletIcon name={activeOption.icon ?? "wallet-cards"} className="h-5 w-5" />
                )}
              </span>
              <span className="grid min-w-0">
                <span className="truncate text-base font-semibold text-foreground">{activeOption.name}</span>
                <span className="text-xs font-medium uppercase text-muted">{activeOption.currency}</span>
              </span>
            </motion.div>
          </AnimatePresence>
          <ChevronRight className={cn("h-4 w-4 justify-self-center text-muted", !canSwitch && "opacity-30")} />
        </motion.div>
        <div className="flex items-center justify-center gap-1" aria-label={label}>
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              aria-label={option.name}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => selectOption(index)}
              className="grid h-5 place-items-center px-1"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full bg-muted/25 transition-all duration-200",
                  index === activeIndex ? "w-6 bg-accent" : "w-1.5"
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
