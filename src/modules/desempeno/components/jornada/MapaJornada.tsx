import { lazy, Suspense } from "react";
import type { Actividad } from "../../domain/entities";
import type { PuntoMapa } from "./MapaJornadaGoogle";

const MapaJornadaGoogle = lazy(() =>
  import("./MapaJornadaGoogle").then((m) => ({ default: m.MapaJornadaGoogle })),
);

const AVISO = "p-6 text-center font-mono text-[11px] text-muted-foreground";

// Mapa con puntos numerados en orden de captura. Las actividades sin GPS van
// en la lista pero no en el mapa (spec §6). Los números son la posición en la
// lista, no un dato del negocio.
export function MapaJornada({
  actividades,
  etiquetaDia,
  onSeleccionar,
}: {
  actividades: readonly Actividad[];
  etiquetaDia: string;
  onSeleccionar: (id: string) => void;
}) {
  const puntos: PuntoMapa[] = [];
  actividades.forEach((a, i) => {
    if (a.conGps && a.lat !== null && a.lng !== null) {
      puntos.push({ id: a.id, n: i + 1, lat: a.lat, lng: a.lng });
    }
  });
  // Rótulo de dibujo: cuántas actividades vinieron sin GPS (bandera del API).
  const sinGps = actividades.filter((a) => !a.conGps).length;
  const hayLlave = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  return (
    <div className="overflow-hidden rounded-[14px] bg-dsm-tarjeta shadow-sm ring-1 ring-border">
      <div className="flex items-center justify-between px-[18px] py-3">
        <h3 className="text-[13px] font-medium">Recorrido</h3>
        <span className="font-mono text-[11px] text-muted-foreground">{etiquetaDia}</span>
      </div>
      {puntos.length === 0 ? (
        <p className={AVISO}>Sin ubicaciones este día</p>
      ) : hayLlave ? (
        <Suspense fallback={<p className={AVISO}>Cargando mapa…</p>}>
          <MapaJornadaGoogle puntos={puntos} onSeleccionar={onSeleccionar} />
        </Suspense>
      ) : (
        <p className={AVISO}>Mapa no disponible</p>
      )}
      <div className="flex justify-between gap-3 px-[18px] py-2 text-[11px] text-muted-foreground">
        <span>Números en orden de captura · dónde se registró</span>
        <span className="whitespace-nowrap">{sinGps > 0 ? `${sinGps} sin GPS` : "todos con GPS"}</span>
      </div>
    </div>
  );
}
