import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CampoInline } from "../piezas/CampoInline";
import { SeleccionarZonaCombobox } from "../piezas/SeleccionarZonaCombobox";
import { SeleccionarCiudadCombobox } from "../piezas/SeleccionarCiudadCombobox";
import { SeleccionarClienteMicrosipCombobox } from "../piezas/SeleccionarClienteMicrosipCombobox";
import useGetZonasCliente from "@/hooks/useGetZonasCliente";
import useGetCiudades from "@/hooks/useGetCiudades";
import type { ClienteFormData, GPSFormData, ValidationError } from "../../../presentation/hooks/useVentaEditState";

const getFieldError = (errors: ValidationError[], field: string): string | undefined =>
  errors.find((e) => e.field === field)?.message;

type UpdateCliente = <K extends keyof ClienteFormData>(field: K, value: ClienteFormData[K]) => void;

interface Props {
  data: ClienteFormData;
  gps: GPSFormData;
  errors: ValidationError[];
  onUpdate: UpdateCliente;
  onUpdateGps: (field: "latitud" | "longitud", value: number) => void;
  // Nombre real del cliente en Microsip para el clienteID vigente (viene de
  // `nombre_cliente_microsip` en el detalle de la venta). Ausente cuando no
  // hay cliente ligado, cuando el API no lo resolvió, o cuando el clienteID
  // vigente ya no es el original de la venta (se ligó a otro cliente en esta
  // misma sesión) — en ese caso EditarVentaModal deja de pasarlo y el nombre
  // ya recién elegido en `data.nombreCliente` toma su lugar.
  nombreClienteMicrosip?: string;
}

const SubCardHeader = ({ title }: { title: string }) => (
  <div className="border-b border-border/60 px-5 py-3">
    <h3 className="font-serif text-lg font-normal text-foreground">{title}</h3>
  </div>
);

export const ClienteTab = ({ data, gps, errors, onUpdate, onUpdateGps, nombreClienteMicrosip }: Props) => {
  const nombreError = getFieldError(errors, "cliente.nombreCliente");
  const telefonoError = getFieldError(errors, "cliente.telefono");
  const calleError = getFieldError(errors, "cliente.calle");

  // Microsip manda sobre los datos del cliente cuando la venta está ligada:
  // el campo Nombre se bloquea y muestra su nombre real, no lo que ya traía
  // guardado la venta (eso fue el defecto: alguien lo editó sin desvincular).
  // Si el API no resolvió el nombre, no se inventa nada — se muestra el que
  // ya tenía la venta, en sólo lectura, porque el cliente sigue existiendo.
  const vinculado = data.clienteID !== null;
  const nombreMostrado = vinculado ? (nombreClienteMicrosip ?? data.nombreCliente) : data.nombreCliente;

  const handleClienteMicrosipChange = (clienteId: number | null, nombre?: string) => {
    onUpdate("clienteID", clienteId);
    // Vincular y nombrar es un solo gesto: al elegir del buscador, el nombre
    // se rellena solo con el dato real. Al desvincular no se toca el nombre;
    // queda editable con lo que ya tenía.
    if (nombre !== undefined) {
      onUpdate("nombreCliente", nombre);
    }
  };

  const { zonas } = useGetZonasCliente();
  const zonasCombobox = useMemo(
    () => zonas.map((z) => ({ id: z.ZONA_CLIENTE_ID, nombre: z.ZONA_CLIENTE })),
    [zonas],
  );

  const { ciudades, loading: cargandoCiudades } = useGetCiudades();
  const ciudadesCombobox = useMemo(
    () => ciudades.map((c) => ({ id: c.ciudadId, nombre: c.ciudad, estado: c.estado })),
    [ciudades],
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left card: Cliente */}
      <div className="rounded-lg border border-border/60 bg-card">
        <SubCardHeader title="Cliente" />
        <div className="px-5 py-5 space-y-5">
          <CampoInline label="Nombre" obligatorio error={nombreError}>
            <Input
              value={nombreMostrado}
              onChange={(e) => onUpdate("nombreCliente", e.target.value.toUpperCase())}
              disabled={vinculado}
              title={vinculado ? "Se edita en Microsip" : undefined}
              className={cn(nombreError && "border-destructive/60 focus-visible:ring-destructive/30")}
              aria-invalid={!!nombreError}
            />
          </CampoInline>

          <CampoInline label="Teléfono" helper="ej. +524491234567" error={telefonoError}>
            <Input
              type="tel"
              value={data.telefono}
              onChange={(e) => onUpdate("telefono", e.target.value)}
              className={cn(telefonoError && "border-destructive/60 focus-visible:ring-destructive/30")}
              aria-invalid={!!telefonoError}
            />
          </CampoInline>

          <CampoInline label="Aval">
            <Input
              value={data.aval}
              onChange={(e) => onUpdate("aval", e.target.value)}
            />
          </CampoInline>

          <CampoInline label="Referencia" helper="ej. casa azul esquina">
            <Input
              value={data.referencia}
              onChange={(e) => onUpdate("referencia", e.target.value)}
            />
          </CampoInline>

          {/* Cliente Microsip */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Cliente Microsip
            </p>
            <SeleccionarClienteMicrosipCombobox
              value={data.clienteID}
              onChange={handleClienteMicrosipChange}
              nombreVinculado={nombreClienteMicrosip}
            />
          </div>
        </div>
      </div>

      {/* Right card: Dirección y ubicación */}
      <div className="rounded-lg border border-border/60 bg-card">
        <SubCardHeader title="Dirección y ubicación" />
        <div className="px-5 py-5 space-y-5">
          <CampoInline label="Calle" obligatorio error={calleError}>
            <Input
              value={data.calle}
              onChange={(e) => onUpdate("calle", e.target.value.toUpperCase())}
              className={cn(calleError && "border-destructive/60 focus-visible:ring-destructive/30")}
              aria-invalid={!!calleError}
            />
          </CampoInline>

          <CampoInline label="Número exterior">
            <Input
              value={data.numeroExterior}
              onChange={(e) => onUpdate("numeroExterior", e.target.value.toUpperCase())}
            />
          </CampoInline>

          <CampoInline label="Colonia" obligatorio>
            <Input
              value={data.colonia}
              onChange={(e) => onUpdate("colonia", e.target.value.toUpperCase())}
            />
          </CampoInline>

          <div className="grid grid-cols-2 gap-4">
            <CampoInline label="Población" obligatorio>
              <Input
                value={data.poblacion}
                onChange={(e) => onUpdate("poblacion", e.target.value.toUpperCase())}
              />
            </CampoInline>
            <CampoInline label="Ciudad" obligatorio>
              <SeleccionarCiudadCombobox
                value={data.ciudad}
                onChange={(next) => onUpdate("ciudad", next)}
                ciudades={ciudadesCombobox}
                cargando={cargandoCiudades}
              />
            </CampoInline>
          </div>

          <CampoInline label="Zona">
            <SeleccionarZonaCombobox
              value={data.zonaClienteId}
              onChange={(next) => onUpdate("zonaClienteId", next)}
              zonas={zonasCombobox}
            />
          </CampoInline>

          {/* GPS */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Coordenadas GPS
            </p>
            <div className="grid grid-cols-2 gap-4">
              <CampoInline label="Latitud">
                <Input
                  type="number"
                  step="0.000001"
                  value={gps.latitud}
                  onChange={(e) => onUpdateGps("latitud", parseFloat(e.target.value) || 0)}
                />
              </CampoInline>
              <CampoInline label="Longitud">
                <Input
                  type="number"
                  step="0.000001"
                  value={gps.longitud}
                  onChange={(e) => onUpdateGps("longitud", parseFloat(e.target.value) || 0)}
                />
              </CampoInline>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
