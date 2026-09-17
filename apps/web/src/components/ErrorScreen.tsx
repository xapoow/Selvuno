import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  CloudOff,
  Copy,
  Home,
  LockKeyhole,
  RefreshCw,
  SearchX,
  ServerCrash,
  ShieldAlert,
  WifiOff
} from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/cn";
import type { Dictionary } from "../i18n";
import { Button } from "./ui/Button";

export type ErrorScreenKind =
  | "bad-request"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "server"
  | "unavailable"
  | "offline"
  | "maintenance"
  | "storage"
  | "runtime";

interface ErrorPreset {
  status: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof AlertTriangle;
  tone: "warning" | "danger" | "accent";
}

export const errorPresets: Record<ErrorScreenKind, ErrorPreset> = {
  "bad-request": {
    status: "400",
    eyebrow: "Bad request",
    title: "The request is not valid",
    description: "Something in the request shape is malformed. Check the input and try again.",
    icon: AlertTriangle,
    tone: "warning"
  },
  unauthorized: {
    status: "401",
    eyebrow: "Unauthorized",
    title: "Sign in is required",
    description: "This area needs an account session. Local-only mode still works without cloud access.",
    icon: LockKeyhole,
    tone: "warning"
  },
  forbidden: {
    status: "403",
    eyebrow: "Forbidden",
    title: "You do not have access",
    description: "The account does not have permission for this resource.",
    icon: ShieldAlert,
    tone: "danger"
  },
  "not-found": {
    status: "404",
    eyebrow: "Not found",
    title: "This page does not exist",
    description: "The link may be stale, mistyped, or not available in the local app.",
    icon: SearchX,
    tone: "accent"
  },
  server: {
    status: "500",
    eyebrow: "Server error",
    title: "Something broke",
    description: "The app hit an unexpected failure. Reloading usually clears temporary runtime state.",
    icon: ServerCrash,
    tone: "danger"
  },
  unavailable: {
    status: "503",
    eyebrow: "Unavailable",
    title: "Service is temporarily unavailable",
    description: "Cloud services are not reachable right now. Local data remains available.",
    icon: CloudOff,
    tone: "warning"
  },
  offline: {
    status: "OFF",
    eyebrow: "Offline",
    title: "You are offline",
    description: "The app can keep working locally. Sync and cloud backup resume when the network returns.",
    icon: WifiOff,
    tone: "accent"
  },
  maintenance: {
    status: "503",
    eyebrow: "Maintenance",
    title: "Maintenance is in progress",
    description: "This area is paused while infrastructure work is happening.",
    icon: RefreshCw,
    tone: "warning"
  },
  storage: {
    status: "DB",
    eyebrow: "Local storage",
    title: "Local data could not be opened",
    description: "IndexedDB may be blocked, full, or corrupted. Exported backups can restore data later.",
    icon: Bug,
    tone: "danger"
  },
  runtime: {
    status: "APP",
    eyebrow: "Runtime error",
    title: "The app hit a critical error",
    description: "A local runtime error stopped this screen. The debug details below can help trace it.",
    icon: Bug,
    tone: "danger"
  }
};

interface ErrorAction {
  label: string;
  onClick: () => void;
  icon?: typeof Home;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

interface ErrorScreenProps {
  kind: ErrorScreenKind;
  title?: string;
  description?: string;
  details?: string;
  copy?: Dictionary["errors"];
  compact?: boolean;
  primaryAction?: ErrorAction;
  secondaryAction?: ErrorAction;
}

function defaultPrimaryAction(kind: ErrorScreenKind, copy?: Dictionary["errors"]): ErrorAction {
  if (kind === "not-found" || kind === "forbidden" || kind === "unauthorized") {
    return {
      label: copy?.actions.goHome ?? "Go home",
      icon: Home,
      onClick: () => {
        window.location.href = "/";
      }
    };
  }

  return {
    label: copy?.actions.reload ?? "Reload",
    icon: RefreshCw,
    onClick: () => window.location.reload()
  };
}

function defaultSecondaryAction(copy?: Dictionary["errors"]): ErrorAction {
  return {
    label: copy?.actions.back ?? "Back",
    icon: ArrowLeft,
    variant: "secondary",
    onClick: () => window.history.back()
  };
}

export function ErrorScreen({
  kind,
  title,
  description,
  details,
  copy,
  compact = false,
  primaryAction,
  secondaryAction
}: ErrorScreenProps) {
  const [copied, setCopied] = useState(false);
  const preset = errorPresets[kind];
  const localized = copy?.presets[kind];
  const Icon = preset.icon;
  const primary = primaryAction ?? defaultPrimaryAction(kind, copy);
  const secondary = secondaryAction ?? defaultSecondaryAction(copy);
  const PrimaryIcon = primary.icon;
  const SecondaryIcon = secondary.icon;

  async function copyDetails() {
    if (!details) {
      return;
    }
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={cn(
        "app-page-bg grid place-items-center px-4 text-foreground",
        compact
          ? "min-h-[420px] py-4"
          : "min-h-dvh pb-[calc(env(safe-area-inset-bottom)+2.5rem)] pt-[calc(env(safe-area-inset-top)+2.5rem)]"
      )}
    >
      <section className="app-surface w-full max-w-xl rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
              preset.tone === "danger" && "bg-expense/12 text-expense",
              preset.tone === "warning" && "bg-warning/12 text-warning",
              preset.tone === "accent" && "bg-accentSoft text-accent"
            )}
          >
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-muted">
              {preset.status} · {localized?.eyebrow ?? preset.eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">{title ?? localized?.title ?? preset.title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              {description ?? localized?.description ?? preset.description}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button onClick={primary.onClick} variant={primary.variant ?? "primary"}>
            {PrimaryIcon ? <PrimaryIcon className="h-4 w-4" /> : null}
            {primary.label}
          </Button>
          <Button onClick={secondary.onClick} variant={secondary.variant ?? "secondary"}>
            {SecondaryIcon ? <SecondaryIcon className="h-4 w-4" /> : null}
            {secondary.label}
          </Button>
        </div>

        {details ? (
          <details className="app-control mt-5 rounded-xl p-3">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">
              {copy?.actions.debugDetails ?? "Debug details"}
            </summary>
            <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-muted">
              {details}
            </pre>
            <Button className="mt-3" variant="secondary" size="small" onClick={() => void copyDetails()}>
              <Copy className="h-4 w-4" />
              {copied ? copy?.actions.copied ?? "Copied" : copy?.actions.copyDetails ?? "Copy details"}
            </Button>
          </details>
        ) : null}
      </section>
    </div>
  );
}
