import { useCallback, useEffect, useRef, useState } from "react";
import {
  LIMITE_PAGINA_ACTIVIDAD,
  type Actividad,
  type Catalogos,
  type FiltrosActividad,
  type TotalesActividad,
} from "../../domain/entities";
import type { DomainError } from "../../domain/errors";
import { listarActividad, obtenerCatalogos } from "../../application/usecases/consultas";
import { useDesempenoPort } from "../context/useDesempenoPort";
import { toDomainError } from "./lib/toDomainError";
import { useCargaRemota } from "./lib/useCargaRemota";

export type UseActividadReturn = {
  items: readonly Actividad[];
  totales: TotalesActividad | null;
  hayMas: boolean;
  isLoading: boolean;
  isLoadingMas: boolean;
  error: DomainError | null;
  cargarMas: () => void;
  refresh: () => void;
};

// useActividad pagina GET .../actividad por cursor (contrato §4). Los totales
// son del filtro completo y vienen con la primera página: no se recalculan al
// cargar más (D10). `generacion` descarta respuestas de filtros viejos.
// El llamador memoiza `filtros` (un objeto nuevo = una consulta nueva).
export function useActividad(uid: string, filtros: FiltrosActividad): UseActividadReturn {
  const port = useDesempenoPort();
  const [items, setItems] = useState<readonly Actividad[]>([]);
  const [totales, setTotales] = useState<TotalesActividad | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMas, setIsLoadingMas] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);
  const [tick, setTick] = useState(0);
  const generacion = useRef(0);
  // "Cargar más" en vuelo: su AbortController. La ref (y no el estado) evita
  // que dos clics en el mismo instante pidan la misma página dos veces.
  const masEnVuelo = useRef<AbortController | null>(null);

  useEffect(() => {
    const gen = ++generacion.current;
    const ctrl = new AbortController();
    masEnVuelo.current?.abort();
    masEnVuelo.current = null;
    setItems([]);
    setTotales(null);
    setCursor(null);
    setIsLoading(true);
    setIsLoadingMas(false);
    setError(null);
    listarActividad(
      port,
      uid,
      filtros,
      { cursor: null, limit: LIMITE_PAGINA_ACTIVIDAD },
      ctrl.signal,
    )
      .then((p) => {
        if (gen !== generacion.current) return;
        setItems(p.items);
        setTotales(p.totales);
        setCursor(p.siguienteCursor);
      })
      .catch((e: unknown) => {
        if (gen === generacion.current) setError(toDomainError(e));
      })
      .finally(() => {
        if (gen === generacion.current) setIsLoading(false);
      });
    return () => ctrl.abort();
  }, [port, uid, filtros, tick]);

  const cargarMas = useCallback(() => {
    if (cursor === null || masEnVuelo.current !== null) return;
    const gen = generacion.current;
    const ctrl = new AbortController();
    masEnVuelo.current = ctrl;
    setIsLoadingMas(true);
    setError(null);
    listarActividad(port, uid, filtros, { cursor, limit: LIMITE_PAGINA_ACTIVIDAD }, ctrl.signal)
      .then((p) => {
        if (gen !== generacion.current || ctrl.signal.aborted) return;
        setItems((previos) => [...previos, ...p.items]);
        setCursor(p.siguienteCursor);
      })
      .catch((e: unknown) => {
        if (gen === generacion.current && !ctrl.signal.aborted) setError(toDomainError(e));
      })
      .finally(() => {
        if (masEnVuelo.current === ctrl) masEnVuelo.current = null;
        if (gen === generacion.current) setIsLoadingMas(false);
      });
  }, [port, uid, filtros, cursor]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return {
    items,
    totales,
    hayMas: cursor !== null,
    isLoading,
    isLoadingMas,
    error,
    cargarMas,
    refresh,
  };
}

// useCatalogos: valores de los filtros de forma de cobro y tipo de visita
// (GET /v2/desempeno/catalogos, contrato v2 §4b). El escritorio no copia
// catálogos: si no llegan, esos filtros quedan sin opciones.
export function useCatalogos(): {
  catalogos: Catalogos | null;
  error: DomainError | null;
} {
  const port = useDesempenoPort();
  const cargar = useCallback((signal: AbortSignal) => obtenerCatalogos(port, signal), [port]);
  const { datos, error } = useCargaRemota(cargar);
  return { catalogos: datos, error };
}
