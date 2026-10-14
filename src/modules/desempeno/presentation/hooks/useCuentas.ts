import { useCallback } from "react";
import type { CuentasSemana } from "../../domain/entities";
import type { DomainError } from "../../domain/errors";
import type { ConsultaCuentas } from "../../application/ports/DesempenoPort";
import { obtenerCuentas } from "../../application/usecases/consultas";
import { useDesempenoPort } from "../context/useDesempenoPort";
import { useCargaRemota } from "./lib/useCargaRemota";

// Cuentas de la semana del usuario (contrato §5). El llamador memoiza `consulta`.
export function useCuentas(
  uid: string,
  consulta: ConsultaCuentas,
): {
  cuentas: CuentasSemana | null;
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
} {
  const port = useDesempenoPort();
  const cargar = useCallback(
    (signal: AbortSignal) => obtenerCuentas(port, uid, consulta, signal),
    [port, uid, consulta],
  );
  const { datos, isLoading, error, refresh } = useCargaRemota(cargar);
  return { cuentas: datos, isLoading, error, refresh };
}
