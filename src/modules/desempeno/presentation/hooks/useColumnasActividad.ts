import { useCallback, useState } from "react";
import {
  CLAVE_COLUMNAS,
  CLAVES_COLUMNA,
  leerColumnasGuardadas,
  COLUMNAS_POR_DEFECTO,
  type ClaveColumna,
} from "../actividadPreferencias";
import { escribirLocal } from "./lib/almacenLocal";

// Columnas visibles de la pestaña Actividad, por computadora. Nunca queda la
// tabla sin columnas.
export function useColumnasActividad() {
  const [columnas, setColumnas] = useState<ClaveColumna[]>(() => {
    try {
      return leerColumnasGuardadas(window.localStorage) ?? COLUMNAS_POR_DEFECTO;
    } catch {
      return COLUMNAS_POR_DEFECTO;
    }
  });

  const fijar = useCallback((nuevas: readonly ClaveColumna[]) => {
    if (nuevas.length === 0) return;
    // Conserva el orden canónico de las columnas.
    const ordenadas = CLAVES_COLUMNA.filter((c) => nuevas.includes(c));
    setColumnas(ordenadas);
    escribirLocal(CLAVE_COLUMNAS, ordenadas);
  }, []);

  const alternar = useCallback(
    (clave: ClaveColumna) => {
      fijar(
        columnas.includes(clave) ? columnas.filter((c) => c !== clave) : [...columnas, clave],
      );
    },
    [columnas, fijar],
  );

  return { columnas, alternar, fijar };
}
