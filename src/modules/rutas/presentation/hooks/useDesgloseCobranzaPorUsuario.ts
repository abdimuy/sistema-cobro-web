import { useEffect, useRef, useState } from "react";
import type { VentaCobranza } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useRutasPort } from "../context/RutasContext";
import { desgloseCobranzaPorUsuario } from "../../application/usecases/desgloseCobranzaPorUsuario";
import { toDomainError } from "./lib/toDomainError";

export type UseDesgloseCobranzaPorUsuarioReturn = {
  ventas: ReadonlyArray<VentaCobranza>;
  fechaInicio: string | null;
  resumen: { numerador: string; denominador: number; pctPonderado: string | null };
  isLoading: boolean;
  error: DomainError | null;
};

// useDesgloseCobranzaPorUsuario fetches the venta breakdown for a given user.
// Pass uid=null to skip fetching (e.g. when no row is selected).
// AbortController aborts in-flight requests on uid change or unmount.
export function useDesgloseCobranzaPorUsuario(
  uid: string | null,
): UseDesgloseCobranzaPorUsuarioReturn {
  const port = useRutasPort();

  const [ventas, setVentas] = useState<ReadonlyArray<VentaCobranza>>([]);
  const [fechaInicio, setFechaInicio] = useState<string | null>(null);
  const [resumen, setResumen] = useState<{ numerador: string; denominador: number; pctPonderado: string | null }>({ numerador: "0", denominador: 0, pctPonderado: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (uid === null) {
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
    desgloseCobranzaPorUsuario(port, uid, ctrl.signal)
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
  }, [port, uid]);

  return { ventas, fechaInicio, resumen, isLoading, error };
}
