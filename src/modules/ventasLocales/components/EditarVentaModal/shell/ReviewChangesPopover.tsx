import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DiffSummary } from "./computeDiffSummary";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  diffSummary: DiffSummary;
  isDirty: boolean;
  hasErrors: boolean;
  saving: boolean;
  onConfirmSave: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ReviewChangesPopover = ({
  diffSummary,
  isDirty,
  hasErrors,
  saving,
  onConfirmSave,
}: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          disabled={!isDirty || hasErrors || saving}
        >
          Revisar y guardar
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-[420px] p-0 rounded-lg border border-border/60 bg-card shadow-xl"
      >
        <header className="border-b border-border/60 px-5 py-3">
          <h3 className="font-serif text-lg font-normal">Resumen de cambios</h3>
        </header>
        <div className="max-h-[320px] overflow-y-auto px-5 py-4">
          {diffSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin cambios.</p>
          ) : (
            diffSummary.map((delta) => (
              <div
                key={delta.section}
                className="flex items-baseline justify-between gap-3 border-b border-border/60 last:border-0 py-2"
              >
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground shrink-0">
                  {delta.section}
                </span>
                <span className="text-xs text-foreground text-right">
                  {delta.summary}
                </span>
              </div>
            ))
          )}
        </div>
        <footer className="border-t border-border/60 px-5 py-3 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setOpen(false);
              onConfirmSave();
            }}
            disabled={saving || diffSummary.length === 0}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Confirmar"
            )}
          </Button>
        </footer>
      </PopoverContent>
    </Popover>
  );
};
