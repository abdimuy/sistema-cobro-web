import { useEffect, useRef, useState } from "react";
import type { Predicciones } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useClientesPort } from "../context/ClientesContext";
import { obtenerPredicciones } from "../../application/usecases/obtenerPredicciones";
import { toDomainError } from "./lib/toDomainError";

export type UsePrediccionesReturn = {
  predicciones: Predicciones | null;
  isLoading: boolean;
  error: DomainError | null;
};

// usePredicciones fetches the bayesian predictions for the given clienteId.
// Fetches on mount and when clienteId changes. Uses AbortController to cancel
// in-flight requests when deps change or the component unmounts.
export function usePredicciones(clienteId: number): UsePrediccionesReturn {
  const port = useClientesPort();

  const [predicciones, setPredicciones] = useState<Predicciones | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    obtenerPredicciones(port, clienteId, ctrl.signal)
      .then((out) => {
        if (ctrl.signal.aborted) return;
        setPredicciones(out);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [port, clienteId]);

  return { predicciones, isLoading, error };
}
