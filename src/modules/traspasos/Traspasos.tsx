import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGetAlmacenes from "../../hooks/useGetAlmacenes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Navigation from "../../components/Navigation";
import { Package, Truck, Warehouse } from "lucide-react";

const Traspasos = () => {
  const navigate = useNavigate();
  const { almacenes, loading, error } = useGetAlmacenes();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAlmacenes = almacenes.filter((almacen) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      almacen.ALMACEN.toLowerCase().includes(searchLower) ||
      almacen.ALMACEN_ID.toString().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Inventario de Camionetas
          </h1>
          <p className="text-gray-600">
            Consulta el stock de cada camioneta y realiza traspasos de productos
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <Input
            type="text"
            placeholder="Buscar camioneta por nombre o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {filteredAlmacenes.length === 0 ? (
          <div className="text-center py-12">
            <Warehouse className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm
                ? "No se encontraron camionetas con ese criterio"
                : "No hay camionetas disponibles"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAlmacenes.map((almacen) => {
              const isCamioneta = almacen.ALMACEN_ID !== 19; // 19 es almacén general
              const Icon = isCamioneta ? Truck : Warehouse;

              return (
                <Card
                  key={almacen.ALMACEN_ID}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/almacenes/${almacen.ALMACEN_ID}/inventario`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {almacen.ALMACEN}
                          </CardTitle>
                          <CardDescription>ID: {almacen.ALMACEN_ID}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-600">
                            Existencias Totales
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-base font-semibold">
                          {(almacen.EXISTENCIAS || 0).toLocaleString()}
                        </Badge>
                      </div>

                      <Button className="w-full" variant="outline">
                        Ver Inventario Completo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Información:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Haz clic en cualquier camioneta para ver su inventario detallado</li>
            <li>• Desde el inventario podrás realizar traspasos entre camionetas</li>
            <li>• Los traspasos se registran automáticamente con entrada y salida</li>
            <li>• Las existencias se actualizan en tiempo real</li>
          </ul>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Traspasos;
