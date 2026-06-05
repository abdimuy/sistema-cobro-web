import { ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import MapSimple from "@/components/MapSimple";
import { VentaV2 } from "@/services/api/ventaV2Types";

const fields = (venta: VentaV2): Array<{ label: string; value: string | null }> => [
  { label: "Calle", value: venta.direccion.calle || null },
  { label: "Número", value: venta.direccion.numero_exterior },
  { label: "Colonia", value: venta.direccion.colonia || null },
  { label: "Población", value: venta.direccion.poblacion || null },
  { label: "Ciudad", value: venta.direccion.ciudad || null },
  { label: "Referencia", value: venta.cliente.referencia },
];

export const VentaUbicacionTab = ({ venta }: { venta: VentaV2 }) => {
  const hasGPS = venta.gps.latitud !== 0 || venta.gps.longitud !== 0;
  const mapsUrl = hasGPS
    ? `https://www.google.com/maps?q=${venta.gps.latitud},${venta.gps.longitud}`
    : null;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-normal text-foreground">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Dirección
        </h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          {fields(venta).map((f) => (
            <div key={f.label}>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {f.label}
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {f.value ?? <span className="text-muted-foreground/60">—</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {hasGPS && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-normal text-foreground">Ubicación GPS</h3>
              <p className="font-mono text-[11px] tabular text-muted-foreground">
                {venta.gps.latitud.toFixed(6)}, {venta.gps.longitud.toFixed(6)}
              </p>
            </div>
            {mapsUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Abrir en Google Maps
                </a>
              </Button>
            )}
          </div>
          <div className="h-72 overflow-hidden rounded-lg border border-border/60">
            <MapSimple
              point={{ lat: venta.gps.latitud, lng: venta.gps.longitud }}
              height="288px"
              zoom={16}
            />
          </div>
        </section>
      )}
    </div>
  );
};

export default VentaUbicacionTab;
