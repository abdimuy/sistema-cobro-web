import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CampoInline } from "../piezas/CampoInline";
import { SeleccionarAlmacenCombobox } from "../piezas/SeleccionarAlmacenCombobox";
import { ProductosTableInline } from "../piezas/ProductosTableInline";
import { CombosTableInline } from "../piezas/CombosTableInline";
import { AgregarProductoPanel } from "../panels/AgregarProductoPanel";
import { AgregarComboPanel } from "../panels/AgregarComboPanel";
import useGetAlmacenes from "@/hooks/useGetAlmacenes";
import type {
  ProductoFormData,
  ComboFormData,
  AlmacenesFormData,
  ValidationError,
} from "../../../presentation/hooks/useVentaEditState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductosTabProps {
  productos: ProductoFormData[];
  combos: ComboFormData[];
  almacenes: AlmacenesFormData;
  errors: ValidationError[];
  onAddProducto: (p: Omit<ProductoFormData, "id" | "isNew" | "isDeleted">) => void;
  onUpdateProducto: (
    i: number,
    field: keyof ProductoFormData,
    value: ProductoFormData[keyof ProductoFormData],
  ) => void;
  onRemoveProducto: (i: number) => void;
  onRestoreProducto: (i: number) => void;
  onAddCombo: (c: Omit<ComboFormData, "id" | "isNew" | "isDeleted">) => void;
  onUpdateCombo: (
    i: number,
    field: keyof ComboFormData,
    value: ComboFormData[keyof ComboFormData],
  ) => void;
  onRemoveCombo: (i: number) => void;
  onRestoreCombo: (i: number) => void;
  onUpdateAlmacenesDefault: (field: keyof AlmacenesFormData, value: number) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SubSectionHeader = ({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
    <h3 className="font-serif text-lg font-normal text-foreground">{title}</h3>
    {action}
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const ProductosTab = ({
  productos,
  combos,
  almacenes,
  errors,
  onAddProducto,
  onUpdateProducto,
  onRemoveProducto,
  onRestoreProducto,
  onAddCombo,
  onUpdateCombo,
  onRemoveCombo,
  onRestoreCombo,
  onUpdateAlmacenesDefault,
}: ProductosTabProps) => {
  const [showAddProductoPanel, setShowAddProductoPanel] = useState(false);
  const [showAddComboPanel, setShowAddComboPanel] = useState(false);

  // Only show almacenes config section if there's at least one active non-combo producto
  const hasActivePlainProducto = productos.some(
    (p) => !p.isDeleted && p.comboID === null,
  );

  const hasNoActiveProductos =
    productos.filter((p) => !p.isDeleted).length === 0;

  const { almacenes: almacenesCatalog } = useGetAlmacenes();
  const almacenesList = useMemo(
    () => almacenesCatalog.map((a) => ({ id: a.ALMACEN_ID, nombre: a.ALMACEN })),
    [almacenesCatalog],
  );

  return (
    <div className="relative space-y-6">
      {/* Sub-card: Configuración de almacenes */}
      {hasActivePlainProducto && (
        <div className="rounded-lg border border-border/60 bg-card">
          <div className="border-b border-border/60 px-5 py-3">
            <h3 className="font-serif text-lg font-normal text-foreground">
              Configuración de almacenes
            </h3>
          </div>
          <div className="px-5 py-5">
            <div className="max-w-sm">
              <CampoInline
                label="Almacén de origen"
                helper="Informativo: de aquí salió el inventario al crear la venta. El traspaso ya se hizo, no se edita desde aquí."
              >
                <SeleccionarAlmacenCombobox
                  value={almacenes.almacenOrigenID > 0 ? almacenes.almacenOrigenID : null}
                  onChange={(v) => onUpdateAlmacenesDefault("almacenOrigenID", v ?? 0)}
                  almacenes={almacenesList}
                  placeholder="Origen"
                  disabled
                />
              </CampoInline>
            </div>
          </div>
        </div>
      )}

      {/* Sub-card: Combos */}
      <div className="rounded-lg border border-border/60 bg-card">
        <SubSectionHeader
          title="Combos"
          action={
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[12px]"
              onClick={() => setShowAddComboPanel(true)}
            >
              + Agregar combo
            </Button>
          }
        />
        <div className="px-5 py-5">
          <CombosTableInline
            combos={combos}
            almacenes={almacenesList}
            errors={errors}
            onUpdate={onUpdateCombo}
            onRemove={onRemoveCombo}
            onRestore={onRestoreCombo}
          />
        </div>
      </div>

      {/* Sub-card: Productos */}
      <div className="rounded-lg border border-border/60 bg-card">
        <SubSectionHeader
          title="Productos"
          action={
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[12px]"
              onClick={() => setShowAddProductoPanel(true)}
            >
              + Agregar producto
            </Button>
          }
        />
        <div className="px-5 py-5 space-y-3">
          {hasNoActiveProductos && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-[12px] text-destructive">
              La venta requiere al menos un producto.
            </div>
          )}
          <ProductosTableInline
            productos={productos}
            combos={combos}
            almacenes={almacenesList}
            errors={errors}
            onUpdate={onUpdateProducto}
            onRemove={onRemoveProducto}
            onRestore={onRestoreProducto}
          />
        </div>
      </div>

      {/* Side-panels */}
      <AgregarProductoPanel
        open={showAddProductoPanel}
        onOpenChange={setShowAddProductoPanel}
        almacenes={almacenes}
        productosExistentes={productos}
        onAgregar={(p) => {
          onAddProducto(p);
          setShowAddProductoPanel(false);
        }}
      />
      <AgregarComboPanel
        open={showAddComboPanel}
        onOpenChange={setShowAddComboPanel}
        almacenesDefault={almacenes}
        onAgregar={(c) => {
          onAddCombo(c);
          setShowAddComboPanel(false);
        }}
      />
    </div>
  );
};
