import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  FileImage,
  FileText,
  File as FileIcon,
  Trash2,
  RotateCcw,
  Replace,
  Download,
} from "lucide-react";

import type { BlobPart } from "../../domain/entities";
import type { PartEditAction } from "./useMultipartEditState";
import { VentaReplayForm } from "../ventaReplayForm/VentaReplayForm";
import { isVentaShapedBody } from "../../infrastructure/mappers/isVentaShapedBody";

const PREVIEWABLE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const TEXT_FIELD_TYPES = new Set([
  "application/json",
  "application/xml",
  "text/plain",
  "text/html",
]);

const sizeFormatter = new Intl.NumberFormat("es-MX");

export type PartCardProps = {
  part: BlobPart;
  action: PartEditAction;
  onAction: (next: PartEditAction) => void;
  // Downloads the original bytes of this part. The component caches the
  // result in object-URL form for image preview / download buttons.
  downloadPart: (index: number) => Promise<Blob>;
};

export function PartCard({
  part,
  action,
  onAction,
  downloadPart,
}: PartCardProps) {
  if (part.kind.isField()) {
    return <FieldCard part={part} action={action} onAction={onAction} />;
  }
  return (
    <FileCard
      part={part}
      action={action}
      onAction={onAction}
      downloadPart={downloadPart}
    />
  );
}

// ─── Field card ──────────────────────────────────────────────────────────────

function FieldCard({
  part,
  action,
  onAction,
}: {
  part: BlobPart;
  action: PartEditAction;
  onAction: (next: PartEditAction) => void;
}) {
  const original = useMemo(() => {
    if (!part.value) return "";
    return new TextDecoder("utf-8", { fatal: false }).decode(part.value);
  }, [part.value]);

  const editedText = useMemo(() => {
    if (action.kind === "field") {
      return new TextDecoder("utf-8", { fatal: false }).decode(action.value);
    }
    return original;
  }, [action, original]);

  // For the canonical venta multipart, the `datos` field carries the
  // full CrearVentaBody as JSON. If we can parse it and it's
  // venta-shaped, host VentaReplayForm inside this card so the
  // operator gets the tab editor instead of a textarea full of JSON.
  const ventaForm = useMemo(() => {
    if (part.name !== "datos") return null;
    if (part.contentType !== "application/json") return null;
    try {
      const parsed = JSON.parse(editedText);
      if (!isVentaShapedBody(parsed)) return null;
      return { initialBody: parsed };
    } catch {
      return null;
    }
  }, [part.name, part.contentType, editedText]);

  const isTextFriendly = TEXT_FIELD_TYPES.has(part.contentType);
  const isRemoved = action.kind === "remove";
  const isEdited = action.kind === "field";

  if (isRemoved) {
    return (
      <RemovedShell
        part={part}
        onRestore={() => onAction({ kind: "keep" })}
      />
    );
  }

  return (
    <article
      className={cn(
        "rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950",
        isEdited && "border-amber-500/40 dark:border-amber-500/40",
      )}
      data-testid={`part-card-${part.index}`}
    >
      <CardHeader part={part} dirty={isEdited} />
      <div className="px-3 py-2 space-y-2">
        {ventaForm !== null ? (
          <VentaReplayForm
            initialBody={ventaForm.initialBody}
            onChange={(next) => {
              const text = JSON.stringify(next);
              if (text === original) {
                onAction({ kind: "keep" });
              } else {
                onAction({ kind: "field", value: new TextEncoder().encode(text) });
              }
            }}
          />
        ) : isTextFriendly ? (
          <Textarea
            value={editedText}
            onChange={(e) => {
              const bytes = new TextEncoder().encode(e.target.value);
              if (e.target.value === original) {
                onAction({ kind: "keep" });
              } else {
                onAction({ kind: "field", value: bytes });
              }
            }}
            className="min-h-[120px] font-mono text-xs"
            data-testid={`part-field-textarea-${part.index}`}
          />
        ) : (
          <Input
            value={editedText}
            onChange={(e) => {
              const bytes = new TextEncoder().encode(e.target.value);
              if (e.target.value === original) {
                onAction({ kind: "keep" });
              } else {
                onAction({ kind: "field", value: bytes });
              }
            }}
            className="font-mono text-xs"
          />
        )}
      </div>
      <CardActions
        dirty={isEdited}
        onReset={isEdited ? () => onAction({ kind: "keep" }) : undefined}
        onRemove={() => onAction({ kind: "remove" })}
      />
    </article>
  );
}

// ─── File card ───────────────────────────────────────────────────────────────

function FileCard({
  part,
  action,
  onAction,
  downloadPart,
}: {
  part: BlobPart;
  action: PartEditAction;
  onAction: (next: PartEditAction) => void;
  downloadPart: (index: number) => Promise<Blob>;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const replacement =
    action.kind === "replace" ? action.file : null;
  const isRemoved = action.kind === "remove";

  useEffect(() => {
    if (isRemoved) return;
    if (!PREVIEWABLE_IMAGE_TYPES.has(part.contentType)) return;
    let cancelled = false;
    let url: string | null = null;

    downloadPart(part.index)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch((e: unknown) => {
        if (!cancelled) setPreviewError(String(e));
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [part.index, part.contentType, downloadPart, isRemoved]);

  const onPickReplacement = (file: File | null) => {
    if (file) onAction({ kind: "replace", file });
  };

  if (isRemoved) {
    return (
      <RemovedShell part={part} onRestore={() => onAction({ kind: "keep" })} />
    );
  }

  return (
    <article
      className={cn(
        "rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950",
        replacement && "border-amber-500/40 dark:border-amber-500/40",
      )}
      data-testid={`part-card-${part.index}`}
    >
      <CardHeader part={part} dirty={!!replacement} />
      <div className="px-3 py-3 flex gap-3 items-start">
        <PreviewBox
          previewUrl={previewUrl}
          replacement={replacement}
          contentType={part.contentType}
          previewError={previewError}
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate">
            {replacement ? replacement.name : (part.filename ?? "(sin nombre)")}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {sizeFormatter.format(
              replacement ? replacement.size : part.sizeBytes,
            )}{" "}
            bytes · {replacement ? replacement.type : part.contentType}
          </div>
          {replacement && (
            <Badge variant="outline" className="text-[10px]">
              Reemplazado
            </Badge>
          )}
          <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            <Replace className="h-3 w-3" />
            <span>Reemplazar archivo</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) =>
                onPickReplacement(e.target.files?.[0] ?? null)
              }
              data-testid={`part-file-replace-${part.index}`}
            />
          </label>
        </div>
      </div>
      <CardActions
        dirty={!!replacement}
        onReset={replacement ? () => onAction({ kind: "keep" }) : undefined}
        onRemove={() => onAction({ kind: "remove" })}
        downloadHref={previewUrl ?? undefined}
        downloadName={part.filename ?? undefined}
      />
    </article>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CardHeader({ part, dirty }: { part: BlobPart; dirty: boolean }) {
  const icon = iconFor(part.contentType);
  return (
    <header className="px-3 py-2 flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate">
          {part.name ?? "(sin nombre)"}
        </span>
        <Badge
          variant="outline"
          className="text-[10px] uppercase tracking-wide shrink-0"
        >
          {part.kind.value}
        </Badge>
      </div>
      {dirty && (
        <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wide">
          editado
        </span>
      )}
    </header>
  );
}

function CardActions({
  dirty,
  onReset,
  onRemove,
  downloadHref,
  downloadName,
}: {
  dirty: boolean;
  onReset?: () => void;
  onRemove: () => void;
  downloadHref?: string;
  downloadName?: string;
}) {
  return (
    <footer className="px-3 py-2 flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900/30">
      <div className="flex items-center gap-1">
        {downloadHref && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            asChild
          >
            <a href={downloadHref} download={downloadName ?? "part.bin"}>
              <Download className="h-3 w-3" />
              Descargar
            </a>
          </Button>
        )}
      </div>
      <div className="flex items-center gap-1">
        {dirty && onReset && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={onReset}
            data-testid="part-reset"
          >
            <RotateCcw className="h-3 w-3" />
            Deshacer
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
          onClick={onRemove}
          data-testid="part-remove"
        >
          <Trash2 className="h-3 w-3" />
          Quitar
        </Button>
      </div>
    </footer>
  );
}

function RemovedShell({
  part,
  onRestore,
}: {
  part: BlobPart;
  onRestore: () => void;
}) {
  return (
    <article
      className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-3 py-2 flex items-center justify-between opacity-70"
      data-testid={`part-card-${part.index}`}
    >
      <div className="text-xs text-zinc-500 line-through font-mono">
        {part.name ?? "(sin nombre)"}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRestore}
        className="h-7 text-xs gap-1"
        data-testid="part-restore"
      >
        <RotateCcw className="h-3 w-3" />
        Restaurar
      </Button>
    </article>
  );
}

function PreviewBox({
  previewUrl,
  replacement,
  contentType,
  previewError,
}: {
  previewUrl: string | null;
  replacement: File | null;
  contentType: string;
  previewError: string | null;
}) {
  const isImage = PREVIEWABLE_IMAGE_TYPES.has(contentType);
  if (replacement) {
    const replacementUrl = useMemoizedObjectURL(replacement);
    return (
      <ImageOrPlaceholder
        url={replacementUrl}
        contentType={replacement.type}
        previewError={null}
      />
    );
  }
  if (isImage) {
    return (
      <ImageOrPlaceholder
        url={previewUrl}
        contentType={contentType}
        previewError={previewError}
      />
    );
  }
  return <PlaceholderIcon contentType={contentType} />;
}

function ImageOrPlaceholder({
  url,
  contentType,
  previewError,
}: {
  url: string | null;
  contentType: string;
  previewError: string | null;
}) {
  if (previewError) {
    return <PlaceholderIcon contentType={contentType} />;
  }
  if (!url) {
    return (
      <div className="w-16 h-16 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse shrink-0" />
    );
  }
  return (
    <img
      src={url}
      alt="vista previa"
      className="w-16 h-16 rounded-md object-cover shrink-0 border border-zinc-200/60 dark:border-zinc-800/60"
    />
  );
}

function PlaceholderIcon({ contentType }: { contentType: string }) {
  return (
    <div className="w-16 h-16 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
      {iconFor(contentType, "lg")}
    </div>
  );
}

function iconFor(contentType: string, size: "sm" | "lg" = "sm") {
  const cls = size === "lg" ? "h-5 w-5 text-zinc-400" : "h-3.5 w-3.5 text-zinc-400";
  if (contentType.startsWith("image/")) {
    return <FileImage className={cls} />;
  }
  if (
    contentType.startsWith("text/") ||
    contentType === "application/json" ||
    contentType === "application/xml"
  ) {
    return <FileText className={cls} />;
  }
  return <FileIcon className={cls} />;
}

// useMemoizedObjectURL keeps an object URL alive for the lifetime of the
// caller's hook, revoking on unmount or replacement-file change.
function useMemoizedObjectURL(file: File): string {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);
  return url;
}
