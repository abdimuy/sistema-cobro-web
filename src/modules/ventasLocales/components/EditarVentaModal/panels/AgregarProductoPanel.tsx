import { useState, useMemo } from "react";
import { Search, Package, Loader2, AlertCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useGetAlmacenById from "@/hooks/useGetAlmacenById";
import type { ArticuloAlmacen } from "@/hooks/useGetAlmacenById";
import { leerPreciosCatalogo, preciosParaLinea, type TipoVenta } from "./preciosCatalogo";
import type {
  ProductoFormData,
  AlmacenesFormData,
} from "../../../presentation/hooks/useVentaEditState";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Combo destino cuando el alta se dispara DESDE un combo. Sin él, el panel
 * agrega productos sueltos, como siempre.
 */
export interface ComboDestino {
  id: string;
  nombre: string;
  almacenOrigenID: number;
  almacenDestinoID: number;
}

interface AgregarProductoPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  almacenes: AlmacenesFormData;
  /** Cuando viene, el producto nace DENTRO de este combo. */
  combo?: ComboDestino | null;
  productosExistentes: ProductoFormData[];
  /** Decide qué precios lleva la línea nueva (ver preciosParaLinea). */
  tipoVenta: TipoVenta;
  onAgregar: (p: Omit<ProductoFormData, "id" | "isNew" | "isDeleted">) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMoney = (n: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

// ─── Subcomponent: producto card row ─────────────────────────────────────────

interface ArticuloRowProps {
  articulo: ArticuloAlmacen;
  tipoVenta: TipoVenta;
  disabled: boolean;
  onSelect: () => void;
}

const ArticuloRow = ({ articulo, tipoVenta, disabled, onSelect }: ArticuloRowProps) => {
  const precios = leerPreciosCatalogo(articulo);

  return (
    <div
      onClick={disabled ? undefined : onSelect}
      className={cn(
        "flex items-start justify-between gap-3 rounded-md border border-border/60 bg-card px-3 py-2.5 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-foreground/40",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {articulo.ARTICULO}
        </p>
        <p className="font-mono text-[10px] text-muted-foreground/70">
          ID {articulo.ARTICULO_ID}
        </p>
        {disabled && (
          <p className="text-[11px] text-muted-foreground mt-0.5">Ya en la venta</p>
        )}
      </div>
      <div className="text-right flex-shrink-0 space-y-0.5">
        {tipoVenta === "CONTADO" ? (
          precios.contado !== null && (
            <p className="font-mono text-[11px] text-foreground">
              Contado {fmtMoney(precios.contado)}
            </p>
          )
        ) : (
          <>
            {precios.largo !== null && (
              <p className="font-mono text-[11px] text-foreground">
                {fmtMoney(precios.largo)}
              </p>
            )}
            {precios.corto !== null && precios.corto !== precios.largo && (
              <p className="font-mono text-[10px] text-muted-foreground">
                CP {fmtMoney(precios.corto)}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const AgregarProductoPanel = ({
  open,
  onOpenChange,
  almacenes,
  combo = null,
  productosExistentes,
  tipoVenta,
  onAgregar,
}: AgregarProductoPanelProps) => {
  const [search, setSearch] = useState("");
  const [errorPrecio, setErrorPrecio] = useState<string | null>(null);

  // Dentro de un combo, el catálogo sale del almacén del combo; fuera, del
  // par por defecto de la venta.
  const almacenOrigenID = combo !== null ? combo.almacenOrigenID : almacenes.almacenOrigenID;
  const almacenDestinoID = combo !== null ? combo.almacenDestinoID : almacenes.almacenDestinoID;

  const { articulos, loading, error } = useGetAlmacenById(
    open && almacenOrigenID > 0 ? almacenOrigenID : null,
  );

  const productosExistentesIds = useMemo(
    () =>
      new Set(
        productosExistentes.filter((p) => !p.isDeleted).map((p) => p.articuloId),
      ),
    [productosExistentes],
  );

  const articulosFiltrados = useMemo(() => {
    if (!search.trim()) return articulos;
    const searchLower = search.toLowerCase();
    return articulos.filter(
      (a) =>
        a.ARTICULO.toLowerCase().includes(searchLower) ||
        String(a.ARTICULO_ID).includes(search),
    );
  }, [articulos, search]);

  const handleClose = () => {
    setSearch("");
    setErrorPrecio(null);
    onOpenChange(false);
  };

  const handleSelect = (articulo: ArticuloAlmacen) => {
    const resultado = preciosParaLinea(leerPreciosCatalogo(articulo), tipoVenta);
    if (!resultado.ok) {
      setErrorPrecio(`${articulo.ARTICULO}: ${resultado.error}`);
      return;
    }
    const { precios } = resultado;
    setErrorPrecio(null);
    onAgregar({
      articuloId: articulo.ARTICULO_ID,
      articulo: articulo.ARTICULO,
      cantidad: 1,
      precioAnual: precios.precioAnual,
      precioCortoPlazo: precios.precioCortoPlazo,
      precioContado: precios.precioContado,
      // Un producto de combo hereda los almacenes del combo: van en null, y
      // el que manda es comboID. Antes esto era `comboID: null` fijo, así que
      // meter un producto DENTRO de un combo era imposible.
      comboID: combo !== null ? combo.id : null,
      almacenOrigenID: combo !== null ? null : almacenOrigenID,
      almacenDestinoID: combo !== null ? null : almacenDestinoID,
    });
    setSearch("");
  };

  if (!open) return null;

  const noAlmacen = almacenOrigenID === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-20 bg-background/80"
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
          <div>
            <h3 className="font-serif text-lg font-normal">Agregar producto</h3>
            {combo !== null && (
              <p className="text-[11px] text-muted-foreground">En {combo.nombre}</p>
            )}
          </div>
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
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {noAlmacen ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-[12px] text-destructive">
              Configurá un almacén de origen para buscar productos.
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  placeholder="Buscar por nombre o ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              {errorPrecio !== null && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-[12px] text-destructive"
                >
                  {errorPrecio}
                </div>
              )}

              {/* Results */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              ) : articulosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Package className="h-8 w-8" />
                  <p className="text-sm">No se encontraron productos.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {articulosFiltrados.map((articulo) => (
                    <ArticuloRow
                      key={articulo.ARTICULO_ID}
                      articulo={articulo}
                      tipoVenta={tipoVenta}
                      disabled={productosExistentesIds.has(articulo.ARTICULO_ID)}
                      onSelect={() => handleSelect(articulo)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-border/60 px-5 py-3 flex justify-between items-center gap-2">
          {!noAlmacen && !loading && (
            <p className="text-[11px] text-muted-foreground">
              {articulosFiltrados.length} producto
              {articulosFiltrados.length !== 1 ? "s" : ""}
            </p>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </footer>
      </aside>
    </>
  );
};
