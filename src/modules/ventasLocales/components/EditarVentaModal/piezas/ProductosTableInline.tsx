import { Package, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  ProductoFormData,
  ComboFormData,
  ValidationError,
} from "../../../presentation/hooks/useVentaEditState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductosTableInlineProps {
  productos: ProductoFormData[];
  combos: ComboFormData[];
  almacenes: ReadonlyArray<{ id: number; nombre: string }>;
  errors: ValidationError[];
  onUpdate: (
    index: number,
    field: keyof ProductoFormData,
    value: ProductoFormData[keyof ProductoFormData],
  ) => void;
  onRemove: (index: number) => void;
  onRestore: (index: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProductosTableInline = ({
  productos,
  combos,
  almacenes,
  errors,
  onUpdate,
  onRemove,
  onRestore,
}: ProductosTableInlineProps) => {
  const combosById = Object.fromEntries(combos.map((c) => [c.id, c]));

  const hasAnyActive = productos.some((p) => !p.isDeleted);

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-card py-12 text-muted-foreground">
        <Package className="h-8 w-8" />
        <p className="text-sm">Sin productos. Agregá al menos uno.</p>
      </div>
    );
  }

  if (!hasAnyActive && productos.every((p) => p.isDeleted)) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-card py-12 text-muted-foreground">
        <Package className="h-8 w-8" />
        <p className="text-sm">Sin productos. Agregá al menos uno.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Artículo
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
            <TableHead className="w-24 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Combo
            </TableHead>
            <TableHead className="w-56 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Almacenes
            </TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productos.map((p, index) => {
            const cantidadError = errors.find(
              (e) => e.field === `productos[${p.id}].cantidad`,
            );
            const anualError = errors.find(
              (e) => e.field === `productos[${p.id}].precioAnual`,
            );
            const cortoError = errors.find(
              (e) => e.field === `productos[${p.id}].precioCortoPlazo`,
            );
            const contadoError = errors.find(
              (e) => e.field === `productos[${p.id}].precioContado`,
            );

            return (
              <TableRow
                key={p.id}
                className={cn(
                  p.isNew && !p.isDeleted && "bg-chart-2/5",
                  p.isDeleted && "[&_td]:opacity-50",
                )}
              >
                {/* Artículo */}
                <TableCell>
                  <div className={cn(p.isDeleted && "line-through decoration-destructive/60")}>
                    <span className="text-sm text-foreground">{p.articulo}</span>
                    <br />
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                      ID {p.articuloId}
                    </span>
                  </div>
                </TableCell>

                {/* Cantidad */}
                <TableCell>
                  <CantidadInput
                    value={p.cantidad}
                    onChange={(v) => onUpdate(index, "cantidad", v)}
                    error={!!cantidadError}
                    compact
                  />
                </TableCell>

                {/* Anual */}
                <TableCell>
                  <MontoInput
                    value={String(p.precioAnual)}
                    onChange={(v) => onUpdate(index, "precioAnual", parseFloat(v) || 0)}
                    error={!!anualError}
                    compact
                  />
                </TableCell>

                {/* Corto */}
                <TableCell>
                  <MontoInput
                    value={String(p.precioCortoPlazo)}
                    onChange={(v) => onUpdate(index, "precioCortoPlazo", parseFloat(v) || 0)}
                    error={!!cortoError}
                    compact
                  />
                </TableCell>

                {/* Contado */}
                <TableCell>
                  <MontoInput
                    value={String(p.precioContado)}
                    onChange={(v) => onUpdate(index, "precioContado", parseFloat(v) || 0)}
                    error={!!contadoError}
                    compact
                  />
                </TableCell>

                {/* Combo */}
                <TableCell>
                  {p.comboID !== null ? (
                    <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium">
                      {combosById[p.comboID]?.nombre ?? "Combo"}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Almacenes */}
                <TableCell>
                  {p.comboID === null ? (
                    <div className="flex flex-col gap-1">
                      <SeleccionarAlmacenCombobox
                        value={p.almacenOrigenID}
                        onChange={(v) => onUpdate(index, "almacenOrigenID", v)}
                        almacenes={almacenes}
                        placeholder="Origen"
                      />
                      <SeleccionarAlmacenCombobox
                        value={p.almacenDestinoID}
                        onChange={(v) => onUpdate(index, "almacenDestinoID", v)}
                        almacenes={almacenes}
                        placeholder="Destino"
                      />
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Hereda combo
                    </span>
                  )}
                </TableCell>

                {/* Acciones */}
                <TableCell>
                  {p.isDeleted ? (
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
