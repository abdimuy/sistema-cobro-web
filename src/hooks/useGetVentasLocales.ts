import { useState, useCallback, useEffect, useRef } from "react";
import {
  getVentasLocales,
  VentasParams,
  VentasPagination,
  VentasFilters,
  VentaLocal,
} from "../services/api/getVentasLocales";

// ============================================================================
// Types
// ============================================================================

export interface UseVentasState {
  ventas: VentaLocal[];
  pagination: VentasPagination | null;
  filters: VentasFilters | null;
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

export type UseVentasReturn = UseVentasState & UseVentasActions & {
  params: VentasParams;
  hasMore: boolean;
};

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_LIMIT = 30;

// ============================================================================
// Hook
// ============================================================================

export function useGetVentasLocales(initialParams?: Partial<VentasParams>): UseVentasReturn {
  const [state, setState] = useState<UseVentasState>({
    ventas: [],
    pagination: null,
    filters: null,
    loading: true,
    loadingMore: false,
    error: null,
  });

  const [params, setParamsState] = useState<VentasParams>({
    limit: DEFAULT_LIMIT,
    sortBy: "fechaVenta",
    sortOrder: "desc",
    ...initialParams,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const nextCursorRef = useRef<string | null>(null);

  // Initial fetch or fetch after params change (resets list)
  const fetchInitial = useCallback(async (fetchParams: VentasParams) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await getVentasLocales({ ...fetchParams, cursor: undefined });

      nextCursorRef.current = result.pagination.nextCursor;

      setState({
        ventas: result.data,
        pagination: result.pagination,
        filters: result.filters,
        loading: false,
        loadingMore: false,
        error: null,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "CanceledError") {
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: err instanceof Error ? err.message : "Error al cargar ventas",
      }));
    }
  }, []);

  // Load more (append to list)
  const loadMore = useCallback(async () => {
    if (!nextCursorRef.current || state.loadingMore || state.loading) return;

    setState((prev) => ({ ...prev, loadingMore: true }));

    try {
      const result = await getVentasLocales({
        ...params,
        cursor: nextCursorRef.current,
      });

      nextCursorRef.current = result.pagination.nextCursor;

      setState((prev) => ({
        ...prev,
        ventas: [...prev.ventas, ...result.data],
        pagination: result.pagination,
        loadingMore: false,
      }));
    } catch (err) {
      if (err instanceof Error && err.name === "CanceledError") {
        return;
      }

      setState((prev) => ({
        ...prev,
        loadingMore: false,
        error: err instanceof Error ? err.message : "Error al cargar más ventas",
      }));
    }
  }, [params, state.loadingMore, state.loading]);

  const setParams = useCallback((newParams: Partial<VentasParams>) => {
    setParamsState((prev) => ({
      ...prev,
      ...newParams,
    }));
  }, []);

  const updateSort = useCallback((
    sortBy: VentasParams["sortBy"],
    sortOrder?: VentasParams["sortOrder"]
  ) => {
    setParamsState((prev) => {
      const newOrder = prev.sortBy === sortBy && !sortOrder
        ? (prev.sortOrder === "desc" ? "asc" : "desc")
        : (sortOrder ?? "desc");

      return {
        ...prev,
        sortBy,
        sortOrder: newOrder,
      };
    });
  }, []);

  const refetch = useCallback(async () => {
    nextCursorRef.current = null;
    await fetchInitial(params);
  }, [params, fetchInitial]);

  // Fetch on params change
  useEffect(() => {
    nextCursorRef.current = null;
    fetchInitial(params);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [
    params.search,
    params.fechaInicio,
    params.fechaFin,
    params.tipoVenta,
    params.almacenId,
    params.zonaClienteId,
    params.sortBy,
    params.sortOrder,
    params.precioMin,
    params.precioMax,
    params.enviado,
    fetchInitial,
  ]);

  const hasMore = state.pagination?.hasNextPage ?? false;

  return {
    ...state,
    params,
    hasMore,
    loadMore,
    refetch,
    setParams,
    updateSort,
  };
}

export default useGetVentasLocales;
