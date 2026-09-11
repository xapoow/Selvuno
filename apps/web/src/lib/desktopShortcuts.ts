export type DesktopShortcut = "add-transaction" | "search-history";

interface ShortcutEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  defaultPrevented: boolean;
}

export function getDesktopShortcut(event: ShortcutEvent): DesktopShortcut | null {
  if (
    event.defaultPrevented ||
    (!event.ctrlKey && !event.metaKey) ||
    event.altKey ||
    event.shiftKey
  ) {
    return null;
  }

  const key = event.key.toLocaleLowerCase();
  if (key === "n") {
    return "add-transaction";
  }
  if (key === "k") {
    return "search-history";
  }
  return null;
}
