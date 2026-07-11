import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CampoInline } from "../piezas/CampoInline";
import { SeleccionarZonaCombobox } from "../piezas/SeleccionarZonaCombobox";
import { SeleccionarClienteMicrosipCombobox } from "../piezas/SeleccionarClienteMicrosipCombobox";
import useGetZonasCliente from "@/hooks/useGetZonasCliente";
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
}

const SubCardHeader = ({ title }: { title: string }) => (
  <div className="border-b border-border/60 px-5 py-3">
    <h3 className="font-serif text-lg font-normal text-foreground">{title}</h3>
  </div>
);

export const ClienteTab = ({ data, gps, errors, onUpdate, onUpdateGps }: Props) => {
  const nombreError = getFieldError(errors, "cliente.nombreCliente");
  const telefonoError = getFieldError(errors, "cliente.telefono");
  const calleError = getFieldError(errors, "cliente.calle");

  const { zonas } = useGetZonasCliente();
  const zonasCombobox = useMemo(
    () => zonas.map((z) => ({ id: z.ZONA_CLIENTE_ID, nombre: z.ZONA_CLIENTE })),
    [zonas],
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left card: Cliente */}
      <div className="rounded-lg border border-border/60 bg-card">
        <SubCardHeader title="Cliente" />
        <div className="px-5 py-5 space-y-5">
          <CampoInline label="Nombre" obligatorio error={nombreError}>
            <Input
              value={data.nombreCliente}
              onChange={(e) => onUpdate("nombreCliente", e.target.value.toUpperCase())}
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
              onChange={(id) => onUpdate("clienteID", id)}
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
              <Input
                value={data.ciudad}
                onChange={(e) => onUpdate("ciudad", e.target.value.toUpperCase())}
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
