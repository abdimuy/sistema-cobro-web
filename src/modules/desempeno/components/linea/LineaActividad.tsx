import { cn } from "@/lib/utils";
import type { LineaDelDia, Pausa, PuntoLinea } from "../../domain/entities";
import type { Horario } from "../../application/ports/DesempenoPort";
import type { VistaLinea } from "../../presentation/preferencias";
import { ancho, MARCAS_EJE, posicion, posicionHorario, posicionMinutos } from "../lib/escala";
import { horaCorta } from "../lib/format";
import { TIPO_ACTIVIDAD_META } from "../lib/tipoActividadMeta";
import { InfoRapida } from "../comunes/InfoRapida";
import { TarjetaHora, TarjetaPausa, TarjetaPunto, TarjetaTramo } from "./TarjetasLinea";

// Cuántos movimientos en una hora llenan la barra. Es solo la escala del dibujo.
export const ESCALA_BARRA_HORA = 12;
const HORAS_EN_EJE = 13;
const ORDEN_DIBUJO = { visita: 0, condonacion: 1, pago: 2 } as const;

export type LineaActividadProps = {
  linea: LineaDelDia | null;
  vista: VistaLinea;
  pausaMin: number;
  horario: Horario | null;
  /** Instante "ahora" del servidor (generado_at); solo si la línea es de hoy. */
  ahora: string | null;
  tamano?: "mini" | "grande";
  /** Cómo nombrar una actividad por su id en "Antes/Después" de una pausa. */
  describir?: (actividadId: string) => string | null;
  etiquetaDia?: string;
};

function describirConPuntos(linea: LineaDelDia | null) {
  return (id: string): string | null => {
    const p = linea?.puntos.find((x) => x.id === id);
    return p ? `${horaCorta(p.hora)} · ${TIPO_ACTIVIDAD_META[p.tipo].etiqueta.toLowerCase()}` : null;
  };
}

// LineaActividad pinta la línea del día en una de las 4 vistas (D16). Puntos,
// tramos, conteos por hora y pausas vienen del API (D10); aquí solo se ubican
// en el eje 7–20 h. Los elementos no son enfocables: sus popovers se abren con
// el ratón (spec §10).
export function LineaActividad({
  linea,
  vista,
  pausaMin,
  horario,
  ahora,
  tamano = "mini",
  describir,
  etiquetaDia,
}: LineaActividadProps) {
  const nombrar = describir ?? describirConPuntos(linea);
  const conActividad = linea !== null && linea.puntos.length > 0;
  return (
    <div
      data-testid="linea-actividad"
      data-vista={vista}
      className={cn(
        "relative w-full overflow-hidden rounded-[7px] bg-muted/60",
        tamano === "mini" ? "h-8" : "h-10",
      )}
    >
      {MARCAS_EJE.map((h) => (
        <i
          key={h}
          aria-hidden
          className="absolute inset-y-0 w-px bg-border"
          style={{ left: `${posicionMinutos(h * 60)}%` }}
        />
      ))}
      {horario && (
        <>
          <span
            data-testid="fuera-horario"
            className="dsm-fuera-horario absolute inset-y-0 left-0"
            style={{ width: `${posicionHorario(horario.desde)}%` }}
          />
          <span
            data-testid="fuera-horario"
            className="dsm-fuera-horario absolute inset-y-0 right-0"
            style={{ left: `${posicionHorario(horario.hasta)}%` }}
          />
        </>
      )}
      {conActividad && linea && vista === "puntos" && (
        <VistaPuntos linea={linea} ahora={ahora} pausaMin={pausaMin} nombrar={nombrar} etiquetaDia={etiquetaDia} />
      )}
      {conActividad && linea && vista === "bloques" && (
        <>
          <Pausas pausas={linea.pausas} alto="completa" pausaMin={pausaMin} nombrar={nombrar} etiquetaDia={etiquetaDia} />
          <Tramos linea={linea} mitad={false} etiquetaDia={etiquetaDia} />
        </>
      )}
      {conActividad && linea && vista === "por_hora" && (
        <>
          <BarrasHora linea={linea} etiquetaDia={etiquetaDia} />
          <Pausas pausas={linea.pausas} alto="tira" pausaMin={pausaMin} nombrar={nombrar} etiquetaDia={etiquetaDia} />
        </>
      )}
      {conActividad && linea && vista === "bloques_hora" && (
        <>
          <Tramos linea={linea} mitad etiquetaDia={etiquetaDia} />
          <BarrasHora linea={linea} etiquetaDia={etiquetaDia} />
          <Pausas pausas={linea.pausas} alto="tira" pausaMin={pausaMin} nombrar={nombrar} etiquetaDia={etiquetaDia} />
        </>
      )}
      {ahora && (
        <span
          data-testid="marca-ahora"
          aria-hidden
          className="absolute inset-y-0 w-px bg-dsm-marca"
          style={{ left: `${posicion(ahora)}%` }}
        />
      )}
    </div>
  );
}

function Pausas({
  pausas,
  alto,
  pausaMin,
  nombrar,
  etiquetaDia,
}: {
  pausas: readonly Pausa[];
  alto: "completa" | "tira";
  pausaMin: number;
  nombrar: (id: string) => string | null;
  etiquetaDia?: string;
}) {
  return (
    <>
      {pausas.map((p) => (
        <InfoRapida
          key={`${p.desde}-${p.hasta}`}
          contenido={<TarjetaPausa pausa={p} pausaMin={pausaMin} describir={nombrar} etiquetaDia={etiquetaDia} />}
        >
          <span
            data-testid="pausa"
            className={cn(
              "dsm-pausa absolute rounded-[3px]",
              alto === "completa" ? "inset-y-0" : "bottom-0 h-1.5",
              p.enCurso && "ring-1 ring-inset ring-[hsl(var(--dsm-ambar))]",
            )}
            style={{ left: `${posicion(p.desde)}%`, width: `${ancho(p.desde, p.hasta)}%` }}
          />
        </InfoRapida>
      ))}
    </>
  );
}

function Tramos({ linea, mitad, etiquetaDia }: { linea: LineaDelDia; mitad: boolean; etiquetaDia?: string }) {
  return (
    <>
      {linea.tramos.map((t) => (
        <InfoRapida key={`${t.desde}-${t.hasta}`} contenido={<TarjetaTramo tramo={t} etiquetaDia={etiquetaDia} />}>
          <span
            data-testid="tramo"
            className={cn(
              "absolute rounded-[5px]",
              t.pagos.n > 0 ? "bg-dsm-ok" : "bg-dsm-visita",
              mitad ? "bottom-2 top-1/2" : "inset-y-1.5",
            )}
            style={{ left: `${posicion(t.desde)}%`, width: `${Math.max(0.6, ancho(t.desde, t.hasta))}%` }}
          />
        </InfoRapida>
      ))}
    </>
  );
}

function altura(n: number): string {
  return `${Math.min(100, (n / ESCALA_BARRA_HORA) * 100)}%`;
}

function BarrasHora({ linea, etiquetaDia }: { linea: LineaDelDia; etiquetaDia?: string }) {
  return (
    <>
      {linea.porHora.map((h) => (
        <InfoRapida key={h.hora} contenido={<TarjetaHora hora={h} etiquetaDia={etiquetaDia} />}>
          <span
            data-testid="barra-hora"
            className="absolute bottom-1.5 top-0 flex flex-col-reverse px-px"
            style={{ left: `${posicionMinutos(h.hora * 60)}%`, width: `${100 / HORAS_EN_EJE}%` }}
          >
            {h.pagos > 0 && <i className="block bg-dsm-ok" style={{ height: altura(h.pagos) }} />}
            {h.visitas > 0 && <i className="block bg-dsm-visita" style={{ height: altura(h.visitas) }} />}
            {h.condonaciones > 0 && (
              <i className="block bg-dsm-violeta" style={{ height: altura(h.condonaciones) }} />
            )}
          </span>
        </InfoRapida>
      ))}
    </>
  );
}

function VistaPuntos({
  linea,
  ahora,
  pausaMin,
  nombrar,
  etiquetaDia,
}: {
  linea: LineaDelDia;
  ahora: string | null;
  pausaMin: number;
  nombrar: (id: string) => string | null;
  etiquetaDia?: string;
}) {
  const primero = linea.puntos[0];
  const ultimo = ahora ?? linea.puntos[linea.puntos.length - 1].hora;
  // El orden solo decide qué punto se dibuja encima (pagos arriba); no altera datos.
  const ordenados: PuntoLinea[] = [...linea.puntos].sort(
    (a, b) => ORDEN_DIBUJO[a.tipo] - ORDEN_DIBUJO[b.tipo],
  );
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-y-1 rounded-[4px] bg-foreground/[0.06]"
        style={{ left: `${posicion(primero.hora)}%`, width: `${ancho(primero.hora, ultimo)}%` }}
      />
      <Pausas pausas={linea.pausas} alto="completa" pausaMin={pausaMin} nombrar={nombrar} etiquetaDia={etiquetaDia} />
      {ordenados.map((p) => (
        <InfoRapida key={p.id} contenido={<TarjetaPunto punto={p} etiquetaDia={etiquetaDia} />}>
          <span
            data-testid="punto"
            data-id={p.id}
            data-tipo={p.tipo}
            className={cn(
              "absolute -ml-[3.5px] -mt-[3.5px] h-[7px] w-[7px] rounded-full",
              TIPO_ACTIVIDAD_META[p.tipo].clasePunto,
              p.tipo === "visita" ? "top-[70%]" : "top-[32%]",
            )}
            style={{ left: `${posicion(p.hora)}%` }}
          />
        </InfoRapida>
      ))}
    </>
  );
}
