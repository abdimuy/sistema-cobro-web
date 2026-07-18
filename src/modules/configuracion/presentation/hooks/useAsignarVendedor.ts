import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { VendedorAsignacion } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useConfiguracionPort } from "../context/ConfiguracionContext";
import { asignarVendedor as asignarVendedorUseCase } from "../../application/usecases/asignarVendedor";
import { eliminarVendedor as eliminarVendedorUseCase } from "../../application/usecases/eliminarVendedor";
import { toDomainError } from "./lib/toDomainError";

// AsignarVendedorSlots mirrors the port's slot fields with short names —
// convenient for the row component that resolves them from a picked
// identity or a manual per-slot override.
export type AsignarVendedorSlots = {
  l1?: number | null;
  l2?: number | null;
  l3?: number | null;
};

export type UseAsignarVendedorState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "done"; result: VendedorAsignacion }
  | { status: "error"; error: DomainError };

// useAsignarVendedor drives the PUT/DELETE mutation for a single row.
// Errors are caught internally (toast + error state) so callers never
// need a try/catch around asignar()/eliminar().
export function useAsignarVendedor(onSuccess?: () => void) {
  const port = useConfiguracionPort();
  const [state, setState] = useState<UseAsignarVendedorState>({ status: "idle" });

  const asignar = useCallback(
    async (usuarioId: string, slots: AsignarVendedorSlots) => {
      setState({ status: "saving" });
      try {
        const result = await asignarVendedorUseCase(port, {
          usuarioId,
          listaId1: slots.l1,
          listaId2: slots.l2,
          listaId3: slots.l3,
        });
        setState({ status: "done", result });
        toast.success("Vendedor asignado", { description: result.nombre || result.email });
        onSuccess?.();
        return result;
      } catch (e) {
        const err = toDomainError(e);
        setState({ status: "error", error: err });
        toast.error("No se pudo asignar el vendedor", { description: err.message });
        return null;
      }
    },
    [port, onSuccess],
  );

  const eliminar = useCallback(
    async (usuarioId: string) => {
      setState({ status: "saving" });
      try {
        await eliminarVendedorUseCase(port, usuarioId);
        setState({ status: "idle" });
        toast.success("Asignación eliminada");
        onSuccess?.();
      } catch (e) {
        const err = toDomainError(e);
        setState({ status: "error", error: err });
        toast.error("No se pudo eliminar la asignación", { description: err.message });
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
    eliminar,
    reset,
  };
}
