import { useCallback } from "react";
import type { ImagenAdjunta, RefImagenes } from "../../domain/entities";
import type { DomainError } from "../../domain/errors";
import { listarImagenes } from "../../application/usecases/consultas";
import { useDesempenoPort } from "../context/useDesempenoPort";
import { useCargaRemota } from "./lib/useCargaRemota";

export function claveDeRef(ref: RefImagenes): string {
  return ref.tipo === "pago" ? `pago/${ref.pagoRecibidoId}` : `visita/${ref.visitaId}`;
}

// Fotos de un pago o de una visita (contrato §6). Con ref null no pide nada.
// La consulta depende del tipo y del id, no de la identidad del objeto `ref`:
// un padre que arma la referencia en cada render no dispara otra descarga.
export function useImagenes(ref: RefImagenes | null): {
  imagenes: ImagenAdjunta[] | null;
  isLoading: boolean;
  error: DomainError | null;
} {
  const port = useDesempenoPort();
  const tipo = ref?.tipo ?? null;
  const id = ref ? (ref.tipo === "pago" ? ref.pagoRecibidoId : ref.visitaId) : null;
  const cargar = useCallback(
    (signal: AbortSignal) =>
      listarImagenes(
        port,
        tipo === "pago" ? { tipo: "pago", pagoRecibidoId: id ?? "" } : { tipo: "visita", visitaId: id ?? "" },
        signal,
      ),
    [port, tipo, id],
  );
  const { datos, isLoading, error } = useCargaRemota(tipo === null ? null : cargar);
  return { imagenes: datos, isLoading, error };
}
