import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CampoInline } from "../piezas/CampoInline";
import { MontoInput } from "../piezas/MontoInput";
import { CantidadInput } from "../piezas/CantidadInput";
import { SeleccionarAlmacenCombobox } from "../piezas/SeleccionarAlmacenCombobox";
import { Input } from "@/components/ui/input";
import type {
  ComboFormData,
  AlmacenesFormData,
} from "../../../presentation/hooks/useVentaEditState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgregarComboPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  almacenesDefault: AlmacenesFormData;
  /** Catálogo de almacenes. Iba vacío: los selectores no ofrecían nada. */
  almacenes: ReadonlyArray<{ id: number; nombre: string }>;
  onAgregar: (c: Omit<ComboFormData, "id" | "isNew" | "isDeleted">) => void;
}

interface ComboFormState {
  nombre: string;
  cantidad: number;
  precioAnual: string;
  precioCortoPlazo: string;
  precioContado: string;
  almacenOrigenID: number;
  almacenDestinoID: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AgregarComboPanel = ({
  open,
  onOpenChange,
  almacenesDefault,
  almacenes,
  onAgregar,
}: AgregarComboPanelProps) => {
  const [form, setForm] = useState<ComboFormState>({
    nombre: "",
    cantidad: 1,
    precioAnual: "0.00",
    precioCortoPlazo: "0.00",
    precioContado: "0.00",
    almacenOrigenID: almacenesDefault.almacenOrigenID,
    almacenDestinoID: almacenesDefault.almacenDestinoID,
  });

  // Reset form when panel opens/closes or default almacenes change
  useEffect(() => {
    if (open) {
      setForm({
        nombre: "",
        cantidad: 1,
        precioAnual: "0.00",
        precioCortoPlazo: "0.00",
        precioContado: "0.00",
        almacenOrigenID: almacenesDefault.almacenOrigenID,
        almacenDestinoID: almacenesDefault.almacenDestinoID,
      });
    }
  }, [open, almacenesDefault.almacenOrigenID, almacenesDefault.almacenDestinoID]);

  const handleClose = () => {
    onOpenChange(false);
  };

  // Mismo guard que AgregarProductoPanel: sin almacén no se puede agregar.
  // En una venta 100 % combos el par por defecto salía en {0, 0} y el combo
  // nacía con almacén 0 — el guardado moría con "los ids de almacén deben ser
  // enteros positivos" sin marcar ningún campo.
  const noAlmacen = form.almacenOrigenID === 0 || form.almacenDestinoID === 0;

  const canSubmit = form.nombre.trim().length > 0 && form.cantidad > 0 && !noAlmacen;

  const handleAgregar = () => {
    if (!canSubmit) return;
    onAgregar({
      nombre: form.nombre.trim(),
      cantidad: form.cantidad,
      precioAnual: parseFloat(form.precioAnual) || 0,
      precioCortoPlazo: parseFloat(form.precioCortoPlazo) || 0,
      precioContado: parseFloat(form.precioContado) || 0,
      almacenOrigenID: form.almacenOrigenID,
      almacenDestinoID: form.almacenDestinoID,
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-20 bg-background/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Panel */}
      <aside
        className={cn(
          "absolute inset-y-0 right-0 z-30 flex w-full max-w-[480px] flex-col",
          "border-l border-border/60 bg-background shadow-2xl",
          "animate-in slide-in-from-right-4 duration-200",
        )}
        onKeyDown={(e) => {
          if (e.key === "Escape") handleClose();
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <h3 className="font-serif text-lg font-normal">Agregar combo</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <CampoInline label="Nombre del combo" obligatorio>
            <Input
              value={form.nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
              placeholder="ej. Sala + Comedor"
              autoFocus
            />
          </CampoInline>

          <CampoInline label="Cantidad" obligatorio>
            <CantidadInput
              value={form.cantidad}
              onChange={(v) => setForm((prev) => ({ ...prev, cantidad: v }))}
            />
          </CampoInline>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CampoInline label="Precio anual" obligatorio>
              <MontoInput
                value={form.precioAnual}
                onChange={(v) => setForm((prev) => ({ ...prev, precioAnual: v }))}
              />
            </CampoInline>
            <CampoInline label="Corto plazo" obligatorio>
              <MontoInput
                value={form.precioCortoPlazo}
                onChange={(v) => setForm((prev) => ({ ...prev, precioCortoPlazo: v }))}
              />
            </CampoInline>
            <CampoInline label="Contado" obligatorio>
              <MontoInput
                value={form.precioContado}
                onChange={(v) => setForm((prev) => ({ ...prev, precioContado: v }))}
              />
            </CampoInline>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CampoInline label="Almacén de origen" obligatorio>
              <SeleccionarAlmacenCombobox
                value={form.almacenOrigenID > 0 ? form.almacenOrigenID : null}
                onChange={(v) =>
                  setForm((prev) => ({ ...prev, almacenOrigenID: v ?? 0 }))
                }
                almacenes={almacenes}
                placeholder="Origen"
              />
            </CampoInline>
            <CampoInline label="Almacén de destino" obligatorio>
              <SeleccionarAlmacenCombobox
                value={form.almacenDestinoID > 0 ? form.almacenDestinoID : null}
                onChange={(v) =>
                  setForm((prev) => ({ ...prev, almacenDestinoID: v ?? 0 }))
                }
                almacenes={almacenes}
                placeholder="Destino"
              />
            </CampoInline>
          </div>

          {noAlmacen && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-[12px] text-destructive">
              Elegí origen y destino.
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-border/60 px-5 py-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={handleAgregar}
          >
            Agregar
          </Button>
        </footer>
      </aside>
    </>
  );
};
