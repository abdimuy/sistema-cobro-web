import { useCallback, useEffect, useRef, useState } from "react";
import type { VentaLocal, VentasParams } from "../../../../services/api/getVentasLocales";
import { DomainError } from "../../domain/errors";
import { useVentasListPort } from "../context/VentasListContext";
import { buscarVentas } from "../../application/usecases/buscarVentas";
import type { BuscarVentasInput, SortByVenta } from "../../application/dto/BuscarVentasInput";

// ============================================================================
// Types — kept IDENTICAL to the legacy useGetVentasLocales return contract so
// VentasLocales.tsx / VentasTable / VentasFilters keep working unchanged.
// ============================================================================

export interface UseVentasState {
  ventas: VentaLocal[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

export interface UseVentasActions {
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  setParams: (params: Partial<VentasParams>) => void;
  updateSort: (sortBy: VentasParams["sortBy"], sortOrder?: VentasParams["sortOrder"]) => void;
}

export type UseVentasReturn = UseVentasState &
  UseVentasActions & {
    params: VentasParams;
    hasMore: boolean;
  };

const DEFAULT_LIMIT = 50;

// SORT_BY_MAP translates the legacy (camelCase) UI sort keys into the pinned
// backend sort_by values. ciudad/tipoVenta have no backend column to sort by
// — mapping to undefined drops sort_by entirely, so the backend falls back
// to its default ordering instead of receiving an invalid value.
const SORT_BY_MAP: Partial<Record<NonNullable<VentasParams["sortBy"]>, SortByVenta>> = {
  fechaVenta: "fecha_venta",
  nombreCliente: "nombre_cliente",
  precioTotal: "precio_total",
};

function toBuscarVentasInput(params: VentasParams, cursor?: string): BuscarVentasInput {
  const sortBy = params.sortBy !== undefined ? SORT_BY_MAP[params.sortBy] : undefined;
  return {
    ...(params.search !== undefined && { search: params.search }),
    ...(params.tipoVenta !== undefined && { tipoVenta: params.tipoVenta }),
    ...(params.situacion !== undefined && { situacion: params.situacion }),
    ...(params.sincronizacion !== undefined && { sincronizacion: params.sincronizacion }),
    ...(params.zonaClienteId !== undefined && { zonaClienteId: params.zonaClienteId }),
    ...(params.precioMin !== undefined && { precioMin: params.precioMin }),
    ...(params.precioMax !== undefined && { precioMax: params.precioMax }),
    ...(params.fechaInicio !== undefined && { fechaInicio: params.fechaInicio }),
    ...(params.fechaFin !== undefined && { fechaFin: params.fechaFin }),
    ...(params.incluirCanceladas !== undefined && { incluirCanceladas: params.incluirCanceladas }),
    ...(sortBy !== undefined && { sortBy }),
    ...(params.sortOrder !== undefined && { sortOrder: params.sortOrder }),
    ...(cursor !== undefined && { cursor }),
    ...(params.limit !== undefined && { limit: params.limit }),
    // almacenId, vendedorEmails, enviado, includeTotal and the per-field text
    // filters (nombreCliente/telefono/direccion/ciudad/colonia/poblacion) have
    // no backend equivalent (subsumed by `search`, or simply unsupported) and
    // are intentionally never forwarded.
  };
}

function toErrorMessage(e: unknown): string {
  if (e instanceof DomainError) return e.message;
  if (e instanceof Error) return e.message;
  return "Error al cargar ventas";
}

// useBuscarVentas fetches the paginated ventas-locales list with infinite
// scroll. It replaces the broken useGetVentasLocales (which dropped ~12 of
// the ~20 filters and never wired its AbortController signal) while keeping
// the exact same return shape so the screen didn't need to change.
export function useBuscarVentas(initialParams?: Partial<VentasParams>): UseVentasReturn {
  const port = useVentasListPort();

  const [params, setParamsState] = useState<VentasParams>({
    limit: DEFAULT_LIMIT,
    sortBy: "fechaVenta",
    sortOrder: "desc",
    ...initialParams,
  });

  const [ventas, setVentas] = useState<VentaLocal[]>([]);
  const [nextCursor, setNextCursor] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const nextCursorRef = useRef<string>("");
  const loadingMoreRef = useRef(false);

  const {
    search,
    tipoVenta,
    situacion,
    sincronizacion,
    zonaClienteId,
    precioMin,
    precioMax,
    fechaInicio,
    fechaFin,
    incluirCanceladas,
    sortBy,
    sortOrder,
    limit,
  } = params;

  // First page: fetch/refetch on any filter change (or tick from refetch()).
  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    loadingMoreRef.current = false;

    setLoading(true);
    setError(null);

    buscarVentas(port, toBuscarVentasInput(params), ctrl.signal)
      .then((out) => {
        if (ctrl.signal.aborted) return;
        setVentas(out.items);
        setNextCursor(out.nextCursor);
        nextCursorRef.current = out.nextCursor;
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(toErrorMessage(e));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    port,
    search,
    tipoVenta,
    situacion,
    sincronizacion,
    zonaClienteId,
    precioMin,
    precioMax,
    fechaInicio,
    fechaFin,
    incluirCanceladas,
    sortBy,
    sortOrder,
    limit,
    tick,
  ]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || loading || !nextCursorRef.current) return;
    loadingMoreRef.current = true;

    const ctrl = new AbortController();
    setLoadingMore(true);
    setError(null);

    try {
      const out = await buscarVentas(port, toBuscarVentasInput(params, nextCursorRef.current), ctrl.signal);
      if (ctrl.signal.aborted) return;
      setVentas((prev) => [...prev, ...out.items]);
      setNextCursor(out.nextCursor);
      nextCursorRef.current = out.nextCursor;
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(toErrorMessage(e));
    } finally {
      loadingMoreRef.current = false;
      if (!ctrl.signal.aborted) setLoadingMore(false);
    }
  }, [port, params, loading]);

  const setParams = useCallback((newParams: Partial<VentasParams>) => {
    setParamsState((prev) => ({ ...prev, ...newParams }));
  }, []);

  const updateSort = useCallback(
    (newSortBy: VentasParams["sortBy"], sortOrderArg?: VentasParams["sortOrder"]) => {
      setParamsState((prev) => {
        const newOrder =
          prev.sortBy === newSortBy && !sortOrderArg
            ? prev.sortOrder === "desc"
              ? "asc"
              : "desc"
            : (sortOrderArg ?? "desc");
        return { ...prev, sortBy: newSortBy, sortOrder: newOrder };
      });
    },
    [],
  );

  const refetch = useCallback(async () => {
    setTick((t) => t + 1);
  }, []);

  return {
    ventas,
    loading,
    loadingMore,
    error,
    params,
    hasMore: nextCursor !== "",
    setParams,
    updateSort,
    loadMore,
    refetch,
  };
}

export default useBuscarVentas;
