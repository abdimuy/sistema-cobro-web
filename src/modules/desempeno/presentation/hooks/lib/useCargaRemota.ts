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
// - `refresh` con una petición en curso no hace nada: ni la aborta ni lanza
//   otra. Si la consulta tarda más de un minuto, el tick de cada 60 s no la
//   reinicia y la pantalla termina cargando.
// - Durante el reintento de una recarga fallida el error se conserva (el aviso
//   no parpadea); se limpia al llegar datos o al cambiar de consulta.
//
// El llamador debe memoizar `cargar` con useCallback.
export function useCargaRemota<T>(cargar: Cargar<T> | null): CargaRemota<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(cargar !== null);
  const [error, setError] = useState<DomainError | null>(null);
  const [tick, setTick] = useState(0);
  const cargarAnterior = useRef<Cargar<T> | null>(null);
  // Petición en curso (su AbortController) o null si no hay ninguna.
  const enVuelo = useRef<AbortController | null>(null);

  useEffect(() => {
    if (cargarAnterior.current !== cargar) {
      cargarAnterior.current = cargar;
      setDatos(null);
      setError(null);
    }
    if (cargar === null) {
      enVuelo.current = null;
      setIsLoading(false);
      return undefined;
    }
    const ctrl = new AbortController();
    enVuelo.current = ctrl;
    setIsLoading(true);
    cargar(ctrl.signal)
      .then((r) => {
        if (ctrl.signal.aborted) return;
        setDatos(r);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted) setError(toDomainError(e));
      })
      .finally(() => {
        if (enVuelo.current === ctrl) enVuelo.current = null;
        if (!ctrl.signal.aborted) setIsLoading(false);
      });
    return () => {
      if (enVuelo.current === ctrl) enVuelo.current = null;
      ctrl.abort();
    };
  }, [cargar, tick]);

  const refresh = useCallback(() => {
    if (enVuelo.current !== null) return;
    setTick((t) => t + 1);
  }, []);
  return { datos, isLoading, error, refresh };
}
