import { useCallback } from "react";
import type { FichaUsuario } from "../../domain/entities";
import type { DomainError } from "../../domain/errors";
import { obtenerUsuario } from "../../application/usecases/consultas";
import { useDesempenoPort } from "../context/useDesempenoPort";
import { usePreferencias } from "../context/usePreferencias";
import { useCargaRemota } from "./lib/useCargaRemota";
import { useCadaMinuto } from "./lib/useCadaMinuto";

export type UseUsuarioReturn = {
  ficha: FichaUsuario | null;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
};

// useUsuario: GET /v2/desempeno/usuarios/{uid} con el periodo, umbral y horario
// de la pantalla (contrato v2.2 §8). La ficha pide solo a su usuario, no el
// tablero de la flota. Se actualiza cada minuto; un cambio de periodo es otra
// consulta y useCargaRemota borra los datos (nunca una cifra de otro periodo).
export function useUsuario(uid: string): UseUsuarioReturn {
  const port = useDesempenoPort();
  const { consultaTablero } = usePreferencias();
  const cargar = useCallback(
    (signal: AbortSignal) => obtenerUsuario(port, uid, consultaTablero, signal),
    [port, uid, consultaTablero],
  );
  const { datos, isLoading, error, refresh } = useCargaRemota(cargar);
  useCadaMinuto(refresh, true);
  return { ficha: datos, isLoading, error, refresh };
}
