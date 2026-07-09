"use client";

import { useRef, useState } from "react";
import { FileIcon, Loader2, Upload, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  acceptAttribute,
  formatBytes,
  UPLOAD_CONSTRAINTS,
  validateUpload,
  type UploadKind,
} from "@/lib/validations/upload";
import { Button } from "@/components/ui/button";

/** The metadata an upload yields, persisted on the item. */
export interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

/**
 * Drag-and-drop file uploader for file/image items. On drop/select it validates
 * client-side (UX), then uploads to `/api/items/upload` via XHR (for real upload
 * progress) and reports the stored file up via `onChange`. While a file is set
 * it shows an image thumbnail (images) or a file info row (files) with a remove
 * control. `onUploadingChange` lets the parent disable submit mid-upload.
 */
export function FileUpload({
  kind,
  value,
  onChange,
  onUploadingChange,
}: {
  kind: UploadKind;
  value: UploadedFile | null;
  onChange: (value: UploadedFile | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const constraints = UPLOAD_CONSTRAINTS[kind];
  const maxMb = Math.round(constraints.maxBytes / (1024 * 1024));

  function setUploadingState(next: boolean) {
    setUploading(next);
    onUploadingChange?.(next);
  }

  function upload(file: File) {
    const validation = validateUpload(kind, {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setError(null);
    setProgress(0);
    setUploadingState(true);

    const form = new FormData();
    form.append("kind", kind);
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/items/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      xhrRef.current = null;
      setUploadingState(false);
      let json: { success?: boolean; data?: UploadedFile; error?: string } = {};
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        // fall through to the generic error below
      }
      if (xhr.status >= 200 && xhr.status < 300 && json.success && json.data) {
        onChange(json.data);
      } else {
        setError(json.error ?? "Upload failed. Please try again.");
      }
    };

    xhr.onerror = () => {
      xhrRef.current = null;
      setUploadingState(false);
      setError("Upload failed. Please try again.");
    };

    xhr.send(form);
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) upload(file);
  }

  function handleRemove() {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setUploadingState(false);
    setError(null);
    setProgress(0);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const isImage = kind === "image";

  // Uploaded state — preview + remove.
  if (value) {
    return (
      <div className="rounded-lg border border-border p-3">
        <div className="flex items-center gap-3">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.fileUrl}
              alt={value.fileName}
              className="size-14 shrink-0 rounded-md border border-border object-cover"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
              <FileIcon className="size-6 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {value.fileName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(value.fileSize)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove file"
            onClick={handleRemove}
          >
            <X />
          </Button>
        </div>
      </div>
    );
  }

  // Empty state — dropzone (or uploading progress).
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!uploading) handleFiles(e.dataTransfer.files);
        }}
        disabled={uploading}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "hover:border-muted-foreground/50 hover:bg-muted/40",
          uploading && "cursor-default",
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Uploading… {progress}%
            </span>
            <span className="h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-primary transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </span>
          </>
        ) : (
          <>
            <Upload className="size-5 text-muted-foreground" />
            <span className="text-sm text-foreground">
              Drag & drop, or{" "}
              <span className="font-medium text-primary">browse</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {constraints.extensions.join(", ")} · up to {maxMb}MB
            </span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={acceptAttribute(kind)}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
