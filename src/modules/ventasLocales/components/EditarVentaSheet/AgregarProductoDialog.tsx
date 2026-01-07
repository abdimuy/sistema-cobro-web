import { useState, useMemo } from "react";
import { Search, Package, Plus, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import useGetAlmacenById, { ArticuloAlmacen } from "../../../../hooks/useGetAlmacenById";
import { ProductoFormData } from "./types";

// ============================================================================
// Types
// ============================================================================

interface AgregarProductoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  almacenOrigenId: number;
  productosExistentes: ProductoFormData[];
  onAgregar: (producto: ProductoFormData) => void;
}

// ============================================================================
// Helper: Parse precios from string
// ============================================================================

const parsePrecios = (preciosStr: string): { lista: number; cortoPlazo: number; contado: number } => {
  try {
    // El formato puede ser JSON o string separado
    if (preciosStr.startsWith("{")) {
      const parsed = JSON.parse(preciosStr);
      return {
        lista: parsed.PRECIO_LISTA || parsed.precioLista || 0,
        cortoPlazo: parsed.PRECIO_CORTO_PLAZO || parsed.precioCortoPlazo || 0,
        contado: parsed.PRECIO_CONTADO || parsed.precioContado || 0,
      };
    }
    // Intentar parsear como número simple
    const precio = parseFloat(preciosStr) || 0;
    return { lista: precio, cortoPlazo: precio, contado: precio };
  } catch {
    return { lista: 0, cortoPlazo: 0, contado: 0 };
  }
};

// ============================================================================
// Product Card Component
// ============================================================================

interface ProductoCardProps {
  articulo: ArticuloAlmacen;
  disabled: boolean;
  onSelect: () => void;
}

const ProductoCard = ({ articulo, disabled, onSelect }: ProductoCardProps) => {
  const precios = parsePrecios(articulo.PRECIOS);

  return (
    <div
      className={`
        p-3 border rounded-lg transition-all
        ${disabled
          ? "bg-gray-50 border-gray-200 opacity-60"
          : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer"
        }
      `}
      onClick={disabled ? undefined : onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">{articulo.ARTICULO}</p>
          <p className="text-xs text-gray-500 mt-0.5">ID: {articulo.ARTICULO_ID}</p>
          {articulo.LINEA_ARTICULO && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {articulo.LINEA_ARTICULO}
            </Badge>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <Badge
            variant={articulo.EXISTENCIAS > 10 ? "default" : articulo.EXISTENCIAS > 0 ? "secondary" : "destructive"}
            className="text-xs"
          >
            Stock: {articulo.EXISTENCIAS}
          </Badge>
          {precios.lista > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              ${precios.lista.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {disabled ? (
        <p className="text-xs text-amber-600 mt-2">Ya está en la venta</p>
      ) : articulo.EXISTENCIAS === 0 ? (
        <p className="text-xs text-red-600 mt-2">Sin stock</p>
      ) : (
        <Button
          size="sm"
          className="w-full mt-2"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Agregar
        </Button>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const AgregarProductoDialog = ({
  open,
  onOpenChange,
  almacenOrigenId,
  productosExistentes,
  onAgregar,
}: AgregarProductoDialogProps) => {
  const [search, setSearch] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [selectedArticulo, setSelectedArticulo] = useState<ArticuloAlmacen | null>(null);

  const { articulos, loading, error } = useGetAlmacenById(open ? almacenOrigenId : null);

  // IDs de productos que ya están en la venta (no eliminados)
  const productosExistentesIds = useMemo(() => {
    return new Set(
      productosExistentes
        .filter((p) => !p.isDeleted)
        .map((p) => p.articuloId)
    );
  }, [productosExistentes]);

  // Filtrar artículos por búsqueda
  const articulosFiltrados = useMemo(() => {
    if (!search.trim()) return articulos;
    const searchLower = search.toLowerCase();
    return articulos.filter(
      (a) =>
        a.ARTICULO.toLowerCase().includes(searchLower) ||
        a.ARTICULO_ID.toString().includes(search)
    );
  }, [articulos, search]);

  // Reset al cerrar
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSearch("");
      setCantidad(1);
      setSelectedArticulo(null);
    }
    onOpenChange(isOpen);
  };

  // Seleccionar producto para confirmar cantidad
  const handleSelectArticulo = (articulo: ArticuloAlmacen) => {
    setSelectedArticulo(articulo);
    setCantidad(1);
  };

  // Confirmar y agregar producto
  const handleConfirmarAgregar = () => {
    if (!selectedArticulo || cantidad <= 0) return;

    const precios = parsePrecios(selectedArticulo.PRECIOS);

    const nuevoProducto: ProductoFormData = {
      articuloId: selectedArticulo.ARTICULO_ID,
      articulo: selectedArticulo.ARTICULO,
      cantidad,
      precioLista: precios.lista,
      precioCortoPlazo: precios.cortoPlazo,
      precioContado: precios.contado,
      isNew: true,
      isDeleted: false,
    };

    onAgregar(nuevoProducto);
    setSelectedArticulo(null);
    setCantidad(1);
    // No cerramos el dialog para permitir agregar más productos
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Agregar Producto
          </DialogTitle>
          <DialogDescription>
            Busca y selecciona productos del almacén origen para agregarlos a la venta.
          </DialogDescription>
        </DialogHeader>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : selectedArticulo ? (
            // Vista de confirmación de cantidad
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="font-medium text-lg">{selectedArticulo.ARTICULO}</p>
                <p className="text-sm text-gray-500">ID: {selectedArticulo.ARTICULO_ID}</p>
                <Badge className="mt-2">Stock disponible: {selectedArticulo.EXISTENCIAS}</Badge>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  disabled={cantidad <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={selectedArticulo.EXISTENCIAS}
                  value={cantidad}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    setCantidad(Math.min(Math.max(1, val), selectedArticulo.EXISTENCIAS));
                  }}
                  className="w-24 text-center text-lg font-semibold"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCantidad(Math.min(selectedArticulo.EXISTENCIAS, cantidad + 1))}
                  disabled={cantidad >= selectedArticulo.EXISTENCIAS}
                >
                  +
                </Button>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedArticulo(null)}
                >
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleConfirmarAgregar}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar {cantidad} unidad{cantidad > 1 ? "es" : ""}
                </Button>
              </div>
            </div>
          ) : (
            // Lista de productos
            <ScrollArea className="h-[400px] pr-4">
              {articulosFiltrados.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron productos</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {articulosFiltrados.map((articulo) => (
                    <ProductoCard
                      key={articulo.ARTICULO_ID}
                      articulo={articulo}
                      disabled={
                        productosExistentesIds.has(articulo.ARTICULO_ID) ||
                        articulo.EXISTENCIAS === 0
                      }
                      onSelect={() => handleSelectArticulo(articulo)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        {/* Footer info */}
        {!loading && !error && !selectedArticulo && (
          <div className="pt-2 border-t text-xs text-gray-500 text-center">
            {articulosFiltrados.length} producto{articulosFiltrados.length !== 1 ? "s" : ""} disponible{articulosFiltrados.length !== 1 ? "s" : ""}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AgregarProductoDialog;
