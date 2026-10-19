import { useCallback, useMemo } from "react";
import type { UltimoMovimiento } from "../../domain/entities";
import { obtenerUltimosMovimientos92Dias } from "../../application/usecases/consultas";
import { useDesempenoPort } from "../context/useDesempenoPort";
import { useCargaRemota } from "./lib/useCargaRemota";

// Lo que la fila vencida sabe de su último movimiento de 92 días:
// - "cargando": el lote no ha respondido;
// - "listo": vino en el lote (`movimiento` null = sin movimiento en 92 días);
// - "sin_dato": el lote falló o el uid no vino. No es "sin movimiento".
export type MovimientoFila =
  | { readonly estado: "cargando" }
  | { readonly estado: "listo"; readonly movimiento: UltimoMovimiento | null }
  | { readonly estado: "sin_dato" };

export type UseUltimosMovimientos92DiasReturn = {
  movimientoDe: (uid: string) => MovimientoFila;
};

// useUltimosMovimientos92Dias: GET /v2/desempeno/ultimo-movimiento (contrato
// pulido 2 §3–§4) para las filas vencidas, en trozos de 100. `uids` null = no
// pedir (la sección "Ver N" está cerrada). La consulta depende del CONTENIDO de
// `uids`: el refresco de cada minuto del tablero trae otro arreglo con los
// mismos uids y no vuelve a pedir. No se refresca solo.
export function useUltimosMovimientos92Dias(uids: readonly string[] | null): UseUltimosMovimientos92DiasReturn {
  const port = useDesempenoPort();
  const clave = uids === null ? null : JSON.stringify(uids);
  const cargar = useMemo(() => {
    if (clave === null) return null;
    const pedidos = JSON.parse(clave) as string[];
    return (signal: AbortSignal) => obtenerUltimosMovimientos92Dias(port, pedidos, signal);
  }, [port, clave]);
  const { datos, error } = useCargaRemota(cargar);
  const movimientoDe = useCallback(
    (uid: string): MovimientoFila => {
      if (datos === null) return error === null ? { estado: "cargando" } : { estado: "sin_dato" };
      const m = datos.get(uid);
      return m === undefined ? { estado: "sin_dato" } : { estado: "listo", movimiento: m };
    },
    [datos, error],
  );
  return { movimientoDe };
}
