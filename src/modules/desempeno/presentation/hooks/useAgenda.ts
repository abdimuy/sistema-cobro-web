import { useMemo } from "react";
import type { CompromisoDeVenta } from "../../domain/entities";
import { obtenerAgenda } from "../../application/usecases/consultas";
import { useDesempenoPort } from "../context/useDesempenoPort";
import { useCargaRemota } from "./lib/useCargaRemota";

// Lo que la tabla de Cuentas sabe del compromiso de una venta:
// - "cargando": la agenda no ha respondido;
// - "listo": vino la agenda (`compromiso` null = la venta no tiene);
// - "sin_dato": la agenda falló o no hay zona. No es "sin compromiso".
export type CompromisoFila =
  | { readonly estado: "cargando" }
  | { readonly estado: "listo"; readonly compromiso: CompromisoDeVenta | null }
  | { readonly estado: "sin_dato" };

export type CompromisoDe = (ventaId: number) => CompromisoFila;

// useAgenda: GET /v2/visitas/agenda (visitas P2, spec §5.5) de la zona del
// usuario. `zonaId` null = no pedir. `hoy` null = el hoy del servidor. Un error
// aquí no tumba Cuentas: solo deja la columna sin dato.
export function useAgenda(zonaId: number | null, hoy: string | null): CompromisoDe {
  const port = useDesempenoPort();
  const cargar = useMemo(
    () => (zonaId === null ? null : (signal: AbortSignal) => obtenerAgenda(port, zonaId, hoy, signal)),
    [port, zonaId, hoy],
  );
  const { datos, isLoading, error } = useCargaRemota(cargar);
  return useMemo(() => {
    return (ventaId: number): CompromisoFila => {
      if (datos !== null) return { estado: "listo", compromiso: datos.get(ventaId) ?? null };
      return isLoading && error === null ? { estado: "cargando" } : { estado: "sin_dato" };
    };
  }, [datos, isLoading, error]);
}
