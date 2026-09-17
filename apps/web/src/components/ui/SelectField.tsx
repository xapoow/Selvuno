import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { cn } from "../../lib/cn";

interface SelectOption {
  disabled: boolean;
  label: string;
  value: string;
}

interface SelectFieldProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children" | "size"> {
  children: React.ReactNode;
  label: string;
}

function getNodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join("");
  }
  if (isValidElement<{ children?: React.ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }
  return "";
}

function getOptions(children: React.ReactNode): SelectOption[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((child) => {
      const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
      const label = getNodeText(props.children).trim();
      return {
        disabled: Boolean(props.disabled),
        label,
        value: String(props.value ?? label)
      };
    });
}

function createChangeEvent(value: string): React.ChangeEvent<HTMLSelectElement> {
  return {
    currentTarget: { value },
    target: { value }
  } as React.ChangeEvent<HTMLSelectElement>;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      className,
      disabled,
      label,
      name,
      onBlur,
      onChange,
      required,
      value,
      defaultValue,
      children,
      ...props
    },
    ref
  ) => {
    const options = useMemo(() => getOptions(children), [children]);
    const generatedId = useId();
    const listboxId = `${generatedId}-listbox`;
    const containerRef = useRef<HTMLLabelElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(
      String(value ?? defaultValue ?? options.find((option) => !option.disabled)?.value ?? "")
    );
    const selectedValue = String(value ?? internalValue);
    const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0];
    const resolvedValue = selectedOption?.value ?? selectedValue;

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(String(value));
      }
    }, [value]);

    useEffect(() => {
      if (!open) {
        return;
      }
      const handlePointerDown = (event: PointerEvent) => {
        if (!containerRef.current?.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("pointerdown", handlePointerDown);
      return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [open]);

    function selectValue(nextValue: string) {
      const nextOption = options.find((option) => option.value === nextValue);
      if (!nextOption || nextOption.disabled || disabled) {
        return;
      }
      setInternalValue(nextValue);
      onChange?.(createChangeEvent(nextValue));
      setOpen(false);
      window.requestAnimationFrame(() => buttonRef.current?.focus());
    }

    function moveSelection(direction: 1 | -1) {
      const enabledOptions = options.filter((option) => !option.disabled);
      if (!enabledOptions.length) {
        return;
      }
      const currentIndex = enabledOptions.findIndex((option) => option.value === resolvedValue);
      const nextIndex =
        currentIndex < 0
          ? 0
          : (currentIndex + direction + enabledOptions.length) % enabledOptions.length;
      selectValue(enabledOptions[nextIndex].value);
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        moveSelection(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        moveSelection(-1);
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    return (
      <label
        ref={containerRef}
        className="relative grid gap-2 text-sm font-medium text-foreground"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setOpen(false);
            onBlur?.(event as unknown as React.FocusEvent<HTMLSelectElement>);
          }
        }}
      >
        <span>{label}</span>
        <select
          ref={ref}
          tabIndex={-1}
          aria-hidden="true"
          style={{
            border: 0,
            clip: "rect(0 0 0 0)",
            height: 1,
            margin: -1,
            overflow: "hidden",
            padding: 0,
            position: "absolute",
            whiteSpace: "nowrap",
            width: 1
          }}
          name={name}
          required={required}
          value={resolvedValue}
          onChange={() => undefined}
          {...props}
        >
          {children}
        </select>
        <button
          ref={buttonRef}
          type="button"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={label}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleKeyDown}
          className={cn(
            "app-field app-focus grid h-11 grid-cols-[1fr_auto] items-center gap-3 rounded-xl px-3 text-left text-base text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className="min-w-0 truncate">{selectedOption?.label ?? ""}</span>
          <ChevronDown className={cn("h-4 w-4 text-muted transition", open && "rotate-180 text-accent")} />
        </button>

        <AnimatePresence>
          {open ? (
            <motion.div
              id={listboxId}
              role="listbox"
              aria-label={label}
              className="app-surface absolute inset-x-0 top-[calc(100%+6px)] z-50 grid max-h-64 overflow-auto rounded-xl p-1"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
            >
              {options.map((option) => {
                const selected = option.value === resolvedValue;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-value={option.value}
                    disabled={option.disabled}
                    onClick={() => selectValue(option.value)}
                    className={cn(
                      "app-focus app-select-option grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-muted outline-none active:scale-[0.99] disabled:opacity-40",
                      selected ? "app-selected-control text-foreground" : "hover:bg-elevated/70 hover:text-foreground"
                    )}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {selected ? <Check className="h-4 w-4 text-accent" /> : null}
                  </button>
                );
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </label>
    );
  }
);

SelectField.displayName = "SelectField";
