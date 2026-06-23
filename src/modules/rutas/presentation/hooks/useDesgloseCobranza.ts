import { useEffect, useRef, useState } from "react";
import type { VentaCobranza } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useRutasPort } from "../context/RutasContext";
import { desgloseCobranza } from "../../application/usecases/desgloseCobranza";
import { toDomainError } from "./lib/toDomainError";

export type UseDesgloseCobranzaReturn = {
  ventas: ReadonlyArray<VentaCobranza>;
  fechaInicio: string | null;
  resumen: { numerador: string; denominador: number; pctPonderado: string | null };
  isLoading: boolean;
  error: DomainError | null;
};

// useDesgloseCobranza fetches the venta breakdown for a given zona.
// Pass zonaId=null to skip fetching (e.g. when no row is selected).
// AbortController aborts in-flight requests on zonaId change or unmount.
export function useDesgloseCobranza(
  zonaId: number | null,
): UseDesgloseCobranzaReturn {
  const port = useRutasPort();

  const [ventas, setVentas] = useState<ReadonlyArray<VentaCobranza>>([]);
  const [fechaInicio, setFechaInicio] = useState<string | null>(null);
  const [resumen, setResumen] = useState<{ numerador: string; denominador: number; pctPonderado: string | null }>({ numerador: "0", denominador: 0, pctPonderado: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (zonaId === null) {
      setVentas([]);
      setFechaInicio(null);
      setResumen({ numerador: "0", denominador: 0, pctPonderado: null });
      setIsLoading(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    desgloseCobranza(port, zonaId, ctrl.signal)
      .then((result) => {
        if (ctrl.signal.aborted) return;
        setVentas(result.ventas);
        setFechaInicio(result.fechaInicioSemana);
        setResumen(result.resumen);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [port, zonaId]);

  return { ventas, fechaInicio, resumen, isLoading, error };
}
