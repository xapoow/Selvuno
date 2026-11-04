const CAMERA_KEY = "myfinances:receipt-camera:v1";

export type CameraKind = "main" | "rear" | "ultrawide" | "telephoto" | "front" | "unknown";
export interface ReceiptCameraDevice {
  deviceId: string;
  label: string;
  kind: CameraKind;
}

export function cameraKind(label: string, facingModes: string[] = []): CameraKind {
  if (facingModes.includes("user") || /front|facetime|selfie|передн|фронт/i.test(label)) return "front";
  if (/ultra[\s-]*wide|ultra[\s-]*angle|сверхшир|ультрашир|0[.,]5\s*[x×]/i.test(label)) return "ultrawide";
  if (/telephoto|tele\b|перископ|телефото/i.test(label)) return "telephoto";
  if (/\bdual\b|\btriple\b|\blogical\b/i.test(label)) return "rear";
  if (/\bmain\b|\bprimary\b|\bwide\b|основн|главн/i.test(label)) return "main";
  if (facingModes.includes("environment") || /back|rear|задн|тылов/i.test(label)) return "rear";
  return "unknown";
}

export function selectReceiptCamera(cameras: ReceiptCameraDevice[], currentId: string, preferredId?: string | null): string {
  if (preferredId && cameras.some((camera) => camera.deviceId === preferredId)) return preferredId;
  const scores: Record<CameraKind, number> = { main: 100, rear: 50, unknown: 0, ultrawide: -10, telephoto: -10, front: -100 };
  const current = cameras.find((camera) => camera.deviceId === currentId);
  const best = cameras.reduce<ReceiptCameraDevice | undefined>((result, camera) =>
    !result || scores[camera.kind] > scores[result.kind] ? camera : result, current);
  // Device order is not a reliable lens identifier: keep the browser choice when labels are ambiguous.
  return best && scores[best.kind] > 0 ? best.deviceId : currentId;
}

export function readReceiptCamera(): string | null {
  try { return localStorage.getItem(CAMERA_KEY); } catch { return null; }
}

export function rememberReceiptCamera(deviceId: string) {
  try { localStorage.setItem(CAMERA_KEY, deviceId); } catch { /* Camera access works without storage. */ }
}

export function stopCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export async function openReceiptCamera(media: MediaDevices, preferredId: string | null, signal: AbortSignal) {
  let stream: MediaStream | null = null;
  let preferredUnavailable = false;
  const stop = () => stopCamera(stream);
  signal.addEventListener("abort", stop);
  function checkCancelled() {
    if (signal.aborted) throw new DOMException("Camera closed", "AbortError");
  }
  function activeStream(): MediaStream {
    if (!stream) throw new Error("Camera did not return a stream.");
    return stream;
  }
  async function acquire(deviceId?: string | null) {
    checkCancelled();
    stream = await media.getUserMedia({
      audio: false,
      video: {
        ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: "environment" } }),
        width: { ideal: 1920 }, height: { ideal: 1080 }
      }
    });
    checkCancelled();
    return stream;
  }
  try {
    if (preferredId) {
      try { await acquire(preferredId); } catch (cause) {
        checkCancelled();
        if (cause instanceof DOMException && ["NotAllowedError", "SecurityError"].includes(cause.name)) throw cause;
        preferredUnavailable = true;
      }
    }
    if (!stream) await acquire();
    checkCancelled();
    const currentId = activeStream().getVideoTracks()[0]?.getSettings().deviceId ?? "";
    let cameras: ReceiptCameraDevice[] = [];
    try {
      cameras = (await media.enumerateDevices()).filter((device) => device.kind === "videoinput" && device.deviceId)
        .map((device) => {
          let facingModes: string[] = [];
          try { facingModes = (device as InputDeviceInfo).getCapabilities?.().facingMode ?? []; } catch { /* Optional API. */ }
          return { deviceId: device.deviceId, label: device.label, kind: cameraKind(device.label, facingModes) };
        });
    } catch { /* Keep the working stream if device enumeration is restricted. */ }
    checkCancelled();
    const selectedId = selectReceiptCamera(cameras, currentId, preferredUnavailable ? null : preferredId);
    if (selectedId && selectedId !== currentId) {
      stop();
      try { await acquire(selectedId); } catch {
        checkCancelled();
        // Some browsers list lenses that cannot actually be opened independently.
        await acquire();
      }
    }
    const selectedStream = activeStream();
    return {
      stream: selectedStream,
      cameras,
      deviceId: selectedStream.getVideoTracks()[0]?.getSettings().deviceId ?? "",
      preferredUnavailable
    };
  } catch (cause) {
    stop();
    throw cause;
  } finally {
    signal.removeEventListener("abort", stop);
  }
}
