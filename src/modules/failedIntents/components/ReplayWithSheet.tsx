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
import { CheckCircle2, GitCompare } from "lucide-react";

import type { FailedIntent, Manifest } from "../domain/entities";
import type { UploadMap } from "../application/dto";
import { useBlobParts } from "../presentation/hooks/useBlobParts";
import { useMultipartEditState } from "./multipartEditor/useMultipartEditState";
import { MultipartEditor } from "./multipartEditor/MultipartEditor";
import { VentaReplayForm } from "./ventaReplayForm/VentaReplayForm";

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

// ─── JSON branch ─────────────────────────────────────────────────────────────
//
// VentaReplayForm owns the editor surface — for venta-shaped bodies it
// renders the ventasLocales tabs (Cliente, Plan, Productos, …); for
// anything else it falls back to a raw-JSON textarea. The body it
// surfaces is the live, parsed value the operator is composing; this
// branch tracks dirtiness vs. the captured original and arms the
// submit button accordingly.

function JsonBranch({
  intent,
  pending,
  onSubmitJson,
  onCancel,
}: ReplayWithSheetProps) {
  const originalBody = useMemo(() => intent?.body ?? {}, [intent]);
  const originalKey = useMemo(() => stableStringify(originalBody), [originalBody]);
  const [draft, setDraft] = useState<unknown>(originalBody);

  useEffect(() => {
    setDraft(originalBody);
  }, [originalBody]);

  const dirty = useMemo(() => stableStringify(draft) !== originalKey, [draft, originalKey]);
  const canSubmit = dirty && !pending;

  return (
    <>
      <div className="flex-1 min-h-0">
        <VentaReplayForm
          initialBody={originalBody}
          onChange={setDraft}
          key={intent?.id ?? "none"}
        />
      </div>

      <SheetFooter className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 flex-row justify-between sm:justify-between gap-2">
        <DiffIndicator dirty={dirty} />
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Cancelar
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => onSubmitJson(draft)}
            data-testid="replay-with-submit"
          >
            {pending ? "Replayeando…" : "Guardar y reenviar"}
          </Button>
        </div>
      </SheetFooter>
    </>
  );
}

// stableStringify sorts object keys recursively so structurally-equal
// objects produce identical strings regardless of property order.
// Used to track form vs. original dirtiness — the form may re-emit
// fields in a different order than they came in over the wire.
function stableStringify(v: unknown): string {
  return JSON.stringify(v, function (_, value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      return Object.keys(obj)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = obj[k];
          return acc;
        }, {});
    }
    return value;
  });
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

