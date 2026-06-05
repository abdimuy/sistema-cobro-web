import { User, Phone, MapPin, Home, Building, Map, Shield, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClienteFormData, ValidationError } from "../types";
import useGetZonasCliente from "../../../../../hooks/useGetZonasCliente";

// ============================================================================
// Types
// ============================================================================

interface ClienteTabProps {
  data: ClienteFormData;
  errors: ValidationError[];
  onUpdate: (field: keyof ClienteFormData, value: ClienteFormData[keyof ClienteFormData]) => void;
}

// ============================================================================
// Helpers
// ============================================================================

const getFieldError = (errors: ValidationError[], field: string): string | undefined => {
  return errors.find((e) => e.field === field)?.message;
};

// ============================================================================
// Component
// ============================================================================

const ClienteTab = ({ data, errors, onUpdate }: ClienteTabProps) => {
  const { zonas, loading: loadingZonas } = useGetZonasCliente();

  return (
    <div className="space-y-6">
      {/* Información Personal */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <User className="h-4 w-4 text-blue-600" />
          Información Personal
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre Cliente */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="nombreCliente" className="text-sm font-medium">
              Nombre del Cliente <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombreCliente"
              value={data.nombreCliente}
              onChange={(e) => onUpdate("nombreCliente", e.target.value.toUpperCase())}
              placeholder="Nombre completo del cliente"
              className={getFieldError(errors, "cliente.nombreCliente") ? "border-red-500" : ""}
            />
            {getFieldError(errors, "cliente.nombreCliente") && (
              <p className="text-xs text-red-500">{getFieldError(errors, "cliente.nombreCliente")}</p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono" className="text-sm font-medium flex items-center gap-1">
              <Phone className="h-3 w-3" />
              Teléfono
            </Label>
            <Input
              id="telefono"
              type="tel"
              value={data.telefono}
              onChange={(e) => onUpdate("telefono", e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10 dígitos"
              className={getFieldError(errors, "cliente.telefono") ? "border-red-500" : ""}
            />
            {getFieldError(errors, "cliente.telefono") && (
              <p className="text-xs text-red-500">{getFieldError(errors, "cliente.telefono")}</p>
            )}
          </div>

          {/* Aval */}
          <div className="space-y-2">
            <Label htmlFor="aval" className="text-sm font-medium flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Aval o Responsable
            </Label>
            <Input
              id="aval"
              value={data.aval}
              onChange={(e) => onUpdate("aval", e.target.value.toUpperCase())}
              placeholder="Nombre del aval"
            />
          </div>

          {/* Referencia */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="referencia" className="text-sm font-medium flex items-center gap-1">
              <Navigation className="h-3 w-3" />
              Referencia de ubicación
            </Label>
            <Input
              id="referencia"
              value={data.referencia}
              onChange={(e) => onUpdate("referencia", e.target.value.slice(0, 99))}
              placeholder="Ej: casa azul en la esquina"
              maxLength={99}
            />
          </div>
        </div>
      </fieldset>

      {/* Dirección */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <MapPin className="h-4 w-4 text-blue-600" />
          Dirección
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Calle */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="calle" className="text-sm font-medium">
              Calle <span className="text-red-500">*</span>
            </Label>
            <Input
              id="calle"
              value={data.calle}
              onChange={(e) => onUpdate("calle", e.target.value.toUpperCase())}
              placeholder="Nombre de la calle"
              className={getFieldError(errors, "cliente.calle") ? "border-red-500" : ""}
            />
            {getFieldError(errors, "cliente.calle") && (
              <p className="text-xs text-red-500">{getFieldError(errors, "cliente.calle")}</p>
            )}
          </div>

          {/* Número Exterior */}
          <div className="space-y-2">
            <Label htmlFor="numeroExterior" className="text-sm font-medium flex items-center gap-1">
              <Home className="h-3 w-3" />
              Número
            </Label>
            <Input
              id="numeroExterior"
              value={data.numeroExterior}
              onChange={(e) => onUpdate("numeroExterior", e.target.value.toUpperCase())}
              placeholder="Ej: 123-A"
            />
          </div>

          {/* Colonia */}
          <div className="space-y-2">
            <Label htmlFor="colonia" className="text-sm font-medium">
              Colonia
            </Label>
            <Input
              id="colonia"
              value={data.colonia}
              onChange={(e) => onUpdate("colonia", e.target.value.toUpperCase())}
              placeholder="Nombre de la colonia"
            />
          </div>

          {/* Población */}
          <div className="space-y-2">
            <Label htmlFor="poblacion" className="text-sm font-medium flex items-center gap-1">
              <Building className="h-3 w-3" />
              Población
            </Label>
            <Input
              id="poblacion"
              value={data.poblacion}
              onChange={(e) => onUpdate("poblacion", e.target.value.toUpperCase())}
              placeholder="Población o municipio"
            />
          </div>

          {/* Ciudad */}
          <div className="space-y-2">
            <Label htmlFor="ciudad" className="text-sm font-medium">
              Ciudad
            </Label>
            <Input
              id="ciudad"
              value={data.ciudad}
              onChange={(e) => onUpdate("ciudad", e.target.value.toUpperCase())}
              placeholder="Ciudad y estado"
            />
          </div>

          {/* Zona */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="zonaClienteId" className="text-sm font-medium flex items-center gap-1">
              <Map className="h-3 w-3" />
              Zona de Cobranza
            </Label>
            <Select
              value={data.zonaClienteId?.toString() || ""}
              onValueChange={(value) =>
                onUpdate("zonaClienteId", value ? parseInt(value, 10) : null)
              }
            >
              <SelectTrigger id="zonaClienteId">
                <SelectValue placeholder={loadingZonas ? "Cargando zonas..." : "Seleccionar zona"} />
              </SelectTrigger>
              <SelectContent>
                {zonas.map((zona) => (
                  <SelectItem key={zona.ZONA_CLIENTE_ID} value={zona.ZONA_CLIENTE_ID.toString()}>
                    {zona.ZONA_CLIENTE}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>
    </div>
  );
};

export default ClienteTab;
