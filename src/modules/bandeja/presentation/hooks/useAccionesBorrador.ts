import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useBandeja } from "../context/BandejaContext";
import { toDomainError } from "./lib/toDomainError";
import type { DecisionResult } from "../../domain/entities";

export type EstadoAccionesBorrador = "idle" | "enviando" | "hecho" | "error";

export type UseAccionesBorradorReturn = {
  estado: EstadoAccionesBorrador;
  aprobar: () => Promise<void>;
  editar: (texto: string) => Promise<void>;
  dictar: (intencion: string) => Promise<{ borrador: string } | null>;
  escalar: (asignadoA: string) => Promise<void>;
  simular: (mensaje: string) => Promise<DecisionResult | null>;
};

// useAccionesBorrador drives the composer's mutations for one cliente's
// draft: aprobar/editar/dictar/escalar/simular. Every action funnels
// through runAccion so the state machine (idle → enviando → hecho|error),
// the onDone refetch and the toast are handled once. enviandoRef (not
// state) guards double-submit — a state read inside the callback would be
// stale on the very re-render a fast double-click races against.
export function useAccionesBorrador(
  clienteId: number | null,
  onDone: () => void,
): UseAccionesBorradorReturn {
  const { port } = useBandeja();
  const [estado, setEstado] = useState<EstadoAccionesBorrador>("idle");
  const enviandoRef = useRef(false);

  const runAccion = useCallback(
    async <T,>(
      accion: (id: number) => Promise<T>,
      successMessage: string,
      errorMessage: string,
    ): Promise<T | null> => {
      if (clienteId == null || enviandoRef.current) return null;

      enviandoRef.current = true;
      setEstado("enviando");
      try {
        const result = await accion(clienteId);
        setEstado("hecho");
        toast.success(successMessage);
        onDone();
        return result;
      } catch (e) {
        const err = toDomainError(e);
        setEstado("error");
        toast.error(errorMessage, { description: err.message });
        return null;
      } finally {
        enviandoRef.current = false;
      }
    },
    [clienteId, onDone],
  );

  const aprobar = useCallback(async () => {
    await runAccion((id) => port.aprobar(id), "Mensaje aprobado y enviado", "No se pudo aprobar el mensaje");
  }, [runAccion, port]);

  const editar = useCallback(
    async (texto: string) => {
      await runAccion(
        (id) => port.editar(id, texto),
        "Mensaje editado y enviado",
        "No se pudo enviar el mensaje editado",
      );
    },
    [runAccion, port],
  );

  const dictar = useCallback(
    async (intencion: string) => {
      return runAccion(
        (id) => port.dictar(id, intencion),
        "Nuevo borrador generado",
        "No se pudo generar el borrador",
      );
    },
    [runAccion, port],
  );

  const escalar = useCallback(
    async (asignadoA: string) => {
      await runAccion(
        (id) => port.escalar(id, asignadoA),
        "Conversación escalada",
        "No se pudo escalar la conversación",
      );
    },
    [runAccion, port],
  );

  const simular = useCallback(
    async (mensaje: string) => {
      return runAccion(
        (id) => port.simularEntrante(id, mensaje),
        "Mensaje simulado",
        "No se pudo simular el mensaje entrante",
      );
    },
    [runAccion, port],
  );

  return { estado, aprobar, editar, dictar, escalar, simular };
}
