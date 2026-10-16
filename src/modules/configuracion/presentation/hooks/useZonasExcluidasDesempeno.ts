import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ZonaExcluidaDesempeno } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useConfiguracionPort } from "../context/ConfiguracionContext";
import { listarZonasExcluidasDesempeno } from "../../application/usecases/listarZonasExcluidasDesempeno";
import { excluirZonaDesempeno } from "../../application/usecases/excluirZonaDesempeno";
import { quitarZonaExcluidaDesempeno } from "../../application/usecases/quitarZonaExcluidaDesempeno";
import { toDomainError } from "./lib/toDomainError";

export type UseZonasExcluidasDesempenoReturn = {
  zonas: ReadonlyArray<ZonaExcluidaDesempeno>;
  isLoading: boolean;
  error: DomainError | null;
  guardando: boolean;
  errorAccion: DomainError | null;
  excluir: (zonaId: number) => Promise<boolean>;
  quitar: (zonaId: number) => Promise<boolean>;
  limpiarErrorAccion: () => void;
};

// useZonasExcluidasDesempeno lee la lista y expone excluir/quitar. La lista
// se vuelve a leer SOLO después de que el servidor responde: nunca hay
// actualización optimista, así la pantalla muestra lo persistido.
export function useZonasExcluidasDesempeno(): UseZonasExcluidasDesempenoReturn {
  const port = useConfiguracionPort();

  const [zonas, setZonas] = useState<ReadonlyArray<ZonaExcluidaDesempeno>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<DomainError | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<DomainError | null>(null);
  const [tick, setTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setError(null);
    listarZonasExcluidasDesempeno(port, ctrl.signal)
      .then((r) => {
        if (!ctrl.signal.aborted) setZonas(r);
      })
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted) setError(toDomainError(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setIsLoading(false);
      });

    return () => ctrl.abort();
  }, [port, tick]);

  const ejecutar = useCallback(async (accion: () => Promise<unknown>, ok: string, mal: string) => {
    setGuardando(true);
    setErrorAccion(null);
    try {
      await accion();
      setTick((t) => t + 1);
      toast.success(ok);
      return true;
    } catch (e) {
      const err = toDomainError(e);
      setErrorAccion(err);
      toast.error(mal, { description: err.message });
      return false;
    } finally {
      setGuardando(false);
    }
  }, []);

  const excluir = useCallback(
    (zonaId: number) =>
      ejecutar(() => excluirZonaDesempeno(port, zonaId), "Zona excluida", "No se pudo excluir"),
    [port, ejecutar],
  );
  const quitar = useCallback(
    (zonaId: number) =>
      ejecutar(() => quitarZonaExcluidaDesempeno(port, zonaId), "Zona incluida", "No se pudo quitar"),
    [port, ejecutar],
  );
  const limpiarErrorAccion = useCallback(() => setErrorAccion(null), []);

  return { zonas, isLoading, error, guardando, errorAccion, excluir, quitar, limpiarErrorAccion };
}
