import { useCallback, useEffect, useRef, useState } from "react";
import type { DomainError } from "../../../domain/errors";
import { toDomainError } from "./toDomainError";

export type CargaRemota<T> = {
  datos: T | null;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

type Cargar<T> = (signal: AbortSignal) => Promise<T>;

// useCargaRemota ejecuta `cargar` y expone {datos, isLoading, error, refresh}.
//
// - Un `cargar` NUEVO (otra consulta: otro periodo, otro día, otro filtro)
//   borra los datos anteriores. Nunca se pintan datos de "hoy" bajo la etiqueta
//   "semana" mientras llega la respuesta.
// - `refresh` (la MISMA consulta, p. ej. la de cada minuto) conserva los datos
//   mientras recarga y también si la recarga falla: la falla queda en `error`
//   y la pantalla avisa sin vaciar la tabla.
// - La respuesta de una consulta vieja nunca pisa a la nueva (AbortController).
//
// El llamador debe memoizar `cargar` con useCallback.
export function useCargaRemota<T>(cargar: Cargar<T> | null): CargaRemota<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(cargar !== null);
  const [error, setError] = useState<DomainError | null>(null);
  const [tick, setTick] = useState(0);
  const cargarAnterior = useRef<Cargar<T> | null>(null);

  useEffect(() => {
    if (cargarAnterior.current !== cargar) {
      cargarAnterior.current = cargar;
      setDatos(null);
    }
    if (cargar === null) {
      setIsLoading(false);
      setError(null);
      return undefined;
    }
    const ctrl = new AbortController();
    setIsLoading(true);
    setError(null);
    cargar(ctrl.signal)
      .then((r) => {
        if (!ctrl.signal.aborted) setDatos(r);
      })
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted) setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });
    return () => ctrl.abort();
  }, [cargar, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { datos, isLoading, error, refresh };
}
