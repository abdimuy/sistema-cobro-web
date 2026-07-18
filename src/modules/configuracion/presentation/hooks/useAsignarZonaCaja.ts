import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AsignarZonaCajaInput } from "../../application/ports/ConfiguracionPort";
import type { ZonaCajaAsignacion } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useConfiguracionPort } from "../context/ConfiguracionContext";
import { asignarZonaCaja as asignarZonaCajaUseCase } from "../../application/usecases/asignarZonaCaja";
import { toDomainError } from "./lib/toDomainError";

export type UseAsignarZonaCajaState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "done"; result: ZonaCajaAsignacion }
  | { status: "error"; error: DomainError };

// useAsignarZonaCaja drives the PUT mutation for a single zone row. This is
// live create-sale config, so the caller gates asignar() behind a
// confirmation dialog — this hook only owns the request lifecycle. Errors
// are caught internally (toast + error state) so callers never need a
// try/catch around asignar().
export function useAsignarZonaCaja(onSuccess?: () => void) {
  const port = useConfiguracionPort();
  const [state, setState] = useState<UseAsignarZonaCajaState>({ status: "idle" });

  const asignar = useCallback(
    async (input: AsignarZonaCajaInput) => {
      setState({ status: "saving" });
      try {
        const result = await asignarZonaCajaUseCase(port, input);
        setState({ status: "done", result });
        toast.success("Configuración de zona guardada", { description: result.zonaNombre });
        onSuccess?.();
        return result;
      } catch (e) {
        const err = toDomainError(e);
        setState({ status: "error", error: err });
        toast.error("No se pudo guardar la configuración de zona", { description: err.message });
        return null;
      }
    },
    [port, onSuccess],
  );

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return {
    status: state.status,
    saving: state.status === "saving",
    error: state.status === "error" ? state.error : null,
    asignar,
    reset,
  };
}
