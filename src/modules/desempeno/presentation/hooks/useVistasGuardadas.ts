import { useCallback, useState } from "react";
import type { FiltrosActividad } from "../../domain/entities";
import {
  CLAVE_VISTAS,
  esListaDeVistas,
  type ClaveColumna,
  type VistaGuardada,
} from "../actividadPreferencias";
import { escribirLocal, leerLocal } from "./lib/almacenLocal";

// Vistas guardadas de la pestaña Actividad, por computadora (localStorage).
export function useVistasGuardadas() {
  const [vistas, setVistas] = useState<VistaGuardada[]>(() =>
    leerLocal<VistaGuardada[]>(CLAVE_VISTAS, [], esListaDeVistas),
  );

  const guardar = useCallback(
    (nombre: string, filtros: FiltrosActividad, columnas: ClaveColumna[]): VistaGuardada => {
      const vista: VistaGuardada = {
        id: `mi-${Date.now().toString(36)}`,
        nombre: nombre.trim() || "Mi vista",
        filtros,
        columnas,
      };
      setVistas((previas) => {
        const siguientes = [...previas, vista];
        escribirLocal(CLAVE_VISTAS, siguientes);
        return siguientes;
      });
      return vista;
    },
    [],
  );

  const eliminar = useCallback((id: string) => {
    setVistas((previas) => {
      const siguientes = previas.filter((v) => v.id !== id);
      escribirLocal(CLAVE_VISTAS, siguientes);
      return siguientes;
    });
  }, []);

  return { vistas, guardar, eliminar };
}
