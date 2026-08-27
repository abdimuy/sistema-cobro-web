import { Layers, Plus, RotateCcw, X } from "lucide-react";
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
  ProductoFormData,
  ValidationError,
} from "../../../presentation/hooks/useVentaEditState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CombosTableInlineProps {
  combos: ComboFormData[];
  /**
   * Lista COMPLETA de productos de la venta, no sólo los del combo: los
   * callbacks de edición se indexan por la posición global en formData, así
   * que la fila anidada tiene que conocer ese índice.
   */
  productos: ProductoFormData[];
  almacenes: ReadonlyArray<{ id: number; nombre: string }>;
  errors: ValidationError[];
  onUpdate: (
    index: number,
    field: keyof ComboFormData,
    value: ComboFormData[keyof ComboFormData],
  ) => void;
  onRemove: (index: number) => void;
  onRestore: (index: number) => void;
  onUpdateProducto: (
    index: number,
    field: keyof ProductoFormData,
    value: ProductoFormData[keyof ProductoFormData],
  ) => void;
  onRemoveProducto: (index: number) => void;
  onRestoreProducto: (index: number) => void;
  onAgregarProducto: (combo: ComboFormData) => void;
}

const COLUMNAS = 7;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Los productos de cada combo se editan ANIDADOS bajo su combo.
 *
 * Antes no se podían editar en absoluto —sólo el nombre, la cantidad y los
 * tres precios del combo—, y la gente descubrió sola el rodeo de borrar el
 * combo y crear otro. Ese rodeo le da al combo nuevo un id nuevo, y ningún
 * orden de las dos peticiones viejas podía guardarlo.
 *
 * Anidar (en vez de un panel lateral por combo) hace visible la contención
 * —"este combo lleva estos productos"— y deja el alta dentro del propio combo,
 * que es donde la gente la buscaba. Además reutiliza los mismos controles en
 * línea que el resto del modal, sin inventar un patrón nuevo.
 */
export const CombosTableInline = ({
  combos,
  productos,
  almacenes,
  errors,
  onUpdate,
  onRemove,
  onRestore,
  onUpdateProducto,
  onRemoveProducto,
  onRestoreProducto,
  onAgregarProducto,
}: CombosTableInlineProps) => {
  if (combos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-card py-12 text-muted-foreground">
        <Layers className="h-8 w-8" />
        <p className="text-sm">Sin combos en esta venta.</p>
      </div>
    );
  }

  // Índice global por combo: [{ producto, index }] en el orden de formData.
  const productosPorCombo = new Map<string, Array<{ p: ProductoFormData; index: number }>>();
  productos.forEach((p, index) => {
    if (p.comboID === null) return;
    const fila = productosPorCombo.get(p.comboID) ?? [];
    fila.push({ p, index });
    productosPorCombo.set(p.comboID, fila);
  });

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

            const contenido = productosPorCombo.get(c.id) ?? [];
            const activos = contenido.filter(({ p }) => !p.isDeleted);

            return [
              <TableRow
                key={c.id}
                data-testid={`combo-row-${c.id}`}
                className={cn(
                  c.isNew && !c.isDeleted && "bg-chart-2/5",
                  c.isDeleted && "[&_td]:opacity-50",
                )}
              >
                {/* Nombre */}
                <TableCell>
                  <Input
                    value={c.nombre}
                    aria-label={`Nombre del combo ${c.nombre}`}
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
                      value={c.almacenOrigenID > 0 ? c.almacenOrigenID : null}
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
              </TableRow>,

              ...contenido.map(({ p, index: pIndex }) => {
                const pCantidadError = errors.find(
                  (e) => e.field === `productos[${p.id}].cantidad`,
                );
                const pAnualError = errors.find(
                  (e) => e.field === `productos[${p.id}].precioAnual`,
                );
                const pCortoError = errors.find(
                  (e) => e.field === `productos[${p.id}].precioCortoPlazo`,
                );
                const pContadoError = errors.find(
                  (e) => e.field === `productos[${p.id}].precioContado`,
                );

                return (
                  <TableRow
                    key={p.id}
                    data-testid={`combo-producto-row-${p.id}`}
                    className={cn(
                      "bg-muted/10",
                      p.isNew && !p.isDeleted && "bg-chart-2/5",
                      (p.isDeleted || c.isDeleted) && "[&_td]:opacity-50",
                    )}
                  >
                    <TableCell className="pl-8">
                      <div
                        className={cn(
                          "border-l border-border/60 pl-3",
                          (p.isDeleted || c.isDeleted) &&
                            "line-through decoration-destructive/60",
                        )}
                      >
                        <span className="text-sm text-foreground">{p.articulo}</span>
                        <br />
                        <span className="font-mono text-[10px] text-muted-foreground/70">
                          ID {p.articuloId}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <CantidadInput
                        value={p.cantidad}
                        onChange={(v) => onUpdateProducto(pIndex, "cantidad", v)}
                        error={!!pCantidadError}
                        compact
                      />
                    </TableCell>

                    <TableCell>
                      <MontoInput
                        value={String(p.precioAnual)}
                        onChange={(v) =>
                          onUpdateProducto(pIndex, "precioAnual", parseFloat(v) || 0)
                        }
                        error={!!pAnualError}
                        compact
                      />
                    </TableCell>

                    <TableCell>
                      <MontoInput
                        value={String(p.precioCortoPlazo)}
                        onChange={(v) =>
                          onUpdateProducto(pIndex, "precioCortoPlazo", parseFloat(v) || 0)
                        }
                        error={!!pCortoError}
                        compact
                      />
                    </TableCell>

                    <TableCell>
                      <MontoInput
                        value={String(p.precioContado)}
                        onChange={(v) =>
                          onUpdateProducto(pIndex, "precioContado", parseFloat(v) || 0)
                        }
                        error={!!pContadoError}
                        compact
                      />
                    </TableCell>

                    <TableCell>
                      <span className="text-[11px] text-muted-foreground">
                        Hereda combo
                      </span>
                    </TableCell>

                    <TableCell>
                      {p.isDeleted ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded hover:bg-muted/40 text-muted-foreground transition-colors"
                          onClick={() => onRestoreProducto(pIndex)}
                          title="Restaurar"
                          /* Con el combo quitado, devolver un producto suelto
                             lo dejaría apuntando a un combo ausente: el mismo
                             422 del servidor. Se restaura el combo primero. */
                          disabled={c.isDeleted}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                          onClick={() => onRemoveProducto(pIndex)}
                          title="Eliminar"
                          disabled={c.isDeleted}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              }),

              <TableRow
                key={`${c.id}-agregar`}
                className={cn("bg-muted/10", c.isDeleted && "[&_td]:opacity-50")}
              >
                <TableCell colSpan={COLUMNAS} className="py-1.5 pl-8">
                  <div className="flex items-center gap-3 border-l border-border/60 pl-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 gap-1 px-2 text-[11px]"
                      onClick={() => onAgregarProducto(c)}
                      disabled={c.isDeleted}
                    >
                      <Plus className="h-3 w-3" />
                      Producto
                    </Button>
                    {activos.length === 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        Combo vacío
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>,
            ];
          })}
        </TableBody>
      </Table>
    </div>
  );
};
