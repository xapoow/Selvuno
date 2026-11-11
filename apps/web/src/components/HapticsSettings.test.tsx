import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SettingsUpdate } from "@selvuno/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { haptics } from "../lib/haptics";
import { testSettings } from "../test/fixtures";
import { HapticsSettings } from "./HapticsSettings";

const t = getDictionary("en-US");
function Fixture({ save = vi.fn().mockResolvedValue(undefined), enabled = false }: { save?: (update: SettingsUpdate) => Promise<void>; enabled?: boolean }) {
  const [settings, setSettings] = useState({ ...testSettings, hapticsEnabled: enabled });
  return <HapticsSettings settings={settings} t={t} onUpdateSettings={async (update) => { await save(update); setSettings((previous) => ({ ...previous, ...update })); }} />;
}
afterEach(() => vi.restoreAllMocks());

describe("optional haptics settings", () => {
  it("starts off, persists opt-in, and only previews on explicit request", async () => {
    vi.spyOn(haptics, "isSupported").mockReturnValue(true);
    const play = vi.spyOn(haptics, "play").mockReturnValue(true);
    const save = vi.fn().mockResolvedValue(undefined);
    render(<Fixture save={save} />);
    expect(screen.getByRole("switch", { name: t.settings.haptics })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("button", { name: t.settings.hapticsTest })).toBeDisabled();
    expect(play).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("switch", { name: t.settings.haptics }));
    expect(save).toHaveBeenCalledWith({ hapticsEnabled: true });
    expect(play).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: t.settings.hapticsTest }));
    expect(play).toHaveBeenCalledExactlyOnceWith("selection", true);
    expect(screen.getByRole("status")).toHaveTextContent(t.settings.hapticsRequested);
  });
  it("explains lack of browser support and still allows turning an imported preference off", async () => {
    vi.spyOn(haptics, "isSupported").mockReturnValue(false);
    const cancel = vi.spyOn(haptics, "cancel");
    const { rerender } = render(<Fixture />);
    expect(screen.getByText(t.settings.hapticsUnsupported)).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeDisabled();
    rerender(<Fixture key="imported" enabled />);
    expect(screen.getByRole("switch")).toBeEnabled();
    await userEvent.click(screen.getByRole("switch"));
    expect(cancel).toHaveBeenCalledOnce();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });
  it("keeps the switch off if saving fails", async () => {
    vi.spyOn(haptics, "isSupported").mockReturnValue(true);
    const play = vi.spyOn(haptics, "play").mockReturnValue(true);
    render(<Fixture save={vi.fn().mockRejectedValue(new Error("storage full"))} />);
    await userEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(screen.getByRole("switch")).toBeEnabled());
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("button", { name: t.settings.hapticsTest })).toBeDisabled();
    expect(play).not.toHaveBeenCalled();
  });
  it("does not claim physical vibration when the browser rejects the request", async () => {
    vi.spyOn(haptics, "isSupported").mockReturnValue(true);
    vi.spyOn(haptics, "play").mockReturnValue(false);
    render(<Fixture enabled />);
    await userEvent.click(screen.getByRole("button", { name: t.settings.hapticsTest }));
    expect(screen.getByRole("status")).toHaveTextContent(t.settings.hapticsBlocked);
  });
});
