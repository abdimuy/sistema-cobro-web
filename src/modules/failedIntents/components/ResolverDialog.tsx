import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ResolveStatus } from "../application/dto";

const NOTES_MAX = 500;

export function ResolverDialog({
  open,
  pending,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  pending: boolean;
  onSubmit: (input: { status: ResolveStatus; notes: string }) => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState<ResolveStatus>("ignored");
  const [notes, setNotes] = useState("");
  const runeCount = [...notes].length;
  const overLimit = runeCount > NOTES_MAX;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolver intento</DialogTitle>
          <DialogDescription>
            Cerrá este intento sin reintentarlo. Los cambios son visibles a
            otros administradores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-zinc-500">
              Estado
            </Label>
            <div className="flex gap-2">
              <StatusOption
                value="ignored"
                label="Ignorar"
                description="Falsa alarma — no se requiere acción"
                active={status === "ignored"}
                onClick={() => setStatus("ignored")}
              />
              <StatusOption
                value="resolved_manual"
                label="Resuelto manualmente"
                description="Se arregló fuera del sistema"
                active={status === "resolved_manual"}
                onClick={() => setStatus("resolved_manual")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="resolver-notes" className="text-xs uppercase tracking-wider text-zinc-500">
                Notas
              </Label>
              <span
                className={cn(
                  "text-[11px] font-mono",
                  overLimit ? "text-red-500" : "text-zinc-400",
                )}
                data-testid="notes-counter"
              >
                {runeCount}/{NOTES_MAX}
              </span>
            </div>
            <Textarea
              id="resolver-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Por qué se está cerrando este intento"
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Cancelar
          </Button>
          <Button
            disabled={pending || overLimit}
            onClick={() => onSubmit({ status, notes })}
            data-testid="resolver-submit"
          >
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusOption({
  value: _value,
  label,
  description,
  active,
  onClick,
}: {
  value: ResolveStatus;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 text-left p-3 rounded-lg border transition-colors",
        active
          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
      )}
    >
      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}
      </div>
      <div className="text-[11px] text-zinc-500 mt-0.5">{description}</div>
    </button>
  );
}
