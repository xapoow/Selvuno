import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { readReceiptCamera } from "../lib/receiptCamera";
import { TransactionAttachments } from "./TransactionAttachments";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("integrated receipt camera", () => {
  it("switches lenses, remembers the choice, and releases streams on close", async () => {
    const t = getDictionary("en-US");
    const stops: ReturnType<typeof vi.fn>[] = [];
    const getUserMedia = vi.fn(async (constraints: MediaStreamConstraints) => {
      const video = constraints.video as MediaTrackConstraints;
      const deviceId = (video.deviceId as ConstrainDOMStringParameters | undefined)?.exact as string ?? "main";
      const stop = vi.fn();
      stops.push(stop);
      const track = { stop, getSettings: () => ({ deviceId }) };
      return { getTracks: () => [track], getVideoTracks: () => [track] } as unknown as MediaStream;
    });
    const previousMediaDevices = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: {
      getUserMedia,
      enumerateDevices: vi.fn().mockResolvedValue([
        { kind: "videoinput", deviceId: "main", label: "Back Wide Camera" },
        { kind: "videoinput", deviceId: "ultra", label: "Back Ultra Wide Camera" }
      ])
    } });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    try {
      const user = userEvent.setup();
      const { unmount } = render(<TransactionAttachments existing={[]} pending={[]} t={t} onAdd={vi.fn()} onRemoveExisting={vi.fn()} onRemovePending={vi.fn()} />);
      await user.click(screen.getByRole("button", { name: new RegExp(t.transaction.addAttachment) }));
      await user.click(screen.getByRole("button", { name: t.transaction.cameraSource }));
      const dialog = await screen.findByRole("dialog", { name: t.transaction.cameraTitle });
      const video = dialog.querySelector("video")!;
      const shutter = within(dialog).getByRole("button", { name: t.transaction.takePhoto });
      const ultra = await within(dialog).findByRole("button", { name: "Back Ultra Wide Camera" });
      expect(shutter).toBeDisabled();
      fireEvent.loadedData(video);
      expect(shutter).toBeEnabled();
      await user.click(ultra);
      await waitFor(() => expect(ultra).toHaveAttribute("aria-pressed", "true"));
      expect(stops[0]).toHaveBeenCalled();
      expect(shutter).toBeDisabled();
      expect(readReceiptCamera()).toBe("ultra");
      expect(getUserMedia.mock.calls.at(-1)?.[0].video).toMatchObject({ deviceId: { exact: "ultra" } });
      fireEvent.loadedData(video);
      expect(shutter).toBeEnabled();
      await user.click(within(dialog).getByRole("button", { name: t.common.close }));
      expect(stops[1]).toHaveBeenCalled();
      unmount();
    } finally {
      if (previousMediaDevices) Object.defineProperty(navigator, "mediaDevices", previousMediaDevices);
      else Reflect.deleteProperty(navigator, "mediaDevices");
    }
  });
});
