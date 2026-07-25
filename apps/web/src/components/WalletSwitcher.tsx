import type { Wallet, WalletView } from "@myfinances/types";
import { AnimatePresence, LayoutGroup, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Layers3, WalletCards } from "lucide-react";
import { cn } from "../lib/cn";

interface WalletSwitcherProps {
  wallets: Wallet[];
  value: WalletView;
  label: string;
  allLabel: string;
  allCurrency: string;
  className?: string;
  onChange: (value: WalletView) => void;
}

interface WalletOption {
  value: WalletView;
  name: string;
  currency: string;
  kind: "all" | "wallet";
}

export function WalletSwitcher({
  wallets,
  value,
  label,
  allLabel,
  allCurrency,
  className,
  onChange
}: WalletSwitcherProps) {
  const options: WalletOption[] = [
    { value: "all", name: allLabel, currency: allCurrency, kind: "all" },
    ...wallets.map((wallet) => ({
      value: wallet.id,
      name: wallet.name,
      currency: wallet.currency,
      kind: "wallet" as const
    }))
  ];
  const resolvedActiveIndex = options.findIndex((option) => option.value === value);
  const activeIndex = resolvedActiveIndex >= 0 ? resolvedActiveIndex : 0;
  const activeOption = options[activeIndex] ?? options[0];
  const ActiveIcon = activeOption.kind === "all" ? Layers3 : WalletCards;
  const canSwitch = options.length > 1;

  function selectByOffset(offset: number) {
    if (!canSwitch) {
      return;
    }
    const nextIndex = (activeIndex + offset + options.length) % options.length;
    onChange(options[nextIndex].value);
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
          className="app-surface app-focus touch-pan-y select-none rounded-app px-3 py-3 outline-none active:scale-[0.99]"
          whileTap={canSwitch ? { scale: 0.99 } : undefined}
        >
          <div className="grid grid-cols-[24px_1fr_24px] items-center gap-2">
            <ChevronLeft className={cn("h-4 w-4 text-muted transition", !canSwitch && "opacity-35")} aria-hidden />
            <div className="grid justify-items-center gap-1 overflow-hidden text-center">
              <span className="app-control grid h-9 w-9 place-items-center rounded-app text-accent">
                <ActiveIcon className="h-4 w-4" />
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

      <LayoutGroup>
        <nav className="hidden justify-center md:flex" aria-label={label}>
          <div className="app-surface max-w-full overflow-x-auto rounded-app px-5 py-2">
            <div className="flex min-w-max items-center justify-center gap-8">
              {options.map((option) => {
                const isActive = option.value === activeOption.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={cn(
                      "app-focus relative h-9 px-0 pb-2 pt-1 text-sm font-medium text-muted hover:text-foreground focus-visible:outline-none active:scale-[0.98]",
                      isActive && "text-foreground"
                    )}
                  >
                    <span className="whitespace-nowrap">{option.name}</span>
                    {isActive ? (
                      <motion.span
                        layoutId="wallet-switcher-underline"
                        className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent"
                        transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </LayoutGroup>
    </div>
  );
}
