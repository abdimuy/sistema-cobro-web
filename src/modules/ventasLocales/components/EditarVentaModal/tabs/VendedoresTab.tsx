import { useState } from "react";
import { Plus } from "lucide-react";
import { VendedorChipEditable } from "../piezas/VendedorChipEditable";
import { AgregarVendedorPanel } from "../panels/AgregarVendedorPanel";
import type {
  VendedorFormData,
  ValidationError,
} from "../../../presentation/hooks/useVentaEditState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VendedoresTabProps {
  vendedores: VendedorFormData[];
  errors: ValidationError[];
  onAdd: (v: Omit<VendedorFormData, "id" | "isNew" | "isDeleted">) => void;
  onUpdate: (
    i: number,
    field: keyof VendedorFormData,
    value: VendedorFormData[keyof VendedorFormData],
  ) => void;
  onRemove: (i: number) => void;
  onRestore: (i: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const VendedoresTab = ({
  vendedores,
  onAdd,
  onUpdate,
  onRemove,
}: VendedoresTabProps) => {
  const [showAddPanel, setShowAddPanel] = useState(false);

  const activeVendedores = vendedores.filter((v) => !v.isDeleted);

  return (
    <div className="relative">
      {/* Sub-card: Vendedores asignados */}
      <div className="rounded-lg border border-border/60 bg-card">
        <div className="border-b border-border/60 px-5 py-3">
          <h3 className="font-serif text-lg font-normal text-foreground">
            Vendedores asignados
          </h3>
        </div>
        <div className="px-5 py-5">
          {activeVendedores.length === 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-[12px] text-destructive mb-4">
              La venta requiere al menos un vendedor.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {vendedores.map((v, i) =>
              v.isDeleted ? null : (
                <VendedorChipEditable
                  key={v.id}
                  vendedor={v}
                  onRemove={() => onRemove(i)}
                  onEdit={(field, val) => onUpdate(i, field, val)}
                />
              ),
            )}

            <button
              type="button"
              onClick={() => setShowAddPanel(true)}
              className="inline-flex items-center gap-2 rounded-full border border-dashed border-border/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
              Agregar vendedor
            </button>
          </div>
        </div>
      </div>

      {/* Side-panel */}
      <AgregarVendedorPanel
        open={showAddPanel}
        onOpenChange={setShowAddPanel}
        vendedoresActuales={vendedores}
        onAgregar={(v) => {
          onAdd(v);
        }}
      />
    </div>
  );
};
