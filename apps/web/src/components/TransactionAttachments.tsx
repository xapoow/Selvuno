import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, FileImage, FileText, LoaderCircle, Paperclip, Plus, ScanLine, X } from "lucide-react";
import type { TransactionAttachment } from "../db/models";
import type { Dictionary } from "../i18n";
import { ATTACHMENT_MAX_FILES, validateAttachment } from "../lib/transactionAttachments";
import { openReceiptCamera, readReceiptCamera, rememberReceiptCamera, stopCamera, type ReceiptCameraDevice } from "../lib/receiptCamera";
import { Button } from "./ui/Button";

interface TransactionAttachmentsProps {
  existing: TransactionAttachment[];
  pending: File[];
  t: Dictionary;
  onAdd: (files: File[]) => void;
  onRemoveExisting: (id: string) => void;
  onRemovePending: (index: number) => void;
}

interface AttachmentPreview {
  key: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  remove: () => void;
}

function formatFileSize(size: number): string {
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function TransactionAttachments({
  existing,
  pending,
  t,
  onAdd,
  onRemoveExisting,
  onRemovePending
}: TransactionAttachmentsProps) {
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const removeExistingRef = useRef(onRemoveExisting);
  const removePendingRef = useRef(onRemovePending);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameras, setCameras] = useState<ReceiptCameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState("");
  const [requestedCameraId, setRequestedCameraId] = useState<string | null>(null);
  const [cameraMessage, setCameraMessage] = useState("");
  const [viewer, setViewer] = useState<AttachmentPreview | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const totalCount = existing.length + pending.length;

  removeExistingRef.current = onRemoveExisting;
  removePendingRef.current = onRemovePending;

  const previews = useMemo<AttachmentPreview[]>(
    () => [
      ...existing.map((attachment) => ({
        key: attachment.id,
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        url: URL.createObjectURL(attachment.blob),
        remove: () => removeExistingRef.current(attachment.id)
      })),
      ...pending.map((file, index) => ({
        key: `pending-${file.name}-${file.lastModified}-${index}`,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        remove: () => removePendingRef.current(index)
      }))
    ],
    [existing, pending]
  );

  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [previews]
  );

  function openNativeCameraFallback() {
    setCameraOpen(false);
    setError(t.transaction.cameraUnavailable);
    window.setTimeout(() => nativeCameraInputRef.current?.click(), 0);
  }

  useEffect(() => {
    if (!cameraOpen) {
      setCameraReady(false);
      setRequestedCameraId(null);
      setCameras([]);
      setActiveCameraId("");
      return;
    }
    const controller = new AbortController();
    let ownedStream: MediaStream | null = null;
    setCameraReady(false);
    setCameraMessage("");
    if (!navigator.mediaDevices?.getUserMedia) {
      openNativeCameraFallback();
      return;
    }
    void openReceiptCamera(navigator.mediaDevices, requestedCameraId ?? readReceiptCamera(), controller.signal)
      .then(({ stream, cameras: availableCameras, deviceId, preferredUnavailable }) => {
        if (controller.signal.aborted) {
          stopCamera(stream);
          return;
        }
        ownedStream = stream;
        streamRef.current = stream;
        setCameras(availableCameras);
        setActiveCameraId(deviceId);
        if (preferredUnavailable) setCameraMessage(t.transaction.cameraSwitchError);
        if (requestedCameraId && deviceId === requestedCameraId) rememberReceiptCamera(deviceId);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {
            if (!controller.signal.aborted) openNativeCameraFallback();
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) openNativeCameraFallback();
      });
    return () => {
      controller.abort();
      stopCamera(ownedStream);
      if (streamRef.current === ownedStream) streamRef.current = null;
    };
  }, [cameraOpen, requestedCameraId, t.transaction.cameraUnavailable, t.transaction.cameraSwitchError]);

  useEffect(() => {
    if (!cameraOpen && !sourceOpen && !viewer) return;
    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, [cameraOpen, sourceOpen, viewer]);

  function addFiles(files: File[]) {
    setError("");
    if (totalCount + files.length > ATTACHMENT_MAX_FILES) {
      setError(t.transaction.attachmentLimitError);
      return;
    }
    const invalid = files.find((file) => validateAttachment(file));
    if (invalid) {
      setError(
        validateAttachment(invalid) === "size"
          ? t.transaction.attachmentSizeError
          : t.transaction.attachmentTypeError
      );
      return;
    }
    onAdd(files);
  }

  function chooseSource(input: "gallery" | "document") {
    setSourceOpen(false);
    window.setTimeout(
      () => (input === "gallery" ? galleryInputRef.current : documentInputRef.current)?.click(),
      180
    );
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        addFiles([
          new File([blob], `receipt-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`, {
            type: "image/jpeg"
          })
        ]);
        setCameraOpen(false);
      },
      "image/jpeg",
      0.9
    );
  }

  const overlays = createPortal(
    <AnimatePresence>
      {sourceOpen ? (
        <motion.div className="fixed inset-0 z-[190] flex items-end bg-black/60 px-3 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSourceOpen(false)}>
          <motion.section role="dialog" aria-modal="true" aria-label={t.transaction.sourceTitle} className="app-surface mx-auto w-full max-w-lg rounded-t-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-2xl" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 420, damping: 38 }} onClick={(event) => event.stopPropagation()}>
            <span className="mx-auto block h-1 w-10 rounded-full bg-line" />
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{t.transaction.sourceTitle}</h3>
                <p className="mt-1 text-sm text-muted">{t.transaction.sourceHint}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setSourceOpen(false)} aria-label={t.common.close}><X className="h-5 w-5" /></Button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: t.transaction.cameraSource, icon: Camera, action: () => { setSourceOpen(false); setCameraOpen(true); } },
                { label: t.transaction.photoLibrary, icon: FileImage, action: () => chooseSource("gallery") },
                { label: t.transaction.pdfDocument, icon: FileText, action: () => chooseSource("document") }
              ].map((item) => (
                <motion.button key={item.label} type="button" whileTap={{ scale: 0.96 }} className="app-focus app-field flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl px-2 py-4 text-center" onClick={item.action}>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent"><item.icon className="h-5 w-5" /></span>
                  <span className="text-xs font-semibold leading-4 text-foreground">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.section>
        </motion.div>
      ) : null}

      {cameraOpen ? (
        <motion.div className="fixed inset-0 z-[200] overflow-hidden bg-black text-white" role="dialog" aria-modal="true" aria-label={t.transaction.cameraTitle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <video ref={videoRef} playsInline muted className={`h-full w-full object-cover transition-opacity duration-200 ${cameraReady ? "opacity-100" : "opacity-0"}`} onLoadedData={() => {
            if (videoRef.current?.srcObject === streamRef.current && streamRef.current) setCameraReady(true);
          }} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.28)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/75 to-transparent p-4 pb-16 pt-[calc(env(safe-area-inset-top)+1rem)]">
            <div><p className="text-base font-semibold">{t.transaction.cameraTitle}</p><p className="mt-0.5 text-xs text-white/70">{t.transaction.receiptGuide}</p></div>
            <Button type="button" variant="secondary" size="icon" className="pointer-events-auto border-white/15 bg-black/30 text-white backdrop-blur-xl" onClick={() => setCameraOpen(false)} aria-label={t.common.close}><X className="h-5 w-5" /></Button>
          </div>
          <div className="pointer-events-none absolute inset-8 bottom-52 top-32 rounded-[2rem] border border-white/35">
            <span className="absolute -left-px -top-px h-12 w-12 rounded-tl-[2rem] border-l-4 border-t-4 border-accent" />
            <span className="absolute -right-px -top-px h-12 w-12 rounded-tr-[2rem] border-r-4 border-t-4 border-accent" />
            <span className="absolute -bottom-px -left-px h-12 w-12 rounded-bl-[2rem] border-b-4 border-l-4 border-accent" />
            <span className="absolute -bottom-px -right-px h-12 w-12 rounded-br-[2rem] border-b-4 border-r-4 border-accent" />
            <ScanLine className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white/65" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 grid justify-items-center gap-4 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-12">
            <div className="min-h-5 text-center text-xs text-white/80" role="status" aria-live="polite">
              {!cameraReady ? <span className="inline-flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" />{t.transaction.cameraStarting}</span> : cameraMessage}
            </div>
            {cameras.length > 1 ? (
              <div className="pointer-events-auto flex max-w-full gap-2 overflow-x-auto rounded-2xl p-1 no-scrollbar" role="group" aria-label={t.transaction.cameraSelect}>
                {cameras.map((camera) => {
                  const sameKind = cameras.filter((item) => item.kind === camera.kind);
                  const label = `${t.transaction.cameraLabels[camera.kind]}${sameKind.length > 1 ? ` ${sameKind.findIndex((item) => item.deviceId === camera.deviceId) + 1}` : ""}`;
                  const selected = activeCameraId === camera.deviceId;
                  return (
                    <button
                      key={camera.deviceId}
                      type="button"
                      title={camera.label || label}
                      aria-label={camera.label || label}
                      aria-pressed={selected}
                      disabled={!cameraReady}
                      onClick={() => { if (!selected) setRequestedCameraId(camera.deviceId); }}
                      className={`min-h-11 shrink-0 rounded-full border px-4 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 ${selected ? "border-white/50 bg-white/20 text-white" : "border-white/15 bg-black/40 text-white/70"}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <motion.button type="button" whileTap={cameraReady ? { scale: 0.9 } : undefined} disabled={!cameraReady} className="pointer-events-auto grid h-20 w-20 place-items-center rounded-full border-[5px] border-white/90 bg-white/20 shadow-2xl backdrop-blur-sm disabled:opacity-40" onClick={capturePhoto} aria-label={t.transaction.takePhoto}><span className="h-14 w-14 rounded-full bg-white shadow-inner" /></motion.button>
          </div>
        </motion.div>
      ) : null}

      {viewer ? (
        <motion.div className="fixed inset-0 z-[210] grid grid-rows-[auto_minmax(0,1fr)] bg-black/90 text-white backdrop-blur-xl" role="dialog" aria-modal="true" aria-label={viewer.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{viewer.name}</p><p className="text-xs text-white/60">{formatFileSize(viewer.size)}</p></div>
            <Button type="button" variant="secondary" size="icon" className="border-white/15 bg-white/10 text-white" onClick={() => setViewer(null)} aria-label={t.common.close}><X className="h-5 w-5" /></Button>
          </div>
          <div className="min-h-0 px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            {viewer.mimeType === "application/pdf" ? <iframe title={viewer.name} src={viewer.url} className="h-full w-full rounded-2xl bg-white" /> : <motion.img src={viewer.url} alt={viewer.name} className="h-full w-full rounded-2xl object-contain" initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} />}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2"><Paperclip className="h-4 w-4 shrink-0 text-accent" /><div className="min-w-0"><p className="text-sm font-semibold text-foreground">{t.transaction.attachments}</p><p className="truncate text-xs text-muted">{t.transaction.attachmentsHint}</p></div></div>
        {totalCount ? <span className="text-xs font-semibold text-muted">{totalCount}/{ATTACHMENT_MAX_FILES}</span> : null}
      </div>

      <AnimatePresence initial={false}>
        {previews.length ? (
          <motion.div className="flex snap-x gap-2 overflow-x-auto pb-1 no-scrollbar" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            {previews.map((preview) => (
              <motion.article key={preview.key} layout className="app-control group relative w-36 shrink-0 snap-start overflow-hidden rounded-2xl">
                <button type="button" className="app-focus block w-full text-left" onClick={() => setViewer(preview)} aria-label={`${t.transaction.openAttachment}: ${preview.name}`}>
                  <span className="relative block aspect-[4/3] overflow-hidden bg-elevated">
                    {preview.mimeType === "application/pdf" ? <span className="grid h-full place-items-center bg-gradient-to-br from-expense/20 to-elevated text-expense"><FileText className="h-8 w-8" /></span> : <img src={preview.url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
                    <span className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/55 to-transparent" />
                  </span>
                  <span className="block px-2.5 pb-2.5 pt-2"><span className="block truncate text-xs font-semibold text-foreground">{preview.name}</span><span className="block text-[11px] text-muted">{formatFileSize(preview.size)}</span></span>
                </button>
                <button type="button" className="app-focus absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur-md" onClick={preview.remove} aria-label={t.transaction.removeAttachment}><X className="h-3.5 w-3.5" /></button>
              </motion.article>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button type="button" whileTap={{ scale: 0.985 }} disabled={totalCount >= ATTACHMENT_MAX_FILES} className={`app-focus relative overflow-hidden rounded-2xl border border-dashed p-4 text-left transition-colors disabled:opacity-50 ${dragActive ? "border-accent bg-accent-soft" : "border-line bg-elevated/35 hover:border-accent/50 hover:bg-elevated/60"}`} onClick={() => setSourceOpen(true)} onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragActive(false)} onDrop={(event) => { event.preventDefault(); setDragActive(false); addFiles(Array.from(event.dataTransfer.files)); }}>
        <span className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent"><Plus className="h-5 w-5" /></span><span className="min-w-0"><span className="block text-sm font-semibold text-foreground">{t.transaction.addAttachment}</span><span className="mt-0.5 block text-xs leading-5 text-muted">{t.transaction.sourceHint}</span></span></span>
      </motion.button>

      <input ref={galleryInputRef} className="hidden" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      <input ref={documentInputRef} className="hidden" type="file" multiple accept="application/pdf" onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      <input ref={nativeCameraInputRef} className="hidden" type="file" accept="image/*" capture="environment" onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      <AnimatePresence>{error ? <motion.p className="px-1 text-xs font-medium text-expense" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.p> : null}</AnimatePresence>
      <p className="px-1 text-[11px] leading-4 text-muted">{t.transaction.attachmentLocalOnly}</p>
      {overlays}
    </section>
  );
}
