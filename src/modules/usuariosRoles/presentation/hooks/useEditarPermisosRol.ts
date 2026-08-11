import { useCallback, useState } from "react";
import { toast } from "sonner";
import { DomainError } from "../../domain/errors";
import { useUsuariosRolesPort } from "../context/UsuariosRolesContext";
import { asignarPermisoARol as asignarPermisoARolUseCase } from "../../application/usecases/asignarPermisoARol";
import { quitarPermisoDeRol as quitarPermisoDeRolUseCase } from "../../application/usecases/quitarPermisoDeRol";
import { toDomainError } from "./lib/toDomainError";

export type UseEditarPermisosRolState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "error"; error: DomainError };

// useEditarPermisosRol drives the asignar/quitar permiso-a-rol mutations.
// Errors are caught internally (toast + error state) so callers never need
// a try/catch around asignar()/quitar().
export function useEditarPermisosRol(onSuccess?: () => void) {
  const port = useUsuariosRolesPort();
  const [state, setState] = useState<UseEditarPermisosRolState>({ status: "idle" });

  // asignar/quitar return true on success, false on failure, so callers can
  // apply an optimistic UI update and revert it when the mutation fails.
  const asignar = useCallback(
    async (rolId: string, codigo: string): Promise<boolean> => {
      setState({ status: "saving" });
      try {
        await asignarPermisoARolUseCase(port, rolId, codigo);
        setState({ status: "idle" });
        toast.success("Permiso agregado");
        onSuccess?.();
        return true;
      } catch (e) {
        const err = toDomainError(e);
        setState({ status: "error", error: err });
        toast.error("No se pudo agregar el permiso", { description: err.message });
        return false;
      }
    },
    [port, onSuccess],
  );

  const quitar = useCallback(
    async (rolId: string, codigo: string): Promise<boolean> => {
      setState({ status: "saving" });
      try {
        await quitarPermisoDeRolUseCase(port, rolId, codigo);
        setState({ status: "idle" });
        toast.success("Permiso quitado");
        onSuccess?.();
        return true;
      } catch (e) {
        const err = toDomainError(e);
        setState({ status: "error", error: err });
        toast.error("No se pudo quitar el permiso", { description: err.message });
        return false;
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
    quitar,
    reset,
  };
}
