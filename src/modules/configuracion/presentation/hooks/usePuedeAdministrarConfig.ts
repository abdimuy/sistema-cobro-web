import { useEffect, useState } from "react";
import { useConfiguracionPort } from "../context/ConfiguracionContext";
import { listarPermisosActuales } from "../../application/usecases/listarPermisosActuales";

export const PERMISO_CONFIG_ADMINISTRAR = "config:administrar";

// usePuedeAdministrarConfig dice si el usuario actual tiene config:administrar.
// Es sólo comodidad de interfaz: el servidor sigue haciendo cumplir el permiso.
// Mientras carga, o si la lectura falla, devuelve false (no muestra acciones).
export function usePuedeAdministrarConfig(): boolean {
  const port = useConfiguracionPort();
  const [puede, setPuede] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    listarPermisosActuales(port, ctrl.signal)
      .then((permisos) => {
        if (!ctrl.signal.aborted) setPuede(permisos.includes(PERMISO_CONFIG_ADMINISTRAR));
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setPuede(false);
      });
    return () => ctrl.abort();
  }, [port]);

  return puede;
}
