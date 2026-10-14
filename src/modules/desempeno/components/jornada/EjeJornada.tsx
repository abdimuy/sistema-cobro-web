import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Actividad, Jornada, TipoActividad } from "../../domain/entities";
import { HORA_FIN_EJE, HORA_INICIO_EJE, ancho, posicion, posicionMinutos } from "../lib/escala";
import { horaCorta } from "../lib/format";
import { TIPO_ACTIVIDAD_META } from "../lib/tipoActividadMeta";
import { InfoRapida } from "../comunes/InfoRapida";
import { TarjetaActividad } from "../comunes/TarjetaActividad";

const CARRILES: ReadonlyArray<readonly [TipoActividad, string]> = [
  ["pago", "Pagos"],
  ["visita", "Visitas"],
  ["condonacion", "Condonaciones"],
];

// Conteo de cada carril: el del resumen del servidor (D10), nunca los renglones
// contados en pantalla.
function conteoDe(jornada: Jornada, tipo: TipoActividad): number {
  const r = jornada.resumen;
  if (tipo === "pago") return r.pagos.n;
  if (tipo === "visita") return r.visitas;
  return r.condonaciones;
}
const HORAS = Array.from(
  { length: HORA_FIN_EJE - HORA_INICIO_EJE + 1 },
  (_, i) => HORA_INICIO_EJE + i,
);

// EjeJornada: carriles de pagos, visitas y condonaciones sobre el eje 7–20 h.
// `linea` es el hueco donde la integración pone la LineaActividad (carril 1).
export function EjeJornada({
  jornada,
  linea,
  onAbrirActividad,
}: {
  jornada: Jornada;
  linea?: ReactNode;
  onAbrirActividad: (a: Actividad) => void;
}) {
  return (
    <div className="rounded-[14px] bg-dsm-tarjeta px-6 pb-3 pt-5 shadow-sm ring-1 ring-border">
      <div className="grid grid-cols-[136px_1fr] items-center gap-y-2">
        {linea && (
          <>
            <span className="text-xs text-muted-foreground">Línea del día</span>
            <div>{linea}</div>
          </>
        )}
        {CARRILES.map(([tipo, etiqueta]) => {
          const delTipo = jornada.actividades.filter((a) => a.tipo === tipo);
          return (
            <div key={tipo} className="contents">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <i className={cn("h-2 w-2 rounded-full", TIPO_ACTIVIDAD_META[tipo].clasePunto)} />
                {etiqueta} <b className="font-medium text-foreground">{conteoDe(jornada, tipo)}</b>
              </span>
              <div className="relative h-10 border-b border-border">
                {jornada.linea.pausas.map((p) => (
                  <span
                    key={`${p.desde}-${p.hasta}`}
                    aria-hidden
                    className="dsm-pausa absolute inset-y-0"
                    style={{ left: `${posicion(p.desde)}%`, width: `${ancho(p.desde, p.hasta)}%` }}
                  />
                ))}
                {delTipo.map((a) => (
                  <InfoRapida key={a.id} contenido={<TarjetaActividad actividad={a} />}>
                    <button
                      type="button"
                      data-testid="eje-punto"
                      aria-label={`${horaCorta(a.hora)} · ${a.clienteNombre}`}
                      onClick={() => onAbrirActividad(a)}
                      className={cn(
                        "absolute top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 rounded-full ring-2 ring-[hsl(var(--dsm-tarjeta))] transition-transform hover:scale-150",
                        TIPO_ACTIVIDAD_META[a.tipo].clasePunto,
                      )}
                      style={{ left: `${posicion(a.hora)}%` }}
                    />
                  </InfoRapida>
                ))}
              </div>
            </div>
          );
        })}
        <span />
        <div className="relative h-4">
          {HORAS.map((h) => (
            <span
              key={h}
              className="absolute -translate-x-1/2 font-mono text-[10px] text-muted-foreground"
              style={{ left: `${posicionMinutos(h * 60)}%` }}
            >
              {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
