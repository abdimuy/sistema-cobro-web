import { useCallback, useEffect, useRef, useState } from "react";
import type { ConversacionDetalle } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useBandeja } from "../context/BandejaContext";
import { toDomainError } from "./lib/toDomainError";

export type UseConversacionReturn = {
  detalle: ConversacionDetalle | null;
  loading: boolean;
  error: DomainError | null;
  refetch: () => void;
};

// useConversacion fetches the ficha for the selected cliente. It stays
// null (and does not fetch) while clienteId is null — the conversation
// column has nothing selected yet. AbortController cancels any in-flight
// request when clienteId changes or on unmount.
export function useConversacion(clienteId: number | null): UseConversacionReturn {
  const { port } = useBandeja();

  const [detalle, setDetalle] = useState<ConversacionDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);
  // Tick increments to force a re-fetch on refetch().
  const [tick, setTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    if (clienteId == null) {
      setDetalle(null);
      setLoading(false);
      setError(null);
      return;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    port
      .obtenerConversacion(clienteId, ctrl.signal)
      .then((result) => {
        if (ctrl.signal.aborted) return;
        setDetalle(result);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [port, clienteId, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { detalle, loading, error, refetch };
}
