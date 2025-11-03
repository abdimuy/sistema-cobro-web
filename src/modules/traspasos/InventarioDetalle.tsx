import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useGetAlmacenById from "../../hooks/useGetAlmacenById";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import Navigation from "../../components/Navigation";
import CrearTraspasoDialog from "./components/CrearTraspasoDialog";
import useGetAlmacenes from "../../hooks/useGetAlmacenes";
import { ArrowLeft, Package, TrendingDown, TrendingUp } from "lucide-react";

const InventarioDetalle = () => {
  const { almacenId } = useParams<{ almacenId: string }>();
  const navigate = useNavigate();
  const { almacen: almacenFromApi, articulos, loading, error, refetch } = useGetAlmacenById(
    almacenId ? parseInt(almacenId) : null
  );
  const { almacenes, getAlmacenById } = useGetAlmacenes();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCrearTraspasoOpen, setIsCrearTraspasoOpen] = useState(false);

  // Obtener info completa del almacén desde el listado
  const almacenInfo = almacenId ? getAlmacenById(parseInt(almacenId)) : null;

  // Combinar info: nombre del listado, artículos del API
  const almacen = almacenInfo ? {
    ALMACEN_ID: almacenInfo.ALMACEN_ID,
    ALMACEN: almacenInfo.ALMACEN,
    EXISTENCIAS: almacenInfo.EXISTENCIAS
  } : almacenFromApi;

  const filteredArticulos = articulos.filter((articulo) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      articulo.ARTICULO.toLowerCase().includes(searchLower) ||
      articulo.ARTICULO_ID.toString().includes(searchLower) ||
      articulo.LINEA_ARTICULO.toLowerCase().includes(searchLower)
    );
  });

  const handleTraspasoSuccess = () => {
    setIsCrearTraspasoOpen(false);
    refetch();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
            <Button
              onClick={() => navigate("/inventario-camionetas")}
              className="mt-4"
              variant="outline"
            >
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!almacen) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">Cargando información del almacén...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => navigate("/inventario-camionetas")}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Camionetas
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {almacen.ALMACEN}
              </h1>
              <p className="text-gray-600">ID: {almacen.ALMACEN_ID}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setIsCrearTraspasoOpen(true)}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Realizar Traspaso
              </Button>
              <Button onClick={refetch} variant="outline">
                Actualizar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Existencias Totales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">
                  {(almacen.EXISTENCIAS || 0).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Productos Diferentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold">{articulos.length}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Productos Sin Stock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold">
                  {articulos.filter((a) => a.EXISTENCIAS === 0).length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventario de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Buscar por nombre, ID o línea de producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            {filteredArticulos.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchTerm
                    ? "No se encontraron productos con ese criterio"
                    : "Este almacén no tiene productos"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Línea</TableHead>
                      <TableHead className="text-right">Existencias</TableHead>
                      <TableHead className="text-right">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArticulos.map((articulo) => (
                      <TableRow key={articulo.ARTICULO_ID}>
                        <TableCell className="font-medium">
                          {articulo.ARTICULO_ID}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="font-medium">{articulo.ARTICULO}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {articulo.LINEA_ARTICULO}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {articulo.EXISTENCIAS.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {articulo.EXISTENCIAS > 0 ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              En Stock
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                              Sin Stock
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Acciones disponibles:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Haz clic en "Realizar Traspaso" para mover productos entre almacenes</li>
            <li>• Puedes enviar productos a otras camionetas o recibir de ellas</li>
            <li>• Los traspasos se aplican automáticamente al crearlos</li>
            <li>• El inventario se actualiza en tiempo real</li>
          </ul>
        </div>
      </div>

      <CrearTraspasoDialog
        open={isCrearTraspasoOpen}
        onOpenChange={setIsCrearTraspasoOpen}
        almacenes={almacenes}
        almacenOrigenPredefinido={parseInt(almacenId!)}
        onSuccess={handleTraspasoSuccess}
      />

      <Navigation />
    </div>
  );
};

export default InventarioDetalle;
