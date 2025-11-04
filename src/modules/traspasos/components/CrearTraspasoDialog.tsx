import { useState, useEffect } from "react";
import { Almacen } from "../../../hooks/useGetAlmacenes";
import { ArticuloAlmacen } from "../../../hooks/useGetAlmacenById";
import useGetAlmacenById from "../../../hooks/useGetAlmacenById";
import { crearTraspaso } from "../../../services/api/traspasos";
import { TraspasoDetalleRequest } from "../../../types/traspasos";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Package2, TrendingUp, AlertTriangle } from "lucide-react";
import ProductosDataTable from "./ProductosDataTable";

interface CrearTraspasoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  almacenes: Almacen[];
  almacenOrigenPredefinido?: number;
  onSuccess: () => void;
}

const CrearTraspasoDialog = ({
  open,
  onOpenChange,
  almacenes,
  almacenOrigenPredefinido,
  onSuccess,
}: CrearTraspasoDialogProps) => {
  const [almacenOrigenId, setAlmacenOrigenId] = useState<number | null>(
    almacenOrigenPredefinido || null
  );
  const [almacenDestinoId, setAlmacenDestinoId] = useState<number | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [selectedArticulos, setSelectedArticulos] = useState<ArticuloAlmacen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { articulos: articulosOrigen, loading: loadingArticulos } = useGetAlmacenById(almacenOrigenId);

  useEffect(() => {
    if (almacenOrigenPredefinido) {
      setAlmacenOrigenId(almacenOrigenPredefinido);
    }
  }, [almacenOrigenPredefinido]);

  const handleQuantityChange = (articuloId: number, quantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [articuloId]: quantity,
    }));
  };

  const handleSelectionChange = (selected: ArticuloAlmacen[], currentQuantities: Record<number, number>) => {
    setSelectedArticulos(selected);
    // Sincronizar cantidades locales
    setQuantities(currentQuantities);
  };

  // Calcular totales para el resumen
  const totalProductos = selectedArticulos.length;
  const totalUnidades = selectedArticulos.reduce((sum, articulo) => {
    return sum + (quantities[articulo.ARTICULO_ID] || 0);
  }, 0);

  // Obtener nombres de almacenes para el modal de confirmación
  const almacenOrigenNombre = almacenes.find(a => a.ALMACEN_ID === almacenOrigenId)?.ALMACEN || '';
  const almacenDestinoNombre = almacenes.find(a => a.ALMACEN_ID === almacenDestinoId)?.ALMACEN || '';

  const handlePreConfirmTraspaso = () => {
    // Primero validar todo
    if (!almacenOrigenId || !almacenDestinoId) {
      setError("Debes seleccionar almacén origen y destino");
      return;
    }

    if (almacenOrigenId === almacenDestinoId) {
      setError("El almacén origen y destino no pueden ser el mismo");
      return;
    }

    if (selectedArticulos.length === 0) {
      setError("Debes seleccionar al menos un producto");
      return;
    }

    // Validar que todos los productos seleccionados tengan cantidades válidas
    const productosConCantidadInvalida = selectedArticulos.filter((articulo) => {
      const cantidad = quantities[articulo.ARTICULO_ID] || 0;
      return cantidad <= 0 || cantidad > articulo.EXISTENCIAS;
    });

    if (productosConCantidadInvalida.length > 0) {
      const firstInvalid = productosConCantidadInvalida[0];
      const cantidad = quantities[firstInvalid.ARTICULO_ID] || 0;
      setError(
        `"${firstInvalid.ARTICULO}": la cantidad debe estar entre 1 y ${firstInvalid.EXISTENCIAS} (actual: ${cantidad})`
      );
      return;
    }

    // Si todas las validaciones pasaron, mostrar el modal de confirmación
    setError(null);
    setShowConfirmDialog(true);
  };

  const handleCrearTraspaso = async () => {
    setLoading(true);
    setShowConfirmDialog(false);

    try {
      const detalles: TraspasoDetalleRequest[] = selectedArticulos.map((articulo) => ({
        articuloId: articulo.ARTICULO_ID,
        unidades: quantities[articulo.ARTICULO_ID],
      }));

      await crearTraspaso({
        almacenOrigenId: almacenOrigenId!,
        almacenDestinoId: almacenDestinoId!,
        descripcion: descripcion.trim() || undefined,
        detalles,
      });

      // Resetear formulario
      setAlmacenDestinoId(null);
      setDescripcion("");
      setQuantities({});
      setSelectedArticulos([]);

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear traspaso");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAlmacenDestinoId(null);
      setDescripcion("");
      setQuantities({});
      setSelectedArticulos([]);
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Crear Traspaso</DialogTitle>
          <DialogDescription>
            Selecciona productos y cantidades para transferir entre camionetas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <div className="text-red-600 mt-0.5">⚠️</div>
              <p className="text-red-800 text-sm flex-1">{error}</p>
            </div>
          )}

          {/* Selección de Almacenes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="almacen-origen">Almacén Origen</Label>
              <Select
                value={almacenOrigenId?.toString() || ""}
                onValueChange={(value) => {
                  setAlmacenOrigenId(parseInt(value));
                  setQuantities({});
                  setSelectedArticulos([]);
                }}
                disabled={!!almacenOrigenPredefinido}
              >
                <SelectTrigger id="almacen-origen">
                  <SelectValue placeholder="Selecciona almacén origen" />
                </SelectTrigger>
                <SelectContent>
                  {almacenes.map((almacen) => (
                    <SelectItem
                      key={almacen.ALMACEN_ID}
                      value={almacen.ALMACEN_ID.toString()}
                    >
                      {almacen.ALMACEN}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="almacen-destino">Almacén Destino</Label>
              <Select
                value={almacenDestinoId?.toString() || ""}
                onValueChange={(value) => setAlmacenDestinoId(parseInt(value))}
              >
                <SelectTrigger id="almacen-destino">
                  <SelectValue placeholder="Selecciona almacén destino" />
                </SelectTrigger>
                <SelectContent>
                  {almacenes
                    .filter((a) => a.ALMACEN_ID !== almacenOrigenId)
                    .sort((a, b) => a.ALMACEN.localeCompare(b.ALMACEN))
                    .map((almacen) => (
                      <SelectItem
                        key={almacen.ALMACEN_ID}
                        value={almacen.ALMACEN_ID.toString()}
                      >
                        {almacen.ALMACEN}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Textarea
              id="descripcion"
              placeholder="Ej: Traspaso de productos para nueva ruta"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
            />
          </div>

          <Separator />

          {/* Data Table de Productos */}
          {almacenOrigenId ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package2 className="h-5 w-5 text-blue-600" />
                <Label className="text-base font-semibold">Productos Disponibles</Label>
              </div>

              <ProductosDataTable
                articulos={articulosOrigen}
                loading={loadingArticulos}
                quantities={quantities}
                onQuantityChange={handleQuantityChange}
                onSelectionChange={handleSelectionChange}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Selecciona un almacén origen para ver los productos disponibles</p>
            </div>
          )}

          {/* Resumen del Traspaso */}
          {selectedArticulos.length > 0 && (
            <>
              <Separator />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Resumen del Traspaso</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Productos seleccionados:</span>
                    <span className="font-bold text-blue-900">{totalProductos}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Total de unidades:</span>
                    <span className="font-bold text-blue-900">{totalUnidades.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handlePreConfirmTraspaso}
            disabled={loading || selectedArticulos.length === 0}
            className="min-w-[140px]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Creando...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Crear Traspaso
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal de Confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-xl">
                Confirmar Traspaso
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Por favor, revisa cuidadosamente los detalles del traspaso antes de continuar.
              Esta acción moverá productos entre almacenes y actualizará el inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {/* Información de los almacenes */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Origen</p>
                <p className="text-lg font-semibold text-blue-700">{almacenOrigenNombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Destino</p>
                <p className="text-lg font-semibold text-blue-700">{almacenDestinoNombre}</p>
              </div>
            </div>

            {/* Descripción si existe */}
            {descripcion.trim() && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm font-medium text-gray-700 mb-1">Descripción:</p>
                <p className="text-sm text-gray-600">{descripcion}</p>
              </div>
            )}

            {/* Resumen de productos */}
            <div className="border rounded-lg">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h4 className="font-semibold text-gray-900">
                  Productos a transferir ({totalProductos})
                </h4>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="border-b text-sm">
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Producto</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700">Cantidad</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700">Stock Actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedArticulos.map((articulo) => {
                      const cantidad = quantities[articulo.ARTICULO_ID];
                      return (
                        <tr key={articulo.ARTICULO_ID} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm">{articulo.ARTICULO}</div>
                            <div className="text-xs text-gray-500">ID: {articulo.ARTICULO_ID}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="default" className="font-semibold">
                              {cantidad}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline">
                              {articulo.EXISTENCIAS}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Package2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">Total de unidades a transferir:</span>
              </div>
              <span className="text-2xl font-bold text-green-700">{totalUnidades.toLocaleString()}</span>
            </div>

            {/* Advertencia */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Importante:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Esta acción actualizará el inventario de ambos almacenes inmediatamente</li>
                  <li>Se registrará una salida en el almacén origen y una entrada en el destino</li>
                  <li>Una vez confirmado, el traspaso no se puede deshacer automáticamente</li>
                </ul>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCrearTraspaso}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Confirmar Traspaso
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default CrearTraspasoDialog;
