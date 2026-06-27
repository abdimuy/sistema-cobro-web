import { useCallback, useEffect, useRef, useState } from "react";
import type { SaludCartera } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useCarteraPort } from "../context/CarteraContext";
import { obtenerSaludCartera } from "../../application/usecases/obtenerSaludCartera";
import type { CarteraFilters } from "../../application/dto/CarteraFilters";
import { toDomainError } from "./lib/toDomainError";

export type UseSaludCarteraReturn = {
  salud: SaludCartera | null;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useSaludCartera fetches salud de cartera applying the provided filters.
// Filter primitives (not the object reference) are used as deps to avoid
// infinite effect loops when the caller passes an inline literal.
export function useSaludCartera(
  filters: CarteraFilters = {},
): UseSaludCarteraReturn {
  const port = useCarteraPort();
  const { zona, cobrador, periodo } = filters;

  const [salud, setSalud] = useState<SaludCartera | null>(null);
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
    obtenerSaludCartera(port, { zona, cobrador, periodo }, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setSalud(data);
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

  return { salud, isLoading, error, refresh };
}
