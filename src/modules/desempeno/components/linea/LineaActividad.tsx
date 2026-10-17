import { cn } from "@/lib/utils";
import type { Eje, HoraDelDia, LineaDelDia, Pausa, PuntoLinea, Tramo } from "../../domain/entities";
import type { Horario } from "../../application/ports/DesempenoPort";
import type { VistaLinea } from "../../presentation/preferencias";
import { escalaDe, type Escala } from "../lib/escala";
import { horaCorta } from "../lib/format";
import { TIPO_ACTIVIDAD_META } from "../lib/tipoActividadMeta";
import { InfoRapida } from "../comunes/InfoRapida";
import { TarjetaHora, TarjetaPausa, TarjetaPunto, TarjetaTramo } from "./TarjetasLinea";

// Escala mínima del dibujo: cuántos movimientos en una hora llenan la barra.
// Si alguna hora trae más, la escala sube a esa hora para que la pila nunca se
// desborde. Las barras de distintas filas se comparan mientras nadie pase de 12.
export const ESCALA_BARRA_HORA = 12;
const ORDEN_DIBUJO = { visita: 0, condonacion: 1, pago: 2 } as const;

export type LineaActividadProps = {
  linea: LineaDelDia | null;
  /** Eje que manda el servidor (`eje` de la respuesta); un solo eje por pantalla. */
  eje: Eje;
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
// en el eje del servidor. Los elementos no son enfocables: sus popovers se abren con
// el ratón (spec §10).
export function LineaActividad({
  linea,
  eje,
  vista,
  pausaMin,
  horario,
  ahora,
  tamano = "mini",
  describir,
  etiquetaDia,
}: LineaActividadProps) {
  const nombrar = describir ?? describirConPuntos(linea);
  const escala = escalaDe(eje);
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
      {escala.marcas.map((h) => (
        <i
          key={h}
          aria-hidden
          className="absolute inset-y-0 w-px bg-border"
          style={{ left: `${escala.posicionMinutos(h * 60)}%` }}
        />
      ))}
      {horario && (
        <>
          <span
            data-testid="fuera-horario"
            className="dsm-fuera-horario absolute inset-y-0 left-0"
            style={{ width: `${escala.posicionHorario(horario.desde)}%` }}
          />
          <span
            data-testid="fuera-horario"
            className="dsm-fuera-horario absolute inset-y-0 right-0"
            style={{ left: `${escala.posicionHorario(horario.hasta)}%` }}
          />
        </>
      )}
      {conActividad && linea && vista === "puntos" && (
        <VistaPuntos escala={escala} linea={linea} ahora={ahora} pausaMin={pausaMin} nombrar={nombrar} etiquetaDia={etiquetaDia} />
      )}
      {conActividad && linea && vista === "bloques" && (
        <>
          <Pausas escala={escala} pausas={linea.pausas} alto="completa" pausaMin={pausaMin} nombrar={nombrar} etiquetaDia={etiquetaDia} />
          <Tramos escala={escala} linea={linea} mitad={false} etiquetaDia={etiquetaDia} />
        </>
      )}
      {conActividad && linea && vista === "por_hora" && (
        <>
          <BarrasHora escala={escala} eje={eje} linea={linea} etiquetaDia={etiquetaDia} />
          <Pausas escala={escala} pausas={linea.pausas} alto="tira" pausaMin={pausaMin} nombrar={nombrar} etiquetaDia={etiquetaDia} />
        </>
      )}
      {conActividad && linea && vista === "bloques_hora" && (
        <>
          <Tramos escala={escala} linea={linea} mitad etiquetaDia={etiquetaDia} />
          <BarrasHora escala={escala} eje={eje} linea={linea} etiquetaDia={etiquetaDia} />
          <Pausas escala={escala} pausas={linea.pausas} alto="tira" pausaMin={pausaMin} nombrar={nombrar} etiquetaDia={etiquetaDia} />
        </>
      )}
      {ahora && (
        <span
          data-testid="marca-ahora"
          aria-hidden
          className="absolute inset-y-0 w-px bg-dsm-marca"
          style={{ left: `${escala.posicion(ahora)}%` }}
        />
      )}
    </div>
  );
}

function Pausas({
  escala,
  pausas,
  alto,
  pausaMin,
  nombrar,
  etiquetaDia,
}: {
  escala: Escala;
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
            style={{ left: `${escala.posicion(p.desde)}%`, width: `${escala.ancho(p.desde, p.hasta)}%` }}
          />
        </InfoRapida>
      ))}
    </>
  );
}

// Verde con pagos, gris si solo hubo visitas, morado si solo condonaciones.
function colorTramo(t: Tramo): string {
  if (t.pagos.n > 0) return "bg-dsm-ok";
  if (t.visitas === 0 && t.condonaciones > 0) return "bg-dsm-violeta";
  return "bg-dsm-visita";
}

function Tramos({ escala, linea, mitad, etiquetaDia }: { escala: Escala; linea: LineaDelDia; mitad: boolean; etiquetaDia?: string }) {
  return (
    <>
      {linea.tramos.map((t) => (
        <InfoRapida key={`${t.desde}-${t.hasta}`} contenido={<TarjetaTramo tramo={t} etiquetaDia={etiquetaDia} />}>
          <span
            data-testid="tramo"
            className={cn(
              "absolute rounded-[5px]",
              colorTramo(t),
              mitad ? "bottom-2 top-1/2" : "inset-y-1.5",
            )}
            style={{ left: `${escala.posicion(t.desde)}%`, width: `${Math.max(0.6, escala.ancho(t.desde, t.hasta))}%` }}
          />
        </InfoRapida>
      ))}
    </>
  );
}

// Movimientos que llenan la barra en esta línea. La suma por hora es solo para
// la escala del dibujo; ninguna cifra mostrada sale de aquí (D10).
function escalaBarras(porHora: readonly HoraDelDia[]): number {
  return Math.max(ESCALA_BARRA_HORA, ...porHora.map((h) => h.pagos + h.visitas + h.condonaciones));
}

function BarrasHora({ escala, eje, linea, etiquetaDia }: { escala: Escala; eje: Eje; linea: LineaDelDia; etiquetaDia?: string }) {
  const maximo = escalaBarras(linea.porHora);
  const horasEnEje = eje.hastaHora - eje.desdeHora;
  const altura = (n: number) => `${(n / maximo) * 100}%`;
  return (
    <>
      {linea.porHora.map((h) => (
        <InfoRapida key={h.hora} contenido={<TarjetaHora hora={h} etiquetaDia={etiquetaDia} />}>
          <span
            data-testid="barra-hora"
            className="absolute bottom-1.5 top-0 flex flex-col-reverse px-px"
            style={{ left: `${escala.posicionMinutos(h.hora * 60)}%`, width: `${100 / horasEnEje}%` }}
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
  escala,
  linea,
  ahora,
  pausaMin,
  nombrar,
  etiquetaDia,
}: {
  escala: Escala;
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
        style={{ left: `${escala.posicion(primero.hora)}%`, width: `${escala.ancho(primero.hora, ultimo)}%` }}
      />
      <Pausas escala={escala} pausas={linea.pausas} alto="completa" pausaMin={pausaMin} nombrar={nombrar} etiquetaDia={etiquetaDia} />
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
            style={{ left: `${escala.posicion(p.hora)}%` }}
          />
        </InfoRapida>
      ))}
    </>
  );
}
