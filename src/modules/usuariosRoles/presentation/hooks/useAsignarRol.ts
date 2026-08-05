import { useCallback, useState } from "react";
import { toast } from "sonner";
import { DomainError } from "../../domain/errors";
import { useUsuariosRolesPort } from "../context/UsuariosRolesContext";
import { asignarRolAUsuario as asignarRolAUsuarioUseCase } from "../../application/usecases/asignarRolAUsuario";
import { quitarRolAUsuario as quitarRolAUsuarioUseCase } from "../../application/usecases/quitarRolAUsuario";
import { toDomainError } from "./lib/toDomainError";

export type UseAsignarRolState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "error"; error: DomainError };

// useAsignarRol drives the asignar/quitar rol-a-usuario mutations. Errors
// are caught internally (toast + error state) so callers never need a
// try/catch around asignar()/quitar().
export function useAsignarRol(onSuccess?: () => void) {
  const port = useUsuariosRolesPort();
  const [state, setState] = useState<UseAsignarRolState>({ status: "idle" });

  const asignar = useCallback(
    async (usuarioId: string, rolId: string) => {
      setState({ status: "saving" });
      try {
        await asignarRolAUsuarioUseCase(port, usuarioId, rolId);
        setState({ status: "idle" });
        toast.success("Rol asignado");
        onSuccess?.();
      } catch (e) {
        const err = toDomainError(e);
        setState({ status: "error", error: err });
        toast.error("No se pudo asignar el rol", { description: err.message });
      }
    },
    [port, onSuccess],
  );

  const quitar = useCallback(
    async (usuarioId: string, rolId: string) => {
      setState({ status: "saving" });
      try {
        await quitarRolAUsuarioUseCase(port, usuarioId, rolId);
        setState({ status: "idle" });
        toast.success("Rol removido");
        onSuccess?.();
      } catch (e) {
        const err = toDomainError(e);
        setState({ status: "error", error: err });
        toast.error("No se pudo remover el rol", { description: err.message });
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
