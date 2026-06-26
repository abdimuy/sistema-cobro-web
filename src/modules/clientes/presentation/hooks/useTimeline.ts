import { useEffect, useRef, useState } from "react";
import type { EventoTimeline } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useClientesPort } from "../context/ClientesContext";
import { obtenerTimeline } from "../../application/usecases/obtenerTimeline";
import { toDomainError } from "./lib/toDomainError";

export type UseTimelineReturn = {
  timeline: EventoTimeline[];
  isLoading: boolean;
  error: DomainError | null;
};

export function useTimeline(clienteId: number): UseTimelineReturn {
  const port = useClientesPort();

  const [timeline, setTimeline] = useState<EventoTimeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<DomainError | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    obtenerTimeline(port, clienteId, ctrl.signal)
      .then((out) => {
        if (ctrl.signal.aborted) return;
        setTimeline(out);
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

  return { timeline, isLoading, error };
}
