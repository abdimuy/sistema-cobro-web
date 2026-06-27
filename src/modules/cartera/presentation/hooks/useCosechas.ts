import { useCallback, useEffect, useRef, useState } from "react";
import type { Cosecha } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useCarteraPort } from "../context/CarteraContext";
import { obtenerCosechas } from "../../application/usecases/obtenerCosechas";
import type { CarteraFilters } from "../../application/dto/CarteraFilters";
import { toDomainError } from "./lib/toDomainError";

export type UseCosechasReturn = {
  cosechas: Cosecha[];
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useCosechas fetches vintage/cohort distribution data. Each row represents
// one cohort-month slice with its outstanding balance and account count.
// Mirrors useRollRate.
export function useCosechas(filters: CarteraFilters = {}): UseCosechasReturn {
  const port = useCarteraPort();
  const { zona, cobrador, periodo } = filters;

  const [cosechas, setCosechas] = useState<Cosecha[]>([]);
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
    obtenerCosechas(port, { zona, cobrador, periodo }, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setCosechas(data);
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

  return { cosechas, isLoading, error, refresh };
}
