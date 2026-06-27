import { useCallback, useEffect, useRef, useState } from "react";
import type { RollRate } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useCarteraPort } from "../context/CarteraContext";
import { obtenerRollRate } from "../../application/usecases/obtenerRollRate";
import type { CarteraFilters } from "../../application/dto/CarteraFilters";
import { toDomainError } from "./lib/toDomainError";

export type UseRollRateReturn = {
  rollRate: RollRate | null;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useRollRate fetches the deterioration indicator (signed scalar comparing the
// two most recent snapshot cuts). `disponible:false` means fewer than two cuts
// exist yet ("acumulando datos"). Mirrors useSaludCartera.
export function useRollRate(filters: CarteraFilters = {}): UseRollRateReturn {
  const port = useCarteraPort();
  const { zona, cobrador, periodo } = filters;

  const [rollRate, setRollRate] = useState<RollRate | null>(null);
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
    obtenerRollRate(port, { zona, cobrador, periodo }, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setRollRate(data);
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

  return { rollRate, isLoading, error, refresh };
}
