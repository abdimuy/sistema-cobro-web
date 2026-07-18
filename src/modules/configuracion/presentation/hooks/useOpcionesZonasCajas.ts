import { useEffect, useRef, useState } from "react";
import type { OpcionesZonasCajas } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useConfiguracionPort } from "../context/ConfiguracionContext";
import { listarOpcionesZonasCajas } from "../../application/usecases/listarOpcionesZonasCajas";
import { toDomainError } from "./lib/toDomainError";

export type UseOpcionesZonasCajasReturn = {
  opciones: OpcionesZonasCajas;
  isLoading: boolean;
  error: DomainError | null;
};

const EMPTY_OPCIONES: OpcionesZonasCajas = {
  zonas: [],
  cajas: [],
  cajeros: [],
  vendedores: [],
  cobradores: [],
};

// useOpcionesZonasCajas fetches the 5 Microsip catalogs once on mount.
// Unlike useZonasCajas there's no refresh() — the catalogs don't change
// while the admin is assigning zone config in this screen.
export function useOpcionesZonasCajas(): UseOpcionesZonasCajasReturn {
  const port = useConfiguracionPort();

  const [opciones, setOpciones] = useState<OpcionesZonasCajas>(EMPTY_OPCIONES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<DomainError | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    listarOpcionesZonasCajas(port, ctrl.signal)
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
