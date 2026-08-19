import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import type { VentaLocal } from "@/services/api/getVentasLocales";
import { useVentaEventos } from "../presentation/hooks/useVentaEventos";
import { FaseAnillo } from "./FaseAnillo";
import { deriveFase, fechaCorta, type Fase } from "./fase";
import { faseHitos } from "./faseHitos";
import { trazoDeFase } from "./fasePaleta";

/** El cursor tiene que detenerse: pasar por encima no dispara la petición. */
const RETARDO_HOVER_MS = 180;

interface Props {
  venta: VentaLocal;
  /** En densidad compacta el anillo baja a 18 px y se pliega el 2º renglón. */
  compact?: boolean;
}

export function FaseCell({ venta, compact = false }: Props) {
  const fase = useMemo(() => deriveFase(venta), [venta]);
  const [abierto, setAbierto] = useState(false);
  const [ancla, setAncla] = useState<{ left: number; top: number } | null>(null);
  const disparadorRef = useRef<HTMLDivElement>(null);
  const temporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();

  const cancelarRetardo = () => {
    if (temporizadorRef.current !== null) {
      clearTimeout(temporizadorRef.current);
      temporizadorRef.current = null;
    }
  };

  const abrir = useCallback(() => {
    const rect = disparadorRef.current?.getBoundingClientRect();
    setAncla(rect ? { left: rect.left, top: rect.bottom + 6 } : { left: 0, top: 0 });
    setAbierto(true);
  }, []);

  const cerrar = useCallback(() => {
    cancelarRetardo();
    setAbierto(false);
  }, []);

  useEffect(() => cancelarRetardo, []);

  const alEntrar = () => {
    cancelarRetardo();
    temporizadorRef.current = setTimeout(abrir, RETARDO_HOVER_MS);
  };

  const alTeclear = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && abierto) {
      e.stopPropagation();
      cerrar();
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      if (abierto) cerrar();
      else abrir();
    }
  };

  const etiqueta = [
    `Fase: ${fase.nombre}`,
    fase.meta,
    fase.detenida ? "detenida" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div
        ref={disparadorRef}
        role="button"
        tabIndex={0}
        aria-label={etiqueta}
        aria-expanded={abierto}
        aria-controls={abierto ? panelId : undefined}
        onMouseEnter={alEntrar}
        onMouseLeave={cerrar}
        onFocus={abrir}
        onBlur={cerrar}
        onKeyDown={alTeclear}
        className="flex min-w-0 items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <FaseAnillo fase={fase} size={compact ? 18 : 26} />
        <FaseCifra fase={fase} />
        <div className="flex min-w-0 flex-col gap-px">
          <span
            className={cn(
              "truncate text-[12.5px] leading-tight",
              fase.enCarril
                ? "font-medium text-foreground"
                : "font-normal text-muted-foreground",
              fase.kind === "eliminada" && "line-through"
            )}
          >
            {fase.nombre}
            {compact && fase.metaCompacta && (
              <span
                data-testid="fase-meta-compacta"
                // Mismo criterio que el 2º renglón en densidad normal: detenida
                // se dice con peso y brillo, no con un hue que ya es de una fase.
                className="ml-1.5 text-[10px] font-medium tabular-nums text-foreground"
              >
                {fase.metaCompacta}
              </span>
            )}
          </span>
          {!compact && fase.meta && (
            <span
              data-testid="fase-meta"
              className={cn(
                "truncate font-mono text-[10.5px] leading-tight tabular-nums",
                // Detenida ya no se dice con un color: el ámbar que usaba es
                // el de la fase *revisada*. Se dice con contraste de peso y
                // brillo, que no le roba el hue a ninguna fase.
                fase.detenida ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {fase.meta}
            </span>
          )}
        </div>
      </div>

      {abierto &&
        createPortal(
          <div
            id={panelId}
            role="tooltip"
            style={{ position: "fixed", left: ancla?.left ?? 0, top: ancla?.top ?? 0 }}
            className="z-50 w-[268px] rounded-lg border border-border bg-popover p-4 shadow-lg animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none"
          >
            <FasePanel ventaID={venta.LOCAL_SALE_ID} fase={fase} />
          </div>,
          document.body
        )}
    </>
  );
}

/**
 * La cifra de la fase, fuera del anillo.
 *
 * Adentro era ilegible a 26 px: un dígito centrado en un aro de ese tamaño se
 * lee como mancha. Aquí va monoespaciada y con cifras tabulares, en un
 * ancho fijo alineado a la derecha para que los nombres de todas las filas
 * arranquen en el mismo eje. Las salidas del carril (cancelada / eliminada) no
 * tienen número: llevan la raya em, atenuada.
 *
 * COLOR. Sale de `trazoDeFase`, la misma función que pinta el anillo: cifra y
 * aro son el mismo dato dicho dos veces y no pueden discrepar de tono. Estar
 * detenida NO lo cambia — eso se ve en la pista punteada del anillo y en el
 * peso del segundo renglón.
 */
function FaseCifra({ fase }: { fase: Fase }) {
  return (
    <span
      data-testid="fase-cifra"
      aria-hidden="true"
      className={cn(
        "w-2 flex-none text-right font-mono text-[12px] font-semibold leading-none tabular-nums",
        trazoDeFase(fase)
      )}
    >
      {fase.numero ?? "—"}
    </span>
  );
}

/**
 * El expediente. Se monta sólo cuando el panel se abre — por eso la tabla no
 * dispara cien peticiones al cargar — y al desmontarse el hook aborta la que
 * siguiera en vuelo.
 */
function FasePanel({ ventaID, fase }: { ventaID: string; fase: Fase }) {
  const { eventos, isLoading, error } = useVentaEventos(ventaID);
  const hitos = useMemo(() => faseHitos(eventos), [eventos]);

  return (
    <div>
      <p className="mb-3.5 text-[10.5px] uppercase tracking-[0.11em] text-muted-foreground">
        Bitácora
      </p>

      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <p className="text-[11.5px] text-muted-foreground">Cargando bitácora</p>
          <div className="h-2 w-3/4 rounded bg-muted animate-pulse motion-reduce:animate-none" />
          <div className="h-2 w-1/2 rounded bg-muted animate-pulse motion-reduce:animate-none" />
        </div>
      ) : error ? (
        <div className="space-y-1">
          <p className="text-[11.5px] text-foreground">No se pudo leer la bitácora</p>
          <p className="text-[11px] text-muted-foreground">{error}</p>
        </div>
      ) : hitos.length === 0 ? (
        <p className="text-[11.5px] text-muted-foreground">Sin eventos registrados</p>
      ) : (
        <FaseHitosLista hitos={hitos} fase={fase} />
      )}
    </div>
  );
}

function FaseHitosLista({
  hitos,
  fase,
}: {
  hitos: ReturnType<typeof faseHitos>;
  fase: Fase;
}) {
  // El último hito con fecha es donde la venta se quedó: de ahí sale la línea
  // punteada cuando está detenida.
  let ultimoAlcanzado = -1;
  hitos.forEach((h, i) => {
    if (h.fecha !== null) ultimoAlcanzado = i;
  });

  return (
    <ol className="grid grid-cols-[11px_1fr_auto] gap-x-3" aria-label="Línea de tiempo de la venta">
      {hitos.map((hito, i) => {
        const esUltimo = i === hitos.length - 1;
        const alcanzado = hito.fecha !== null;
        const detenidaAqui = fase.detenida && i === ultimoAlcanzado;

        return (
          <li key={hito.clave} className="contents">
            <span className="relative flex justify-center" aria-hidden="true">
              <span
                className={cn(
                  "mt-[5px] h-[7px] w-[7px] flex-none rounded-full",
                  alcanzado
                    ? "bg-foreground"
                    : "bg-transparent shadow-[inset_0_0_0_1.5px_hsl(var(--border))]"
                )}
              />
              {!esUltimo && (
                <span
                  className={cn(
                    "absolute bottom-[-6px] top-3 w-px",
                    detenidaAqui
                      ? // Lo punteado ya es la señal: el color se queda en el borde.
                        "bg-[linear-gradient(hsl(var(--border))_50%,transparent_0)] bg-[length:1px_4px]"
                      : "bg-border"
                  )}
                />
              )}
            </span>
            <span
              className={cn(
                "pb-3 text-[12.5px] leading-tight",
                alcanzado ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {hito.nombre}
            </span>
            <span
              className={cn(
                "pt-px font-mono text-[11px] tabular-nums",
                detenidaAqui ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {hito.fecha ? fechaCorta(hito.fecha.toISOString()) : "—"}
              {detenidaAqui && fase.diasEnFase !== null && ` · ${fase.diasEnFase} d`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
