import { Layers, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { MontoInput } from "./MontoInput";
import { CantidadInput } from "./CantidadInput";
import { SeleccionarAlmacenCombobox } from "./SeleccionarAlmacenCombobox";
import type {
  ComboFormData,
  ValidationError,
} from "../../../presentation/hooks/useVentaEditState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CombosTableInlineProps {
  combos: ComboFormData[];
  almacenes: ReadonlyArray<{ id: number; nombre: string }>;
  errors: ValidationError[];
  onUpdate: (
    index: number,
    field: keyof ComboFormData,
    value: ComboFormData[keyof ComboFormData],
  ) => void;
  onRemove: (index: number) => void;
  onRestore: (index: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CombosTableInline = ({
  combos,
  almacenes,
  errors,
  onUpdate,
  onRemove,
  onRestore,
}: CombosTableInlineProps) => {
  if (combos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-card py-12 text-muted-foreground">
        <Layers className="h-8 w-8" />
        <p className="text-sm">Sin combos en esta venta.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Nombre
            </TableHead>
            <TableHead className="w-20 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Cant.
            </TableHead>
            <TableHead className="w-28 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Anual
            </TableHead>
            <TableHead className="w-28 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Corto
            </TableHead>
            <TableHead className="w-28 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Contado
            </TableHead>
            <TableHead className="w-56 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Almacenes
            </TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {combos.map((c, index) => {
            const cantidadError = errors.find(
              (e) => e.field === `combos[${c.id}].cantidad`,
            );
            const anualError = errors.find(
              (e) => e.field === `combos[${c.id}].precioAnual`,
            );
            const cortoError = errors.find(
              (e) => e.field === `combos[${c.id}].precioCortoPlazo`,
            );
            const contadoError = errors.find(
              (e) => e.field === `combos[${c.id}].precioContado`,
            );

            return (
              <TableRow
                key={c.id}
                className={cn(
                  c.isNew && !c.isDeleted && "bg-chart-2/5",
                  c.isDeleted && "[&_td]:opacity-50",
                )}
              >
                {/* Nombre */}
                <TableCell>
                  <Input
                    value={c.nombre}
                    onChange={(e) => onUpdate(index, "nombre", e.target.value)}
                    className={cn(
                      "h-7 text-sm",
                      c.isDeleted && "line-through decoration-destructive/60",
                    )}
                  />
                </TableCell>

                {/* Cantidad */}
                <TableCell>
                  <CantidadInput
                    value={c.cantidad}
                    onChange={(v) => onUpdate(index, "cantidad", v)}
                    error={!!cantidadError}
                    compact
                  />
                </TableCell>

                {/* Anual */}
                <TableCell>
                  <MontoInput
                    value={String(c.precioAnual)}
                    onChange={(v) => onUpdate(index, "precioAnual", parseFloat(v) || 0)}
                    error={!!anualError}
                    compact
                  />
                </TableCell>

                {/* Corto */}
                <TableCell>
                  <MontoInput
                    value={String(c.precioCortoPlazo)}
                    onChange={(v) =>
                      onUpdate(index, "precioCortoPlazo", parseFloat(v) || 0)
                    }
                    error={!!cortoError}
                    compact
                  />
                </TableCell>

                {/* Contado */}
                <TableCell>
                  <MontoInput
                    value={String(c.precioContado)}
                    onChange={(v) =>
                      onUpdate(index, "precioContado", parseFloat(v) || 0)
                    }
                    error={!!contadoError}
                    compact
                  />
                </TableCell>

                {/* Almacenes */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <SeleccionarAlmacenCombobox
                      value={c.almacenOrigenID}
                      onChange={(v) => onUpdate(index, "almacenOrigenID", v ?? 0)}
                      almacenes={almacenes}
                      placeholder="Origen"
                      disabled
                    />
                  </div>
                </TableCell>

                {/* Acciones */}
                <TableCell>
                  {c.isDeleted ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded hover:bg-muted/40 text-muted-foreground transition-colors"
                      onClick={() => onRestore(index)}
                      title="Restaurar"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                      onClick={() => onRemove(index)}
                      title="Eliminar"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
