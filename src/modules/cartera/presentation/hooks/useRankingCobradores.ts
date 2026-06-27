import { useCallback, useEffect, useRef, useState } from "react";
import type { CobradorPerformance } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useCarteraPort } from "../context/CarteraContext";
import { obtenerRankingCobradores } from "../../application/usecases/obtenerRankingCobradores";
import type { CarteraFilters } from "../../application/dto/CarteraFilters";
import { toDomainError } from "./lib/toDomainError";

export type UseRankingCobradoresReturn = {
  cobradores: CobradorPerformance[];
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

export function useRankingCobradores(filters: CarteraFilters = {}): UseRankingCobradoresReturn {
  const port = useCarteraPort();
  const { zona, cobrador, periodo } = filters;

  const [cobradores, setCobradores] = useState<CobradorPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);
  const [tick, setTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    obtenerRankingCobradores(port, { zona, cobrador, periodo }, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setCobradores(data);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [port, zona, cobrador, periodo, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { cobradores, isLoading, error, refresh };
}
