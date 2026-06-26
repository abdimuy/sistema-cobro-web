import { useEffect, useRef, useState } from "react";
import type { Benchmark, CohortBy } from "../../domain/entities/Benchmark";
import { DomainError } from "../../domain/errors";
import { useClientesPort } from "../context/ClientesContext";
import { obtenerBenchmark } from "../../application/usecases/obtenerBenchmark";
import { toDomainError } from "./lib/toDomainError";

export type UseBenchmarkReturn = {
  benchmark: Benchmark | null;
  isLoading: boolean;
  error: DomainError | null;
};

// useBenchmark fetches the peer benchmark for the given clienteId and cohortBy.
// Refetches on mount and whenever clienteId or cohortBy changes.
// Aborts the previous in-flight request when deps change or the component unmounts.
export function useBenchmark(
  clienteId: number,
  cohortBy: CohortBy,
): UseBenchmarkReturn {
  const port = useClientesPort();

  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    obtenerBenchmark(port, clienteId, cohortBy, ctrl.signal)
      .then((out) => {
        if (ctrl.signal.aborted) return;
        setBenchmark(out);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [port, clienteId, cohortBy]);

  return { benchmark, isLoading, error };
}
