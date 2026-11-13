import { useEffect, useMemo, useState } from "react";
import type { CatalogosGarantias } from "../../domain/catalogos";
import { crearGarantiasPort } from "../composition/crearGarantiasPort";

export function useCatalogosGarantias() {
  const port = useMemo(() => crearGarantiasPort(), []);
  const [catalogos, setCatalogos] = useState<CatalogosGarantias | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void port.obtenerCatalogos(controller.signal)
      .then((resultado) => {
        if (!controller.signal.aborted) {
          setCatalogos(resultado);
        }
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : "Error al cargar catálogos");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      });

    return () => controller.abort();
  }, [port]);

  return { catalogos, cargando, error };
}
