import { lazy, Suspense, useEffect, useState } from "react";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { Actividad } from "../../domain/entities";
import { horaCorta } from "../lib/format";
import { TIPO_ACTIVIDAD_META } from "../lib/tipoActividadMeta";
import type { PuntoMapa } from "./MapaJornadaGoogle";
import { CLASE_COLOR, ETIQUETA_CATEGORIA, categoriaDePunto } from "./categoriaPunto";
import { UMBRAL_FUSION_M, distanciaMetros } from "./distancia";

const MapaJornadaGoogle = lazy(() =>
  import("./MapaJornadaGoogle").then((m) => ({ default: m.MapaJornadaGoogle })),
);

const AVISO = "p-6 text-center font-mono text-[11px] text-muted-foreground";
const CLAVE_TRAYECTO = "desempeno.jornada.trayecto";

function leerTrayecto(): boolean {
  try {
    return localStorage.getItem(CLAVE_TRAYECTO) === "1";
  } catch {
    return false;
  }
}
function guardarTrayecto(v: boolean) {
  try {
    localStorage.setItem(CLAVE_TRAYECTO, v ? "1" : "0");
  } catch {
    /* sin almacenamiento: el interruptor sólo vale para esta sesión */
  }
}

const aMinutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const aHora = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// Mapa con círculos de color por resultado. El trayecto (polilínea) es opcional
// y un filtro de horario decide qué puntos se pintan; la lista no se filtra.
// Las actividades sin GPS van en la lista pero no en el mapa (spec §6). El
// número (posición en la lista) sólo sale en el tooltip.
export function MapaJornada({
  actividades,
  etiquetaDia,
  onSeleccionar,
  enfocada,
  onEnfocar,
  finEsCierre = true,
}: {
  actividades: readonly Actividad[];
  etiquetaDia: string;
  onSeleccionar: (id: string) => void;
  enfocada?: string | null;
  onEnfocar?: (id: string | null) => void;
  finEsCierre?: boolean;
}) {
  const [trayecto, setTrayecto] = useState(leerTrayecto);
  const [rango, setRango] = useState<readonly [number, number] | null>(null);
  const [grande, setGrande] = useState(false);

  const puntos: PuntoMapa[] = [];
  actividades.forEach((a, i) => {
    if (a.conGps && a.lat !== null && a.lng !== null) {
      const hora = horaCorta(a.hora);
      puntos.push({
        id: a.id,
        n: i + 1,
        lat: a.lat,
        lng: a.lng,
        categoria: categoriaDePunto(a),
        hora,
        minutos: aMinutos(hora),
        tipo: TIPO_ACTIVIDAD_META[a.tipo].etiqueta,
        cliente: a.clienteNombre,
      });
    }
  });
  // Rótulo de dibujo: cuántas actividades vinieron sin GPS (bandera del API).
  const sinGps = actividades.filter((a) => !a.conGps).length;
  const minimo = puntos.length > 0 ? Math.min(...puntos.map((p) => p.minutos)) : 0;
  const maximo = puntos.length > 0 ? Math.max(...puntos.map((p) => p.minutos)) : 0;

  // Otro día: el filtro vuelve a "Todo".
  useEffect(() => setRango(null), [etiquetaDia]);

  const [desde, hasta] = rango ?? [minimo, maximo];
  const fusionado =
    puntos.length > 1 && distanciaMetros(puntos[0], puntos[puntos.length - 1]) < UMBRAL_FUSION_M;
  const palabraFin = finEsCierre ? "Fin" : "Última";

  const cuerpo = (alto: string, sufijo: string) => (
    <>
      {puntos.length === 0 ? (
        <p className={AVISO}>Sin ubicaciones este día</p>
      ) : (
        <Suspense fallback={<p className={AVISO}>Cargando mapa…</p>}>
          <MapaJornadaGoogle
            puntos={puntos}
            onSeleccionar={onSeleccionar}
            enfocada={enfocada}
            onEnfocar={onEnfocar}
            trayecto={trayecto}
            rango={rango}
            finEsCierre={finEsCierre}
            claveDia={`${etiquetaDia}${sufijo}`}
            alto={alto}
          />
        </Suspense>
      )}
      {puntos.length > 1 && maximo > minimo && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-[18px] pt-2 text-[11px] text-muted-foreground">
          <span className="font-mono tabular-nums">{`${aHora(desde)} – ${aHora(hasta)}`}</span>
          <div className="relative min-w-[140px] flex-1">
            <input
              type="range"
              aria-label="Desde"
              min={minimo}
              max={maximo}
              value={desde}
              onChange={(e) => setRango([Math.min(Number(e.target.value), hasta), hasta])}
              className="w-full accent-[hsl(var(--dsm-marca))]"
            />
            <input
              type="range"
              aria-label="Hasta"
              min={minimo}
              max={maximo}
              value={hasta}
              onChange={(e) => setRango([desde, Math.max(Number(e.target.value), desde)])}
              className="w-full accent-[hsl(var(--dsm-marca))]"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px]"
            disabled={rango === null}
            onClick={() => setRango(null)}
          >
            Todo
          </Button>
        </div>
      )}
      <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 px-[18px] py-2 text-[11px] text-muted-foreground">
        <ul aria-label="Leyenda del mapa" className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {(["pago", "visita", "no_pago"] as const).map((c) => (
            <li key={c} className="flex items-center gap-1.5">
              <i aria-hidden className={`h-2.5 w-2.5 rounded-full ${CLASE_COLOR[c]}`} />
              {ETIQUETA_CATEGORIA[c]}
            </li>
          ))}
          {(fusionado ? [`Inicio/${palabraFin}`] : ["Inicio", palabraFin]).map((r) => (
            <li key={r} className="flex items-center gap-1.5">
              <i aria-hidden className={`h-3 w-3 rounded-full ring-2 ring-white ${CLASE_COLOR.marca}`} />
              {r}
            </li>
          ))}
        </ul>
        <span className="whitespace-nowrap">{sinGps > 0 ? `${sinGps} sin GPS` : "todos con GPS"}</span>
      </div>
    </>
  );

  return (
    <div className="overflow-hidden rounded-[14px] bg-dsm-tarjeta shadow-sm ring-1 ring-border">
      <div className="flex flex-wrap items-center justify-between gap-2 px-[18px] py-3">
        <h3 className="text-[13px] font-medium">Recorrido</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Switch
              aria-label="Trayecto"
              checked={trayecto}
              onCheckedChange={(v) => {
                setTrayecto(v);
                guardarTrayecto(v);
              }}
              className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
            />
            Trayecto
          </label>
          {puntos.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Ampliar el recorrido"
              className="h-7 gap-1.5 px-2 text-[11px]"
              onClick={() => setGrande(true)}
            >
              <Maximize2 aria-hidden />
              Ampliar
            </Button>
          )}
          <span className="font-mono text-[11px] text-muted-foreground">{etiquetaDia}</span>
        </div>
      </div>
      {cuerpo("300px", "")}
      <Dialog open={grande} onOpenChange={setGrande}>
        <DialogContent className="block max-w-[1100px] w-[96vw] gap-0 p-4">
          <DialogTitle className="mb-3 text-sm font-medium">{`Recorrido · ${etiquetaDia}`}</DialogTitle>
          <DialogDescription className="sr-only">Recorrido del día ampliado</DialogDescription>
          {grande && cuerpo("65vh", "-grande")}
        </DialogContent>
      </Dialog>
    </div>
  );
}
