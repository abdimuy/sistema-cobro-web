import { useEffect, useState, type ReactNode } from "react";
import { List } from "lucide-react";
import type { Actividad, Jornada, UsuarioTablero } from "../../domain/entities";
import { useJornada } from "../../presentation/hooks/useJornada";
import {
  diaDeNegocioDe,
  duracionCorta,
  fechaCorta,
  fechaLarga,
  horaCorta,
  plural,
  sumarDias,
} from "../lib/format";
import { ErrorConReintento, EstadoVacio } from "../comunes/Estados";
import { EstadoSinConfigurar } from "../ficha/EstadoSinConfigurar";
import { esErrorSinConfigurar } from "../ficha/sinConfigurar";
import type { AbrirVenta } from "./describirActividades";
import { NavegadorDia } from "./NavegadorDia";
import { EjeJornada } from "./EjeJornada";
import { ListaJornada } from "./ListaJornada";
import { MapaJornada } from "./MapaJornada";
import { ParaRevisar } from "./ParaRevisar";

export type JornadaTabProps = {
  usuario: UsuarioTablero;
  dia: string;
  hoy: string;
  onCambiarDia: (dia: string) => void;
  onAbrirActividad: (a: Actividad) => void;
  /** Abre el detalle de venta de Clientes con el `docto_pv_id` del API. */
  onAbrirVenta?: AbrirVenta;
  renderFotos?: (a: Actividad) => ReactNode;
  /**
   * Hueco para la LineaActividad (carril 1); lo llena la integración. `ahora`
   * es el `generado_at` de la jornada (contrato v2) en el día de hoy, y null en
   * días pasados.
   */
  renderLinea?: (jornada: Jornada, ahora: string | null) => ReactNode;
  /** Hueco para el selector "Vista" y la leyenda (carril 1). */
  controlesLinea?: ReactNode;
};

export function JornadaTab({
  usuario,
  dia,
  hoy,
  onCambiarDia,
  onAbrirActividad,
  onAbrirVenta,
  renderFotos,
  renderLinea,
  controlesLinea,
}: JornadaTabProps) {
  const esHoy = dia === hoy;
  const { jornada, isLoading, error, refresh } = useJornada(usuario.uid, dia, esHoy);
  const [resaltada, setResaltada] = useState<string | null>(null);

  // ← → cambian de día (mock), salvo dentro de un campo o con un modal abierto.
  useEffect(() => {
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const destino = e.target as HTMLElement | null;
      if (destino && /INPUT|SELECT|TEXTAREA/.test(destino.tagName)) return;
      if (document.querySelector("[role='dialog']")) return;
      if (e.key === "ArrowLeft") onCambiarDia(sumarDias(dia, -1));
      else if (dia < hoy) onCambiarDia(sumarDias(dia, 1));
    };
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  }, [dia, hoy, onCambiarDia]);

  const r = jornada?.resumen;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <NavegadorDia
          dia={dia}
          hoy={hoy}
          inicioSemanaDia={usuario.inicioSemana ? diaDeNegocioDe(usuario.inicioSemana) : null}
          onCambiar={onCambiarDia}
        />
        {controlesLinea}
        {jornada && r?.primeraActividad && (
          <span className="text-xs text-muted-foreground">
            {`${horaCorta(r.primeraActividad)} – ${esHoy || !r.ultimaActividad ? "ahora" : horaCorta(r.ultimaActividad)} · ${duracionCorta(r.minutosActivos)} activas · pausas de ${jornada.pausaMin} min o más`}
          </span>
        )}
      </div>

      {error && !jornada && esErrorSinConfigurar(error) && (
        <EstadoSinConfigurar mensaje={error.message} />
      )}
      {error && !jornada && !esErrorSinConfigurar(error) && (
        <ErrorConReintento
          titulo="No se pudo cargar la jornada"
          mensaje={error.message}
          onReintentar={refresh}
        />
      )}
      {error && jornada && (
        <div
          role="status"
          className="self-start rounded-full bg-dsm-ambar-fondo px-4 py-1.5 text-xs text-dsm-ambar"
        >
          {`No se pudo actualizar · datos de las ${horaCorta(jornada.generadoAt)}`}
        </div>
      )}
      {isLoading && !jornada && (
        <div className="h-48 animate-pulse rounded-[14px] bg-dsm-tarjeta" />
      )}

      {jornada && (
        <>
          {jornada.actividades.length === 0 ? (
            <div className="rounded-[14px] bg-dsm-tarjeta ring-1 ring-border">
              <EstadoVacio
                titulo={esHoy ? "Sin actividad hoy" : "Sin actividad este día"}
                detalle={
                  usuario.ultimaActividad
                    ? `Su último movimiento fue el ${fechaCorta(diaDeNegocioDe(usuario.ultimaActividad))} a las ${horaCorta(usuario.ultimaActividad)}.`
                    : undefined
                }
              />
            </div>
          ) : (
            <EjeJornada
              jornada={jornada}
              linea={renderLinea?.(jornada, esHoy ? jornada.generadoAt : null)}
              onAbrirActividad={onAbrirActividad}
            />
          )}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
            {jornada.actividades.length > 0 && (
              <div className="rounded-[14px] bg-dsm-tarjeta shadow-sm ring-1 ring-border">
                <div className="flex items-center justify-between gap-3 px-[18px] py-3">
                  <h3 className="flex items-center gap-2 text-[13px] font-medium">
                    <List aria-hidden className="h-3.5 w-3.5" />
                    Movimientos en orden
                  </h3>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {`${plural(jornada.resumen.pagos.n, "pago", "pagos")} · ${plural(jornada.resumen.visitas, "visita", "visitas")} · ${plural(jornada.resumen.condonaciones, "condonación", "condonaciones")}`}
                  </span>
                </div>
                <ListaJornada
                  actividades={jornada.actividades}
                  pausas={jornada.linea.pausas}
                  resaltada={resaltada}
                  onAbrir={onAbrirActividad}
                  onAbrirVenta={onAbrirVenta}
                  renderFotos={renderFotos}
                />
              </div>
            )}
            <div className="flex flex-col gap-4">
              {jornada.actividades.length > 0 && (
                <MapaJornada
                  actividades={jornada.actividades}
                  etiquetaDia={fechaLarga(dia)}
                  onSeleccionar={setResaltada}
                />
              )}
              <ParaRevisar senales={jornada.senales} onSeleccionar={setResaltada} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
