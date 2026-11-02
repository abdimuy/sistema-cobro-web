import { lazy, Suspense } from "react";
import type { Actividad } from "../../domain/entities";
import { horaCorta } from "../lib/format";
import { TIPO_ACTIVIDAD_META } from "../lib/tipoActividadMeta";
import type { PuntoMapa } from "./MapaJornadaGoogle";
import { CLASE_COLOR, ETIQUETA_CATEGORIA, categoriaDePunto } from "./categoriaPunto";

const MapaJornadaGoogle = lazy(() =>
  import("./MapaJornadaGoogle").then((m) => ({ default: m.MapaJornadaGoogle })),
);

const AVISO = "p-6 text-center font-mono text-[11px] text-muted-foreground";

// Mapa con círculos de color por resultado, unidos en el orden de la lista. Las actividades sin GPS van
// en la lista pero no en el mapa (spec §6). El número (posición en la lista)
// sólo sale en el tooltip.
export function MapaJornada({
  actividades,
  etiquetaDia,
  onSeleccionar,
  enfocada,
  onEnfocar,
}: {
  actividades: readonly Actividad[];
  etiquetaDia: string;
  onSeleccionar: (id: string) => void;
  enfocada?: string | null;
  onEnfocar?: (id: string | null) => void;
}) {
  const puntos: PuntoMapa[] = [];
  actividades.forEach((a, i) => {
    if (a.conGps && a.lat !== null && a.lng !== null) {
      puntos.push({
        id: a.id,
        n: i + 1,
        lat: a.lat,
        lng: a.lng,
        categoria: categoriaDePunto(a),
        hora: horaCorta(a.hora),
        tipo: TIPO_ACTIVIDAD_META[a.tipo].etiqueta,
        cliente: a.clienteNombre,
      });
    }
  });
  // Rótulo de dibujo: cuántas actividades vinieron sin GPS (bandera del API).
  const sinGps = actividades.filter((a) => !a.conGps).length;
  return (
    <div className="overflow-hidden rounded-[14px] bg-dsm-tarjeta shadow-sm ring-1 ring-border">
      <div className="flex items-center justify-between px-[18px] py-3">
        <h3 className="text-[13px] font-medium">Recorrido</h3>
        <span className="font-mono text-[11px] text-muted-foreground">{etiquetaDia}</span>
      </div>
      {puntos.length === 0 ? (
        <p className={AVISO}>Sin ubicaciones este día</p>
      ) : (
        <Suspense fallback={<p className={AVISO}>Cargando mapa…</p>}>
          <MapaJornadaGoogle
            puntos={puntos}
            onSeleccionar={onSeleccionar}
            enfocada={enfocada}
            onEnfocar={onEnfocar}
          />
        </Suspense>
      )}
      <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 px-[18px] py-2 text-[11px] text-muted-foreground">
        <ul aria-label="Leyenda del mapa" className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {(["pago", "visita", "no_pago"] as const).map((c) => (
            <li key={c} className="flex items-center gap-1.5">
              <i aria-hidden className={`h-2.5 w-2.5 rounded-full ${CLASE_COLOR[c]}`} />
              {ETIQUETA_CATEGORIA[c]}
            </li>
          ))}
          {["Inicio", "Fin"].map((r) => (
            <li key={r} className="flex items-center gap-1.5">
              <i aria-hidden className={`h-3 w-3 rounded-full ring-2 ring-white ${CLASE_COLOR.marca}`} />
              {r}
            </li>
          ))}
        </ul>
        <span className="whitespace-nowrap">{sinGps > 0 ? `${sinGps} sin GPS` : "todos con GPS"}</span>
      </div>
    </div>
  );
}
