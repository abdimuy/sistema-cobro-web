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
  ValidationError,
} from "../../../presentation/hooks/useVentaEditState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductosTableInlineProps {
  /**
   * Lista COMPLETA de productos de la venta. Aquí sólo se pintan los sueltos
   * (los de combo viven anidados bajo su combo en CombosTableInline), pero el
   * índice que reciben los callbacks es el global en formData.
   */
  productos: ProductoFormData[];
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
  almacenes,
  errors,
  onUpdate,
  onRemove,
  onRestore,
}: ProductosTableInlineProps) => {
  // Sólo los sueltos, conservando el índice global de formData.
  const filas = productos
    .map((p, index) => ({ p, index }))
    .filter(({ p }) => p.comboID === null);

  if (filas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-card py-12 text-muted-foreground">
        <Package className="h-8 w-8" />
        <p className="text-sm">Sin productos sueltos.</p>
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
            <TableHead className="w-56 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Almacenes
            </TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map(({ p, index }) => {
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

                {/* Almacenes */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <SeleccionarAlmacenCombobox
                      value={p.almacenOrigenID}
                      onChange={(v) => onUpdate(index, "almacenOrigenID", v)}
                      almacenes={almacenes}
                      placeholder="Origen"
                      disabled
                    />
                  </div>
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
