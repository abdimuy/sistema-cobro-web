import { useCallback, useState } from "react";
import {
  CLAVE_COLUMNAS,
  CLAVES_COLUMNA,
  COLUMNAS_POR_DEFECTO,
  esListaDeColumnas,
  type ClaveColumna,
} from "../actividadPreferencias";
import { escribirLocal, leerLocal } from "./lib/almacenLocal";

// Columnas visibles de la pestaña Actividad, por computadora. Nunca queda la
// tabla sin columnas.
export function useColumnasActividad() {
  const [columnas, setColumnas] = useState<ClaveColumna[]>(() =>
    leerLocal(CLAVE_COLUMNAS, COLUMNAS_POR_DEFECTO, esListaDeColumnas),
  );

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
