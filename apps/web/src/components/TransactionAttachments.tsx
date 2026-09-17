import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, FileText, Image, Paperclip, Plus, X } from "lucide-react";
import type { TransactionAttachment } from "../db/models";
import type { Dictionary } from "../i18n";
import {
  ATTACHMENT_MAX_FILES,
  validateAttachment
} from "../lib/transactionAttachments";
import { Button } from "./ui/Button";

interface TransactionAttachmentsProps {
  existing: TransactionAttachment[];
  pending: File[];
  t: Dictionary;
  onAdd: (files: File[]) => void;
  onRemoveExisting: (id: string) => void;
  onRemovePending: (index: number) => void;
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState("");
  const totalCount = existing.length + pending.length;

  function openNativeCameraFallback() {
    setCameraOpen(false);
    setError(t.transaction.cameraUnavailable);
    window.setTimeout(() => nativeCameraInputRef.current?.click(), 0);
  }

  useEffect(() => {
    if (!cameraOpen) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraReady(false);
      return;
    }

    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      openNativeCameraFallback();
      return;
    }

    void navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(openNativeCameraFallback);
        }
      })
      .catch(() => {
        if (!cancelled) {
          openNativeCameraFallback();
        }
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraOpen, t.transaction.cameraUnavailable]);

  useEffect(() => {
    if (!cameraOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [cameraOpen]);

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

  function openBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }
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

  return (
    <section className="app-control grid gap-3 rounded-xl p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
            <Paperclip className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{t.transaction.attachments}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted">{t.transaction.attachmentsHint}</p>
          </div>
        </div>
        {totalCount ? (
          <span className="app-field rounded-full px-2 py-1 text-xs font-semibold text-muted">
            {totalCount}/{ATTACHMENT_MAX_FILES}
          </span>
        ) : null}
      </div>

      {totalCount ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {existing.map((attachment) => (
            <div key={attachment.id} className="app-field grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl p-2">
              <button
                type="button"
                className="app-focus grid h-10 w-10 place-items-center rounded-lg bg-elevated text-accent"
                aria-label={t.transaction.openAttachment}
                onClick={() => openBlob(attachment.blob)}
              >
                {attachment.mimeType === "application/pdf" ? <FileText className="h-5 w-5" /> : <Image className="h-5 w-5" />}
              </button>
              <button
                type="button"
                className="app-focus min-w-0 text-left"
                aria-label={`${t.transaction.openAttachment}: ${attachment.name}`}
                onClick={() => openBlob(attachment.blob)}
              >
                <span className="block truncate text-xs font-semibold text-foreground">{attachment.name}</span>
                <span className="block text-[11px] text-muted">{formatFileSize(attachment.size)}</span>
              </button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={t.transaction.removeAttachment} onClick={() => onRemoveExisting(attachment.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {pending.map((file, index) => (
            <div key={`${file.name}-${file.lastModified}-${index}`} className="app-field grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl p-2">
              <button
                type="button"
                className="app-focus grid h-10 w-10 place-items-center rounded-lg bg-elevated text-accent"
                aria-label={t.transaction.openAttachment}
                onClick={() => openBlob(file)}
              >
                {file.type === "application/pdf" ? <FileText className="h-5 w-5" /> : <Image className="h-5 w-5" />}
              </button>
              <button
                type="button"
                className="app-focus min-w-0 text-left"
                aria-label={`${t.transaction.openAttachment}: ${file.name}`}
                onClick={() => openBlob(file)}
              >
                <span className="block truncate text-xs font-semibold text-foreground">{file.name}</span>
                <span className="block text-[11px] text-muted">{formatFileSize(file.size)}</span>
              </button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={t.transaction.removeAttachment} onClick={() => onRemovePending(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" disabled={totalCount >= ATTACHMENT_MAX_FILES} onClick={() => setCameraOpen(true)}>
          <Camera className="h-4 w-4" />
          {t.transaction.takePhoto}
        </Button>
        <Button type="button" variant="secondary" disabled={totalCount >= ATTACHMENT_MAX_FILES} onClick={() => fileInputRef.current?.click()}>
          <Plus className="h-4 w-4" />
          {t.transaction.chooseFile}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <input
        ref={nativeCameraInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      {error ? <p className="text-xs font-medium text-expense">{error}</p> : null}
      <p className="text-[11px] leading-4 text-muted">{t.transaction.attachmentLocalOnly}</p>

      {cameraOpen ? createPortal(
        <div className="fixed inset-0 z-[200] grid bg-black text-white" role="dialog" aria-modal="true" aria-label={t.transaction.cameraTitle}>
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full min-h-0 w-full object-cover"
            onLoadedMetadata={() => setCameraReady(true)}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
            <p className="text-sm font-semibold">{t.transaction.cameraTitle}</p>
            <Button type="button" variant="secondary" size="icon" className="pointer-events-auto border-white/15 bg-black/35 text-white" onClick={() => setCameraOpen(false)} aria-label={t.common.close}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/80 to-transparent px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-16">
            <button
              type="button"
              disabled={!cameraReady}
              className="pointer-events-auto grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-white/25 shadow-2xl disabled:opacity-40"
              onClick={capturePhoto}
              aria-label={t.transaction.takePhoto}
            >
              <span className="h-14 w-14 rounded-full bg-white" />
            </button>
          </div>
        </div>,
        document.body
      ) : null}
    </section>
  );
}
