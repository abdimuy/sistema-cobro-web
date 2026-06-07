import { useCallback, useEffect, useRef, useState } from "react";
import type { BlobPartsBundle } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useFailedIntentsPort } from "../context/FailedIntentsContext";
import { inspeccionarBlobParts } from "../../application/usecases/inspeccionarBlobParts";
import { descargarBlobPart } from "../../application/usecases/descargarBlobPart";

export type UseBlobPartsReturn = {
  bundle: BlobPartsBundle | null;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
  downloadPart: (index: number) => Promise<Blob>;
};

// useBlobParts loads the multipart structure for a blob intent. It
// fetches on mount + whenever intentId changes, with AbortController so
// a fast filter change can't show stale data.
//
// Pass `null` as intentId to keep the hook inert (e.g. while the
// inspector has no intent selected, or the selected intent is JSON).
export function useBlobParts(intentId: string | null): UseBlobPartsReturn {
  const port = useFailedIntentsPort();
  const [bundle, setBundle] = useState<BlobPartsBundle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);
  const [tick, setTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    if (!intentId) {
      setBundle(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    inspeccionarBlobParts(port, intentId, ctrl.signal)
      .then((b) => {
        if (ctrl.signal.aborted) return;
        setBundle(b);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(
          e instanceof DomainError
            ? e
            : new DomainError("error_inesperado", String(e)),
        );
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [port, intentId, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const downloadPart = useCallback(
    async (index: number) => {
      if (!intentId) {
        throw new DomainError(
          "intent_id_requerido",
          "no hay intento seleccionado",
        );
      }
      return descargarBlobPart(port, intentId, index);
    },
    [port, intentId],
  );

  return { bundle, isLoading, error, refresh, downloadPart };
}
