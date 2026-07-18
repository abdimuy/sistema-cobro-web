import { useEffect, useRef, useState } from "react";
import type { IdentidadMicrosip } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useConfiguracionPort } from "../context/ConfiguracionContext";
import { listarOpcionesVendedor } from "../../application/usecases/listarOpcionesVendedor";
import { toDomainError } from "./lib/toDomainError";

export type UseOpcionesVendedorReturn = {
  opciones: ReadonlyArray<IdentidadMicrosip>;
  isLoading: boolean;
  error: DomainError | null;
};

// useOpcionesVendedor fetches the Microsip vendor identities list once on
// mount. Unlike useVendedores there's no refresh() — the identity catalog
// doesn't change while the admin is assigning mappings in this screen.
export function useOpcionesVendedor(): UseOpcionesVendedorReturn {
  const port = useConfiguracionPort();

  const [opciones, setOpciones] = useState<ReadonlyArray<IdentidadMicrosip>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<DomainError | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    listarOpcionesVendedor(port, ctrl.signal)
      .then((result) => {
        if (ctrl.signal.aborted) return;
        setOpciones(result);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [port]);

  return { opciones, isLoading, error };
}
