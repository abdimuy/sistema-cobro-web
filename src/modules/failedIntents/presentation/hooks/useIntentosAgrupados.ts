import { useMemo } from "react";
import type { IntentoAgrupado } from "../../domain/entities";
import type { IntentStatusValue } from "../../domain/values";
import {
  agruparYPartir,
  ORDEN_POR_DEFECTO,
  type OrdenLista,
} from "../../application/usecases/listarIntentosAgrupados";
import { useFailedIntentsList } from "./useFailedIntentsList";
import type { DomainError } from "../../domain/errors";

export type UseIntentosAgrupadosReturn = {
  necesitanAccion: ReadonlyArray<IntentoAgrupado>;
  seReintentan: ReadonlyArray<IntentoAgrupado>;
  hasMore: boolean;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
  loadNext: () => void;
};

// useIntentosAgrupados es la lista de la consola: las mismas páginas que
// useFailedIntentsList, agrupadas por trabajo.
//
// Se apoya en ese hook en vez de paginar por su cuenta —una sola
// implementación de cursor, aborto y refresh— y agrupa sobre el ACUMULADO,
// no página por página: un grupo puede quedar a caballo entre dos páginas y
// agrupar por página diría "3 intentos" y después "10" en vez de "13".
export function useIntentosAgrupados(opts: {
  status?: IntentStatusValue;
  modulo?: string;
  pageSize?: number;
  orden?: OrdenLista;
}): UseIntentosAgrupadosReturn {
  const lista = useFailedIntentsList(opts);

  const { necesitanAccion, seReintentan } = useMemo(
    () => agruparYPartir(lista.items, opts.orden ?? ORDEN_POR_DEFECTO),
    [lista.items, opts.orden],
  );

  return {
    necesitanAccion,
    seReintentan,
    hasMore: lista.hasMore,
    isLoading: lista.isLoading,
    error: lista.error,
    refresh: lista.refresh,
    loadNext: lista.loadNext,
  };
}
