import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Actividad, Jornada, TipoActividad } from "../../domain/entities";
import { escalaDe } from "../lib/escala";
import { dinero, duracionCorta, fechaLarga, horaCorta, plural } from "../lib/format";
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
  return r.condonaciones.n;
}
// Importe del carril (opción A del mock): solo pagos y condonaciones lo tienen.
// Viene del resumen del servidor (D10).
function importeDe(jornada: Jornada, tipo: TipoActividad): string | null {
  if (tipo === "pago") return dinero(jornada.resumen.pagos.importe);
  if (tipo === "condonacion") return dinero(jornada.resumen.condonaciones.importe);
  return null;
}

// Rango "08:00–18:00": el horario configurado si lo hay; si no, de la primera a
// la última actividad. Todo viene del servidor.
function rangoDe(jornada: Jornada): string | null {
  if (jornada.horario) return `${jornada.horario.desdeHora}–${jornada.horario.hastaHora}`;
  const { primeraActividad, ultimaActividad } = jornada.resumen;
  if (!primeraActividad || !ultimaActividad) return null;
  return `${horaCorta(primeraActividad)}–${horaCorta(ultimaActividad)}`;
}

// EjeJornada: tarjeta "Línea del día" (opción A del mock). El encabezado lleva
// el rango, las horas activas, las pausas, los clientes y lo cobrado; cada
// carril, su conteo e importe. El eje y todas las cifras son los del servidor.
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
  const escala = escalaDe(jornada.eje);
  const horas = Array.from(
    { length: jornada.eje.hastaHora - jornada.eje.desdeHora + 1 },
    (_, i) => jornada.eje.desdeHora + i,
  );
  const r = jornada.resumen;
  const rango = rangoDe(jornada);
  const resumenLinea = [
    rango,
    `${duracionCorta(r.minutosActivos)} activas`,
    r.pausas.n > 0 ? `${duracionCorta(r.pausas.minutos)} en ${plural(r.pausas.n, "pausa", "pausas")}` : null,
    plural(r.clientes, "cliente", "clientes"),
  ]
    .filter((x) => x !== null)
    .join(" · ");
  return (
    <section
      aria-label="Línea del día"
      className="overflow-hidden rounded-[14px] bg-dsm-tarjeta shadow-sm ring-1 ring-border"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-border px-6 py-3.5">
        <div className="flex items-baseline gap-3.5">
          <h3 className="text-sm font-normal">Línea del día</h3>
          <span className="font-mono text-[11px] text-muted-foreground">{fechaLarga(jornada.fecha)}</span>
        </div>
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-[11px] text-muted-foreground">{resumenLinea}</span>
          <span className="font-serif text-[28px] leading-none">{dinero(r.pagos.importe)}</span>
          <span className="font-mono text-[11px] text-muted-foreground">cobrado</span>
        </div>
      </header>
      <div className="grid grid-cols-[180px_1fr] items-center gap-y-2 px-6 pb-3 pt-4">
        {linea && (
          <>
            <span className="flex items-baseline gap-2 text-[13px] text-muted-foreground">
              Trabajo
              <span className="font-mono text-[11px]">{duracionCorta(r.minutosActivos)}</span>
            </span>
            <div>{linea}</div>
          </>
        )}
        {CARRILES.map(([tipo, etiqueta]) => {
          const delTipo = jornada.actividades.filter((a) => a.tipo === tipo);
          return (
            <div key={tipo} data-carril={tipo} className="contents">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <i className={cn("h-2 w-2 rounded-full", TIPO_ACTIVIDAD_META[tipo].clasePunto)} />
                  {etiqueta} <b className="font-medium text-foreground">{conteoDe(jornada, tipo)}</b>
                </span>
                {importeDe(jornada, tipo) && (
                  <span className="font-mono text-[11px]">{importeDe(jornada, tipo)}</span>
                )}
              </div>
              <div className="relative h-10 border-b border-border">
                {jornada.linea.pausas.map((p) => (
                  <span
                    key={`${p.desde}-${p.hasta}`}
                    aria-hidden
                    className="dsm-pausa absolute inset-y-0"
                    style={{ left: `${escala.posicion(p.desde)}%`, width: `${escala.ancho(p.desde, p.hasta)}%` }}
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
                      style={{ left: `${escala.posicion(a.hora)}%` }}
                    />
                  </InfoRapida>
                ))}
              </div>
            </div>
          );
        })}
        <span />
        <div data-testid="eje-horas" className="relative h-4">
          {horas.map((h) => (
            <span
              key={h}
              className="absolute -translate-x-1/2 font-mono text-[10px] text-muted-foreground"
              style={{ left: `${escala.posicionMinutos(h * 60)}%` }}
            >
              {h}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
