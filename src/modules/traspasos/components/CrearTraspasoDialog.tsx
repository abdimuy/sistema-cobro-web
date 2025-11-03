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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface ArticuloSeleccionado {
  articulo: ArticuloAlmacen;
  unidades: number;
}

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
  const [articulosSeleccionados, setArticulosSeleccionados] = useState<ArticuloSeleccionado[]>([]);
  const [articuloBuscado, setArticuloBuscado] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { articulos: articulosOrigen, loading: loadingArticulos } = useGetAlmacenById(almacenOrigenId);

  useEffect(() => {
    if (almacenOrigenPredefinido) {
      setAlmacenOrigenId(almacenOrigenPredefinido);
    }
  }, [almacenOrigenPredefinido]);

  const articulosFiltrados = articulosOrigen.filter((art) => {
    const searchLower = articuloBuscado.toLowerCase();
    return (
      art.ARTICULO.toLowerCase().includes(searchLower) ||
      art.ARTICULO_ID.toString().includes(searchLower)
    );
  });

  const handleAgregarArticulo = (articulo: ArticuloAlmacen) => {
    const yaSeleccionado = articulosSeleccionados.find(
      (a) => a.articulo.ARTICULO_ID === articulo.ARTICULO_ID
    );

    if (yaSeleccionado) {
      setError("Este producto ya está en la lista");
      return;
    }

    if (articulo.EXISTENCIAS === 0) {
      setError("Este producto no tiene existencias");
      return;
    }

    setArticulosSeleccionados([
      ...articulosSeleccionados,
      { articulo, unidades: 1 },
    ]);
    setArticuloBuscado("");
    setError(null);
  };

  const handleRemoverArticulo = (articuloId: number) => {
    setArticulosSeleccionados(
      articulosSeleccionados.filter((a) => a.articulo.ARTICULO_ID !== articuloId)
    );
  };

  const handleCambiarUnidades = (articuloId: number, unidades: number) => {
    setArticulosSeleccionados(
      articulosSeleccionados.map((a) =>
        a.articulo.ARTICULO_ID === articuloId ? { ...a, unidades } : a
      )
    );
  };

  const handleCrearTraspaso = async () => {
    if (!almacenOrigenId || !almacenDestinoId) {
      setError("Debes seleccionar almacén origen y destino");
      return;
    }

    if (almacenOrigenId === almacenDestinoId) {
      setError("El almacén origen y destino no pueden ser el mismo");
      return;
    }

    if (articulosSeleccionados.length === 0) {
      setError("Debes agregar al menos un producto");
      return;
    }

    const errorUnidades = articulosSeleccionados.find(
      (a) => a.unidades <= 0 || a.unidades > a.articulo.EXISTENCIAS
    );

    if (errorUnidades) {
      setError(
        `Las unidades de "${errorUnidades.articulo.ARTICULO}" deben ser entre 1 y ${errorUnidades.articulo.EXISTENCIAS}`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const detalles: TraspasoDetalleRequest[] = articulosSeleccionados.map((a) => ({
        articuloId: a.articulo.ARTICULO_ID,
        unidades: a.unidades,
      }));

      await crearTraspaso({
        almacenOrigenId,
        almacenDestinoId,
        descripcion: descripcion.trim() || undefined,
        detalles,
      });

      // Resetear formulario
      setAlmacenDestinoId(null);
      setDescripcion("");
      setArticulosSeleccionados([]);
      setArticuloBuscado("");

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
      setArticulosSeleccionados([]);
      setArticuloBuscado("");
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Traspaso</DialogTitle>
          <DialogDescription>
            Mueve productos de una camioneta a otra
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="almacen-origen">Almacén Origen</Label>
              <Select
                value={almacenOrigenId?.toString() || ""}
                onValueChange={(value) => {
                  setAlmacenOrigenId(parseInt(value));
                  setArticulosSeleccionados([]);
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

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Textarea
              id="descripcion"
              placeholder="Ej: Devolución de productos sobrantes"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
            />
          </div>

          {almacenOrigenId && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Buscar Producto</Label>
                <div className="relative">
                  <Input
                    placeholder="Buscar por nombre o ID..."
                    value={articuloBuscado}
                    onChange={(e) => setArticuloBuscado(e.target.value)}
                  />
                </div>
                {articuloBuscado && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {loadingArticulos ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Cargando productos...
                      </div>
                    ) : articulosFiltrados.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No se encontraron productos
                      </div>
                    ) : (
                      articulosFiltrados.slice(0, 5).map((articulo) => (
                        <div
                          key={articulo.ARTICULO_ID}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                          onClick={() => handleAgregarArticulo(articulo)}
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {articulo.ARTICULO}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {articulo.ARTICULO_ID} • Stock:{" "}
                              {articulo.EXISTENCIAS}
                            </div>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {articulosSeleccionados.length > 0 && (
                <div className="space-y-2">
                  <Label>Productos Seleccionados ({articulosSeleccionados.length})</Label>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Stock</TableHead>
                          <TableHead className="text-right w-32">Cantidad</TableHead>
                          <TableHead className="text-right w-20"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {articulosSeleccionados.map(({ articulo, unidades }) => (
                          <TableRow key={articulo.ARTICULO_ID}>
                            <TableCell>
                              <div className="font-medium text-sm">
                                {articulo.ARTICULO}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {articulo.ARTICULO_ID}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">
                                {articulo.EXISTENCIAS}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min="1"
                                max={articulo.EXISTENCIAS}
                                value={unidades}
                                onChange={(e) =>
                                  handleCambiarUnidades(
                                    articulo.ARTICULO_ID,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-24 ml-auto"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleRemoverArticulo(articulo.ARTICULO_ID)
                                }
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCrearTraspaso} disabled={loading}>
            {loading ? "Creando..." : "Crear Traspaso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CrearTraspasoDialog;
