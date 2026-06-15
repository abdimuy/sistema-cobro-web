import { useCallback, useState } from "react";
import type { RefreshResult } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useWinbackPort } from "../context/WinbackContext";
import { refrescarWinback } from "../../application/usecases/refrescarWinback";

export type UseRefrescarWinbackReturn = {
  refrescar: (full?: boolean) => Promise<RefreshResult | null>;
  isLoading: boolean;
  result: RefreshResult | null;
  error: DomainError | null;
};

// useRefrescarWinback is an imperative hook — it does NOT auto-fetch on mount.
// Call `refrescar(full?)` to trigger a cache refresh. `full` defaults to false.
export function useRefrescarWinback(): UseRefrescarWinbackReturn {
  const port = useWinbackPort();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RefreshResult | null>(null);
  const [error, setError] = useState<DomainError | null>(null);

  const refrescar = useCallback(
    async (full: boolean = false): Promise<RefreshResult | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const out = await refrescarWinback(port, { full });
        setResult(out);
        return out;
      } catch (e: unknown) {
        setError(toDomainError(e));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [port],
  );

  return { refrescar, isLoading, result, error };
}

function toDomainError(e: unknown): DomainError {
  if (e instanceof DomainError) return e;
  if (e instanceof Error) return new DomainError("error_inesperado", e.message);
  return new DomainError("error_inesperado", String(e));
}
