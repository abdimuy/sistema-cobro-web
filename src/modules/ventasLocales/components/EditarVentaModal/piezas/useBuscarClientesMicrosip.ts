import { useEffect, useRef, useState } from "react";
import type { Cliente } from "@/modules/clientes/domain/entities";
import { DomainError } from "@/modules/clientes/domain/errors";
import { buscarClientes } from "@/modules/clientes/application/usecases/buscarClientes";
import { HttpClientesAdapter } from "@/modules/clientes/infrastructure/http/HttpClientesAdapter";
import { apiClient } from "../../../infrastructure/http/apiClient";

const DEBOUNCE_MS = 300;
const RESULT_LIMIT = 8;

// Module-level singleton: same shape of axios instance ClientesContainer
// hands to HttpClientesAdapter (V2 client, Bearer token injected via
// interceptor), but owned by ventasLocales so this piece works without
// mounting <ClientesProvider> (which this modal's tree doesn't have).
const clientesPort = new HttpClientesAdapter(apiClient);

export type UseBuscarClientesMicrosipReturn = {
  items: ReadonlyArray<Cliente>;
  isLoading: boolean;
  error: DomainError | null;
};

// useBuscarClientesMicrosip drives the async search behind the "Cliente
// Microsip" combobox: debounces q, cancels the in-flight request when a new
// one starts (or q goes back to empty), and swallows abort errors — only a
// genuine failure from the latest request is surfaced.
export function useBuscarClientesMicrosip(q: string): UseBuscarClientesMicrosipReturn {
  const [items, setItems] = useState<ReadonlyArray<Cliente>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    const trimmed = q.trim();
    if (trimmed === "") {
      setItems([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      buscarClientes(clientesPort, { q: trimmed, limit: RESULT_LIMIT }, ctrl.signal)
        .then((out) => {
          if (ctrl.signal.aborted) return;
          setItems(out.items.slice(0, RESULT_LIMIT));
          setIsLoading(false);
        })
        .catch((e: unknown) => {
          // A stale/cancelled request resolves as an error too (AbortError) —
          // ignore it silently, the newer request (or the empty-q reset) already
          // owns the state.
          if (ctrl.signal.aborted) return;
          setError(
            e instanceof DomainError
              ? e
              : new DomainError("error_inesperado", e instanceof Error ? e.message : String(e)),
          );
          setIsLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [q]);

  return { items, isLoading, error };
}
