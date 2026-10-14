import { useCallback } from "react";
import type { ImagenAdjunta, RefImagenes } from "../../domain/entities";
import type { DomainError } from "../../domain/errors";
import { listarImagenes } from "../../application/usecases/consultas";
import { useDesempenoPort } from "../context/useDesempenoPort";
import { useCargaRemota } from "./lib/useCargaRemota";
import { toDomainError } from "./lib/toDomainError";

export function claveDeRef(ref: RefImagenes): string {
  return ref.tipo === "pago" ? `pago/${ref.pagoRecibidoId}` : `visita/${ref.visitaId}`;
}

// Resultado etiquetado con la referencia que lo pidió. El error también viaja
// aquí (no por useCargaRemota) para poder descartarlo junto con los datos.
type Resultado = {
  readonly clave: string;
  readonly imagenes: ImagenAdjunta[] | null;
  readonly error: DomainError | null;
};

// Fotos de un pago o de una visita (contrato §6). Con ref null no pide nada.
// La consulta depende del tipo y del id, no de la identidad del objeto `ref`:
// un padre que arma la referencia en cada render no dispara otra descarga.
// Solo se entrega un resultado cuya clave es la de la referencia actual: al
// cambiar de visita o pago, el primer render ya no pinta las fotos ni el error
// de la anterior (useCargaRemota los borra hasta su efecto).
export function useImagenes(ref: RefImagenes | null): {
  imagenes: ImagenAdjunta[] | null;
  isLoading: boolean;
  error: DomainError | null;
} {
  const port = useDesempenoPort();
  const tipo = ref?.tipo ?? null;
  const id = ref ? (ref.tipo === "pago" ? ref.pagoRecibidoId : ref.visitaId) : null;
  const clave = ref ? claveDeRef(ref) : null;
  const cargar = useCallback(
    async (signal: AbortSignal): Promise<Resultado> => {
      const r: RefImagenes =
        tipo === "pago" ? { tipo: "pago", pagoRecibidoId: id ?? "" } : { tipo: "visita", visitaId: id ?? "" };
      try {
        return { clave: claveDeRef(r), imagenes: await listarImagenes(port, r, signal), error: null };
      } catch (e) {
        return { clave: claveDeRef(r), imagenes: null, error: toDomainError(e) };
      }
    },
    [port, tipo, id],
  );
  const { datos } = useCargaRemota(tipo === null ? null : cargar);
  const vigente = datos !== null && datos.clave === clave ? datos : null;
  return {
    imagenes: vigente ? vigente.imagenes : null,
    isLoading: clave !== null && vigente === null,
    error: vigente ? vigente.error : null,
  };
}
