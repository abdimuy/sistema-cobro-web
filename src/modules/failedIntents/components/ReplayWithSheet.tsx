import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, GitCompare } from "lucide-react";

import type { FailedIntent, Manifest } from "../domain/entities";
import type { UploadMap } from "../application/dto";
import { useBlobParts } from "../presentation/hooks/useBlobParts";
import { useMultipartEditState } from "./multipartEditor/useMultipartEditState";
import { MultipartEditor } from "./multipartEditor/MultipartEditor";

// ReplayWithSheet is the unified replay-with surface. For JSON intents
// it renders an original-vs-edited JSON editor; for blob intents
// (`intent.hasBlob === true`) it renders MultipartEditor where the
// operator keeps / replaces / removes captured parts and may attach
// brand-new ones.
//
// Why a Sheet vs. a Dialog: replay-with editing is heavy — operators
// want space to read the original, edit, compare, then commit. A
// right-aligned Sheet at 95% width is the 2026 pattern (cf. Linear's
// full-row edit, Vercel's deploy detail).
//
// Two onSubmit callbacks instead of a union: the caller (the screen)
// always wires both, and ReplayWithSheet picks which one to fire based
// on intent.hasBlob. This keeps the call sites in the screen direct
// and type-safe.
export type ReplayWithSubmit =
  | { kind: "json"; body: unknown }
  | { kind: "multipart"; manifest: Manifest; uploads: UploadMap };

export type ReplayWithSheetProps = {
  intent: FailedIntent | null;
  open: boolean;
  pending: boolean;
  onSubmitJson: (body: unknown) => void;
  onSubmitMultipart: (manifest: Manifest, uploads: UploadMap) => void;
  onCancel: () => void;
};

export function ReplayWithSheet(props: ReplayWithSheetProps) {
  const { intent, open, onCancel } = props;
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onCancel()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none sm:w-[min(1200px,95vw)] flex flex-col p-0 gap-0"
      >
        <SheetHeader className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <SheetTitle>Replay con correcciones</SheetTitle>
          <SheetDescription>
            {intent?.hasBlob
              ? "Editá las partes del multipart antes de reenviar. La idempotency-key se genera fresca."
              : "Editá el body del intento y reenvialo. La idempotency-key se genera fresca para evitar conflictos."}
          </SheetDescription>
        </SheetHeader>

        {intent?.hasBlob ? (
          <MultipartBranch {...props} intent={intent} />
        ) : (
          <JsonBranch {...props} />
        )}

        {/* Footer for both branches is rendered inside the branch
            component so the buttons can see the dirty/canSubmit signal. */}
      </SheetContent>
    </Sheet>
  );
}

// ─── Multipart branch ────────────────────────────────────────────────────────

function MultipartBranch({
  intent,
  pending,
  onSubmitMultipart,
  onCancel,
}: ReplayWithSheetProps & { intent: FailedIntent }) {
  const parts = useBlobParts(intent.id);
  const edit = useMultipartEditState(parts.bundle);
  const built = edit.build();
  const canSubmit = edit.isDirty && built !== null && !pending;

  return (
    <>
      <div className="flex-1 min-h-0">
        <MultipartEditor intent={intent} parts={parts} edit={edit} />
      </div>

      <SheetFooter className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 flex-row justify-between sm:justify-between gap-2">
        <MultipartIndicator dirty={edit.isDirty} count={built?.manifest.length ?? 0} />
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Cancelar
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => built && onSubmitMultipart(built.manifest, built.uploads)}
            data-testid="replay-with-submit"
          >
            {pending ? "Replayeando…" : "Guardar y reenviar"}
          </Button>
        </div>
      </SheetFooter>
    </>
  );
}

function MultipartIndicator({
  dirty,
  count,
}: {
  dirty: boolean;
  count: number;
}) {
  if (!dirty) {
    return (
      <span className="text-[11px] text-zinc-400 inline-flex items-center gap-1">
        <GitCompare className="h-3 w-3" />
        Sin cambios
      </span>
    );
  }
  return (
    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
      <CheckCircle2 className="h-3 w-3" />
      {count} parte{count === 1 ? "" : "s"} en el body editado
    </span>
  );
}

// ─── JSON branch (existing behavior, preserved) ──────────────────────────────

function JsonBranch({
  intent,
  pending,
  onSubmitJson,
  onCancel,
}: ReplayWithSheetProps) {
  const originalText = useMemo(() => prettyPrint(intent?.body), [intent]);
  const [text, setText] = useState(originalText);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(originalText);
    setError(null);
  }, [originalText]);

  const parsed = useMemo(() => {
    if (!text.trim()) return { ok: false as const, error: "el body no puede estar vacío" };
    try {
      return { ok: true as const, value: JSON.parse(text) };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : "JSON inválido",
      };
    }
  }, [text]);

  const dirty = text !== originalText;
  const canSubmit = parsed.ok && dirty && !pending;

  const handleSubmit = () => {
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    onSubmitJson(parsed.value);
  };

  return (
    <>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
        <OriginalPane originalText={originalText} />
        <EditorPane
          text={text}
          onChange={(v) => {
            setText(v);
            setError(null);
          }}
          parseError={parsed.ok ? null : parsed.error}
          dirty={dirty}
        />
      </div>

      {error && (
        <div className="px-6 py-2 border-t border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <SheetFooter className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 flex-row justify-between sm:justify-between gap-2">
        <DiffIndicator dirty={dirty} />
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Cancelar
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={handleSubmit}
            data-testid="replay-with-submit"
          >
            {pending ? "Replayeando…" : "Guardar y reenviar"}
          </Button>
        </div>
      </SheetFooter>
    </>
  );
}

function OriginalPane({ originalText }: { originalText: string }) {
  return (
    <section className="flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800">
      <header className="px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-medium bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-1.5">
        <span>Original</span>
      </header>
      <ScrollArea className="flex-1">
        <pre className="px-4 py-3 text-xs font-mono leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-all">
          {originalText}
        </pre>
      </ScrollArea>
    </section>
  );
}

function EditorPane({
  text,
  onChange,
  parseError,
  dirty,
}: {
  text: string;
  onChange: (next: string) => void;
  parseError: string | null;
  dirty: boolean;
}) {
  return (
    <section className="flex flex-col min-h-0">
      <header className="px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-medium bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
        <span>Editado</span>
        {dirty && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 normal-case">
            modificado
          </span>
        )}
      </header>
      <Textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className={cn(
          "flex-1 rounded-none border-0 resize-none font-mono text-xs leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3",
          parseError && "bg-red-50/40 dark:bg-red-950/10",
        )}
        data-testid="replay-with-textarea"
        aria-invalid={parseError ? "true" : undefined}
        aria-label="Body corregido"
      />
      {parseError && (
        <div
          className="px-4 py-1.5 text-[11px] text-red-700 dark:text-red-300 border-t border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 flex items-center gap-1.5"
          data-testid="replay-with-parse-error"
        >
          <AlertCircle className="h-3 w-3" />
          <span className="font-mono">{parseError}</span>
        </div>
      )}
    </section>
  );
}

function DiffIndicator({ dirty }: { dirty: boolean }) {
  if (!dirty) {
    return (
      <span className="text-[11px] text-zinc-400 inline-flex items-center gap-1">
        <GitCompare className="h-3 w-3" />
        Sin cambios
      </span>
    );
  }
  return (
    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Body modificado
    </span>
  );
}

function prettyPrint(body: unknown): string {
  if (body === null || body === undefined) return "{}";
  try {
    return JSON.stringify(body, null, 2);
  } catch {
    return String(body);
  }
}
