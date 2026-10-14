import { useEffect, useState } from "react";
import type { ImagenPago } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { useClientesPort } from "../context/ClientesContext";
import { toDomainError } from "./lib/toDomainError";

type Estado = { id: string | null; imagenes: ImagenPago[]; error: DomainError | null };

const SIN_IMAGENES: ImagenPago[] = [];

// Fotos de un pago; con pagoRecibidoId null no hace nada ("Sin comprobante").
//
// El resultado se guarda junto con el id que lo pidió y solo se entrega si ese
// id es el actual: al cambiar de pago, el primer render (antes de que corra el
// efecto) ya no muestra las fotos ni el error del pago anterior.
export function useImagenesPago(pagoRecibidoId: string | null) {
  const port = useClientesPort();
  const [estado, setEstado] = useState<Estado>({ id: null, imagenes: SIN_IMAGENES, error: null });

  useEffect(() => {
    if (pagoRecibidoId === null) return undefined;
    const ctrl = new AbortController();
    port
      .listarImagenesPago(pagoRecibidoId, ctrl.signal)
      .then((imagenes) => {
        if (!ctrl.signal.aborted) setEstado({ id: pagoRecibidoId, imagenes, error: null });
      })
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted) setEstado({ id: pagoRecibidoId, imagenes: SIN_IMAGENES, error: toDomainError(e) });
      });
    return () => ctrl.abort();
  }, [port, pagoRecibidoId]);

  const vigente = pagoRecibidoId !== null && estado.id === pagoRecibidoId;
  return {
    imagenes: vigente ? estado.imagenes : SIN_IMAGENES,
    isLoading: pagoRecibidoId !== null && !vigente,
    error: vigente ? estado.error : null,
  };
}
