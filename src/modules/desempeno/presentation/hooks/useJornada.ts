import { useCallback } from "react";
import type { Jornada } from "../../domain/entities";
import type { DomainError } from "../../domain/errors";
import { obtenerJornada } from "../../application/usecases/consultas";
import { useDesempenoPort } from "../context/useDesempenoPort";
import { usePreferencias } from "../context/usePreferencias";
import { useCargaRemota } from "./lib/useCargaRemota";
import { useCadaMinuto } from "./lib/useCadaMinuto";

// useJornada pide lo que registró un usuario en un día (contrato §3) con el
// umbral y horario de la pantalla. Solo el día de hoy se actualiza cada minuto.
export function useJornada(
  uid: string,
  fecha: string,
  esHoy: boolean,
): {
  jornada: Jornada | null;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
} {
  const port = useDesempenoPort();
  const { consultaJornada } = usePreferencias();
  const cargar = useCallback(
    (signal: AbortSignal) => obtenerJornada(port, uid, fecha, consultaJornada, signal),
    [port, uid, fecha, consultaJornada],
  );
  const { datos, isLoading, error, refresh } = useCargaRemota(cargar);
  useCadaMinuto(refresh, esHoy);
  return { jornada: datos, isLoading, error, refresh };
}
