import { useState } from "react";
import { Package, Trash2, RotateCcw, AlertCircle, Warehouse, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductoFormData, AlmacenesFormData, ValidationError } from "../types";
import useGetAlmacenes from "../../../../../hooks/useGetAlmacenes";
import AgregarProductoDialog from "../AgregarProductoDialog";

// ============================================================================
// Types
// ============================================================================

interface ProductosTabProps {
  productos: ProductoFormData[];
  almacenes: AlmacenesFormData;
  errors: ValidationError[];
  onAdd: (producto: ProductoFormData) => void;
  onUpdate: (index: number, field: keyof ProductoFormData, value: ProductoFormData[keyof ProductoFormData]) => void;
  onRemove: (index: number) => void;
  onRestore: (index: number) => void;
  onUpdateAlmacenes: (field: keyof AlmacenesFormData, value: number) => void;
}

// ============================================================================
// Almacenes Section Component
// ============================================================================

interface AlmacenesSectionProps {
  almacenes: AlmacenesFormData;
  onUpdate: (field: keyof AlmacenesFormData, value: number) => void;
}

const AlmacenesSection = ({ almacenes, onUpdate }: AlmacenesSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const { almacenes: listaAlmacenes, loading: loadingAlmacenes, getAlmacenById } = useGetAlmacenes();

  const almacenOrigen = getAlmacenById(almacenes.almacenOrigenId);
  const almacenDestino = getAlmacenById(almacenes.almacenDestinoId);

  return (
    <div className="p-4 bg-muted rounded-lg border border-border">
      {/* Header colapsable */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Almacenes para traspasos</span>
        </div>
        <div className="flex items-center gap-3">
          {!expanded && (
            <span className="text-xs text-muted-foreground">
              {almacenOrigen?.ALMACEN || "..."} → {almacenDestino?.ALMACEN || "..."}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
          )}
        </div>
      </button>

      {/* Contenido expandible */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          <p className="text-xs text-muted-foreground">
            Estos almacenes se usan cuando agregas o quitas productos de la venta.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Almacén Origen */}
            <div className="space-y-2">
              <Label htmlFor="almacenOrigen" className="text-sm font-medium">
                Almacén Origen
              </Label>
              <Select
                value={almacenes.almacenOrigenId.toString()}
                onValueChange={(value) => onUpdate("almacenOrigenId", parseInt(value, 10))}
              >
                <SelectTrigger id="almacenOrigen">
                  <SelectValue placeholder={loadingAlmacenes ? "Cargando..." : "Seleccionar"} />
                </SelectTrigger>
                <SelectContent>
                  {listaAlmacenes.map((alm) => (
                    <SelectItem key={alm.ALMACEN_ID} value={alm.ALMACEN_ID.toString()}>
                      {alm.ALMACEN}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground/60">De aquí salen productos nuevos</p>
            </div>

            {/* Almacén Destino */}
            <div className="space-y-2">
              <Label htmlFor="almacenDestino" className="text-sm font-medium">
                Almacén Destino
              </Label>
              <Select
                value={almacenes.almacenDestinoId.toString()}
                onValueChange={(value) => onUpdate("almacenDestinoId", parseInt(value, 10))}
              >
                <SelectTrigger id="almacenDestino">
                  <SelectValue placeholder={loadingAlmacenes ? "Cargando..." : "Seleccionar"} />
                </SelectTrigger>
                <SelectContent>
                  {listaAlmacenes.map((alm) => (
                    <SelectItem key={alm.ALMACEN_ID} value={alm.ALMACEN_ID.toString()}>
                      {alm.ALMACEN}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground/60">Aquí están los productos de la venta</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Helpers
// ============================================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
};

const getFieldError = (errors: ValidationError[], field: string): string | undefined => {
  return errors.find((e) => e.field === field)?.message;
};

// ============================================================================
// Sub-components
// ============================================================================

interface ProductoCardProps {
  producto: ProductoFormData;
  index: number;
  errors: ValidationError[];
  onUpdate: (field: keyof ProductoFormData, value: ProductoFormData[keyof ProductoFormData]) => void;
  onRemove: () => void;
  onRestore: () => void;
}

const ProductoCard = ({
  producto,
  index,
  errors,
  onUpdate,
  onRemove,
  onRestore,
}: ProductoCardProps) => {
  const isDeleted = producto.isDeleted;
  const cantidadError = getFieldError(errors, `productos[${index}].cantidad`);

  return (
    <div
      className={`
        relative border rounded-lg p-4 transition-all
        ${isDeleted
          ? "bg-red-50 border-red-200 opacity-60"
          : "bg-card border-border hover:border-blue-300"
        }
      `}
    >
      {/* Delete overlay */}
      {isDeleted && (
        <div className="absolute inset-0 bg-red-50/50 rounded-lg flex items-center justify-center z-10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRestore}
            className="bg-card"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{producto.articulo}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">ID: {producto.articuloId}</p>
        </div>

        {!isDeleted && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-muted-foreground/60 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Cantidad */}
      <div className="mb-4">
        <Label htmlFor={`cantidad-${index}`} className="text-xs font-medium text-muted-foreground">
          Cantidad
        </Label>
        <Input
          id={`cantidad-${index}`}
          type="number"
          min="1"
          value={producto.cantidad}
          onChange={(e) => onUpdate("cantidad", parseInt(e.target.value, 10) || 0)}
          disabled={isDeleted}
          className={`
            mt-1 h-9 text-center text-lg font-semibold
            ${cantidadError ? "border-red-500" : ""}
          `}
        />
        {cantidadError && (
          <p className="text-xs text-red-500 mt-1">{cantidadError}</p>
        )}
      </div>

      {/* Precios editables */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`precioLista-${index}`} className="text-xs text-muted-foreground">
            Lista
          </Label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-xs">$</span>
            <Input
              id={`precioLista-${index}`}
              type="number"
              min="0"
              step="0.01"
              value={producto.precioLista}
              onChange={(e) => onUpdate("precioLista", parseFloat(e.target.value) || 0)}
              disabled={isDeleted}
              className="h-8 pl-5 text-sm font-semibold text-foreground bg-muted dark:bg-muted"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`precioCortoPlazo-${index}`} className="text-xs text-muted-foreground">
            C. Plazo
          </Label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-400 text-xs">$</span>
            <Input
              id={`precioCortoPlazo-${index}`}
              type="number"
              min="0"
              step="0.01"
              value={producto.precioCortoPlazo}
              onChange={(e) => onUpdate("precioCortoPlazo", parseFloat(e.target.value) || 0)}
              disabled={isDeleted}
              className="h-8 pl-5 text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/30"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`precioContado-${index}`} className="text-xs text-muted-foreground">
            Contado
          </Label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-green-400 text-xs">$</span>
            <Input
              id={`precioContado-${index}`}
              type="number"
              min="0"
              step="0.01"
              value={producto.precioContado}
              onChange={(e) => onUpdate("precioContado", parseFloat(e.target.value) || 0)}
              disabled={isDeleted}
              className="h-8 pl-5 text-sm font-semibold text-green-600 bg-green-50 dark:bg-green-950/30"
            />
          </div>
        </div>
      </div>

      {/* Subtotal */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Subtotal (Lista):</span>
        <span className="font-semibold text-foreground">
          {formatCurrency(producto.precioLista * producto.cantidad)}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ProductosTab = ({
  productos,
  almacenes,
  errors,
  onAdd,
  onUpdate,
  onRemove,
  onRestore,
  onUpdateAlmacenes,
}: ProductosTabProps) => {
  const [showAgregarDialog, setShowAgregarDialog] = useState(false);

  const activeProductos = productos.filter((p) => !p.isDeleted);
  const deletedProductos = productos.filter((p) => p.isDeleted);
  const newProductos = productos.filter((p) => p.isNew && !p.isDeleted);
  const generalError = getFieldError(errors, "productos");

  // Calcular totales
  const totales = activeProductos.reduce(
    (acc, p) => ({
      cantidad: acc.cantidad + p.cantidad,
      lista: acc.lista + p.precioLista * p.cantidad,
      cortoPlazo: acc.cortoPlazo + p.precioCortoPlazo * p.cantidad,
      contado: acc.contado + p.precioContado * p.cantidad,
    }),
    { cantidad: 0, lista: 0, cortoPlazo: 0, contado: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header con info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-foreground">
            Productos ({activeProductos.length})
          </h3>
          {newProductos.length > 0 && (
            <span className="text-xs text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded">
              {newProductos.length} nuevo(s)
            </span>
          )}
          {deletedProductos.length > 0 && (
            <span className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded">
              {deletedProductos.length} eliminado(s)
            </span>
          )}
        </div>

        <Button size="sm" onClick={() => setShowAgregarDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      {/* Error general */}
      {generalError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{generalError}</p>
        </div>
      )}

      {/* Configuración de Almacenes (colapsable) */}
      <AlmacenesSection almacenes={almacenes} onUpdate={onUpdateAlmacenes} />

      {/* Lista de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {productos.map((producto, index) => (
          <ProductoCard
            key={`${producto.articuloId}-${index}`}
            producto={producto}
            index={index}
            errors={errors}
            onUpdate={(field, value) => onUpdate(index, field, value)}
            onRemove={() => onRemove(index)}
            onRestore={() => onRestore(index)}
          />
        ))}
      </div>

      {/* Resumen de totales */}
      <div className="bg-muted rounded-lg p-4 border">
        <h4 className="text-sm font-semibold text-foreground mb-3">Resumen de Productos</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Productos</p>
            <p className="text-xl font-bold text-foreground">{activeProductos.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Unidades</p>
            <p className="text-xl font-bold text-blue-600">{totales.cantidad}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Lista</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(totales.lista)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Contado</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totales.contado)}</p>
          </div>
        </div>
      </div>

      {/* Dialog para agregar productos */}
      <AgregarProductoDialog
        open={showAgregarDialog}
        onOpenChange={setShowAgregarDialog}
        almacenOrigenId={almacenes.almacenOrigenId}
        productosExistentes={productos}
        onAgregar={onAdd}
      />
    </div>
  );
};

export default ProductosTab;
