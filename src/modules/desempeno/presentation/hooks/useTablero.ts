import { useCallback } from "react";
import type { Tablero } from "../../domain/entities";
import type { DomainError } from "../../domain/errors";
import { obtenerTablero } from "../../application/usecases/consultas";
import { useDesempenoPort } from "../context/useDesempenoPort";
import { usePreferencias } from "../context/usePreferencias";
import { useCargaRemota } from "./lib/useCargaRemota";
import { useCadaMinuto } from "./lib/useCadaMinuto";

export type UseTableroReturn = {
  tablero: Tablero | null;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useTablero: GET /v2/desempeno/usuarios con el periodo, umbral y horario de
// la pantalla. Se actualiza cada minuto (spec §5). Una falla de la
// actualización conserva los datos y queda en `error` (useCargaRemota).
export function useTablero(): UseTableroReturn {
  const port = useDesempenoPort();
  const { consultaTablero } = usePreferencias();
  const cargar = useCallback(
    (signal: AbortSignal) => obtenerTablero(port, consultaTablero, signal),
    [port, consultaTablero],
  );
  const { datos, isLoading, error, refresh } = useCargaRemota(cargar);
  useCadaMinuto(refresh, true);
  return { tablero: datos, isLoading, error, refresh };
}
