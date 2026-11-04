import { describe, expect, it, vi } from "vitest";
import { cameraKind, openReceiptCamera, selectReceiptCamera, type ReceiptCameraDevice } from "./receiptCamera";

const cameras: ReceiptCameraDevice[] = [
  { deviceId: "ultra", label: "Back Ultra Wide Camera", kind: "ultrawide" },
  { deviceId: "front", label: "Front Camera", kind: "front" },
  { deviceId: "main", label: "Back Wide Camera", kind: "main" },
  { deviceId: "tele", label: "Back Telephoto Camera", kind: "telephoto" }
];

function cameraStream(deviceId: string) {
  const stop = vi.fn();
  const track = { stop, getSettings: () => ({ deviceId }) };
  return { stream: { getTracks: () => [track], getVideoTracks: () => [track] } as unknown as MediaStream, stop };
}

function mediaFixture(getUserMedia: ReturnType<typeof vi.fn>, enumerateDevices = vi.fn().mockResolvedValue(
  cameras.map((camera) => ({ ...camera, kind: "videoinput" }))
)) {
  return { getUserMedia, enumerateDevices } as unknown as MediaDevices;
}

describe("receipt camera selection", () => {
  it("distinguishes the standard wide lens from ultra-wide, telephoto, and virtual cameras", () => {
    expect(cameraKind("Back Ultra Wide Camera")).toBe("ultrawide");
    expect(cameraKind("Back Wide Angle Camera")).toBe("main");
    expect(cameraKind("Back Triple Camera")).toBe("rear");
    expect(cameraKind("Back Telephoto Camera")).toBe("telephoto");
    expect(cameraKind("Camera 1", ["user"])).toBe("front");
    expect(cameraKind("Основная камера")).toBe("main");
    expect(selectReceiptCamera(cameras, "ultra")).toBe("main");
    expect(selectReceiptCamera(cameras, "ultra", "tele")).toBe("tele");
  });

  it("does not guess the main lens from device ordering or unidentified labels", () => {
    const unknown: ReceiptCameraDevice[] = [
      { deviceId: "one", label: "Camera 1", kind: "unknown" },
      { deviceId: "two", label: "Camera 2", kind: "unknown" }
    ];
    expect(selectReceiptCamera(unknown, "two")).toBe("two");
    expect(selectReceiptCamera(unknown, "two", "missing")).toBe("two");
  });

  it("releases the initial lens before opening the main rear camera by exact ID", async () => {
    const ultra = cameraStream("ultra");
    const main = cameraStream("main");
    const getUserMedia = vi.fn().mockResolvedValueOnce(ultra.stream).mockImplementationOnce(async (constraints) => {
      expect(ultra.stop).toHaveBeenCalled();
      expect(constraints.video.deviceId).toEqual({ exact: "main" });
      expect(constraints.audio).toBe(false);
      return main.stream;
    });
    const result = await openReceiptCamera(mediaFixture(getUserMedia), null, new AbortController().signal);
    expect(result.deviceId).toBe("main");
    expect(result.stream).toBe(main.stream);
    expect(main.stop).not.toHaveBeenCalled();
  });

  it("opens a remembered camera directly without first opening the browser default", async () => {
    const tele = cameraStream("tele");
    const getUserMedia = vi.fn().mockResolvedValue(tele.stream);
    const result = await openReceiptCamera(mediaFixture(getUserMedia), "tele", new AbortController().signal);
    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(getUserMedia.mock.calls[0][0].video.deviceId).toEqual({ exact: "tele" });
    expect(result.deviceId).toBe("tele");
  });

  it("recovers from a missing saved camera and restricted device enumeration", async () => {
    const fallback = cameraStream("default");
    const getUserMedia = vi.fn()
      .mockRejectedValueOnce(new DOMException("Device removed", "OverconstrainedError"))
      .mockResolvedValueOnce(fallback.stream);
    const result = await openReceiptCamera(mediaFixture(getUserMedia, vi.fn().mockRejectedValue(new Error("Restricted"))), "missing", new AbortController().signal);
    expect(result.stream).toBe(fallback.stream);
    expect(result.preferredUnavailable).toBe(true);
    expect(result.cameras).toEqual([]);
  });

  it("keeps an available stream if the advertised main lens cannot be opened", async () => {
    const ultra = cameraStream("ultra");
    const fallback = cameraStream("ultra");
    const getUserMedia = vi.fn().mockResolvedValueOnce(ultra.stream)
      .mockRejectedValueOnce(new DOMException("Unavailable lens", "NotReadableError"))
      .mockResolvedValueOnce(fallback.stream);
    const result = await openReceiptCamera(mediaFixture(getUserMedia), null, new AbortController().signal);
    expect(result.stream).toBe(fallback.stream);
    expect(result.deviceId).toBe("ultra");
  });

  it("stops a late camera stream when the capture UI has already closed", async () => {
    const late = cameraStream("main");
    let resolve!: (stream: MediaStream) => void;
    const getUserMedia = vi.fn(() => new Promise<MediaStream>((done) => { resolve = done; }));
    const controller = new AbortController();
    const pending = openReceiptCamera(mediaFixture(getUserMedia), null, controller.signal);
    controller.abort();
    resolve(late.stream);
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(late.stop).toHaveBeenCalled();
  });

  it("does not retry permission denial or leave a camera running on failure", async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
    await expect(openReceiptCamera(mediaFixture(getUserMedia), "main", new AbortController().signal)).rejects.toMatchObject({ name: "NotAllowedError" });
    expect(getUserMedia).toHaveBeenCalledOnce();
  });
});
