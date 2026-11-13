import { useEffect, useMemo, useState } from "react";
import type {
  DetalleGarantia,
  FiltrosGarantias,
  PaginaGarantias,
} from "../../domain/garantia";
import { crearGarantiasPort } from "../composition/crearGarantiasPort";

function mensajeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "No se pudo completar la consulta.";
}

export function useBandejaGarantias(
  filtros: FiltrosGarantias,
  cursor?: string,
) {
  const port = useMemo(() => crearGarantiasPort(), []);
  const [pagina, setPagina] = useState<PaginaGarantias | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    estado, origen, cliente_id, etapa, ubicacion, desde, hasta,
  } = filtros;

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError(null);
    setPagina(null);

    void port.listar(
      { estado, origen, cliente_id, etapa, ubicacion, desde, hasta },
      { limit: 20, cursor },
      controller.signal,
    ).then((resultado) => {
      if (!controller.signal.aborted) setPagina(resultado);
    }).catch((e: unknown) => {
      if (!controller.signal.aborted) setError(mensajeError(e));
    }).finally(() => {
      if (!controller.signal.aborted) setCargando(false);
    });

    return () => controller.abort();
  }, [port, estado, origen, cliente_id, etapa, ubicacion, desde, hasta, cursor]);

  return { pagina, cargando, error };
}

export function useDetalleGarantia(id: string | null, revision = 0) {
  const port = useMemo(() => crearGarantiasPort(), []);
  const [detalle, setDetalle] = useState<DetalleGarantia | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setDetalle(null);
      setError(null);
      setCargando(false);
      return;
    }

    const controller = new AbortController();
    setDetalle(null);
    setError(null);
    setCargando(true);

    void port.obtener(id, controller.signal).then((resultado) => {
      if (!controller.signal.aborted) setDetalle(resultado);
    }).catch((e: unknown) => {
      if (!controller.signal.aborted) setError(mensajeError(e));
    }).finally(() => {
      if (!controller.signal.aborted) setCargando(false);
    });

    return () => controller.abort();
  }, [id, port, revision]);

  return { detalle, cargando, error };
}
