import { useCallback, useState } from "react";
import { toast } from "sonner";
import type {
  ActualizarRolInput,
  CrearRolInput,
} from "../../application/ports/UsuariosRolesPort";
import type { Rol } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useUsuariosRolesPort } from "../context/UsuariosRolesContext";
import { crearRol as crearRolUseCase } from "../../application/usecases/crearRol";
import { actualizarRol as actualizarRolUseCase } from "../../application/usecases/actualizarRol";
import { eliminarRol as eliminarRolUseCase } from "../../application/usecases/eliminarRol";
import { toDomainError } from "./lib/toDomainError";

export type UseCrudRolState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "done"; result: Rol }
  | { status: "error"; error: DomainError };

// useCrudRol drives the crear/renombrar/eliminar rol mutations. Errors are
// caught internally (toast + error state) so callers never need a
// try/catch around crear()/renombrar()/eliminar().
export function useCrudRol(onSuccess?: () => void) {
  const port = useUsuariosRolesPort();
  const [state, setState] = useState<UseCrudRolState>({ status: "idle" });

  const crear = useCallback(
    async (input: CrearRolInput) => {
      setState({ status: "saving" });
      try {
        const result = await crearRolUseCase(port, input);
        setState({ status: "done", result });
        toast.success("Rol creado", { description: result.nombre });
        onSuccess?.();
        return result;
      } catch (e) {
        const err = toDomainError(e);
        setState({ status: "error", error: err });
        toast.error("No se pudo crear el rol", { description: err.message });
        return null;
      }
    },
    [port, onSuccess],
  );

  const renombrar = useCallback(
    async (rolId: string, input: ActualizarRolInput) => {
      setState({ status: "saving" });
      try {
        const result = await actualizarRolUseCase(port, rolId, input);
        setState({ status: "done", result });
        toast.success("Rol actualizado", { description: result.nombre });
        onSuccess?.();
        return result;
      } catch (e) {
        const err = toDomainError(e);
        setState({ status: "error", error: err });
        toast.error("No se pudo actualizar el rol", { description: err.message });
        return null;
      }
    },
    [port, onSuccess],
  );

  const eliminar = useCallback(
    async (rolId: string) => {
      setState({ status: "saving" });
      try {
        await eliminarRolUseCase(port, rolId);
        setState({ status: "idle" });
        toast.success("Rol eliminado");
        onSuccess?.();
      } catch (e) {
        const err = toDomainError(e);
        setState({ status: "error", error: err });
        toast.error("No se pudo eliminar el rol", { description: err.message });
      }
    },
    [port, onSuccess],
  );

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return {
    status: state.status,
    saving: state.status === "saving",
    error: state.status === "error" ? state.error : null,
    crear,
    renombrar,
    eliminar,
    reset,
  };
}
