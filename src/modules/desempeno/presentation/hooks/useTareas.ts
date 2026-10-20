import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TareaConEstado } from "../../domain/entities";
import type { DomainError } from "../../domain/errors";
import { cancelarTarea, listarTareas } from "../../application/usecases/consultas";
import { useDesempenoPort } from "../context/useDesempenoPort";
import { useCargaRemota } from "./lib/useCargaRemota";
import { toDomainError } from "./lib/toDomainError";
import { avisarCambioDeTareas, escucharCambioDeTareas } from "./lib/avisoTareas";
import { mensajeDeErrorTarea } from "./lib/mensajeDeErrorTarea";

export type UseTareas = {
  readonly tareas: readonly TareaConEstado[] | null;
  readonly isLoading: boolean;
  readonly error: DomainError | null;
  readonly refresh: () => void;
  readonly cancelar: (id: string) => Promise<void>;
  readonly cancelando: ReadonlySet<string>;
  readonly mensajeErrorCancelar: string | null;
};

// useTareas: GET /v2/visitas/tareas de la zona (visitas P3, spec §6.2) con el
// estado que deriva el servidor, y cancelar. `zonaId` null = no pedir. Recarga
// cuando cualquier parte del módulo asigna o cancela.
export function useTareas(zonaId: number | null): UseTareas {
  const port = useDesempenoPort();
  const cargar = useMemo(
    () => (zonaId === null ? null : (signal: AbortSignal) => listarTareas(port, zonaId, null, null, signal)),
    [port, zonaId],
  );
  const { datos, isLoading, error, refresh } = useCargaRemota(cargar);
  useEffect(() => escucharCambioDeTareas(refresh), [refresh]);

  // Mismo criterio que asignar: ref contra el doble clic, estado para pintar.
  const enVuelo = useRef(new Set<string>());
  const [cancelando, setCancelando] = useState<ReadonlySet<string>>(new Set());
  const [mensajeErrorCancelar, setMensajeErrorCancelar] = useState<string | null>(null);

  const cancelar = useCallback(
    async (id: string) => {
      if (enVuelo.current.has(id)) return;
      enVuelo.current.add(id);
      setCancelando(new Set(enVuelo.current));
      setMensajeErrorCancelar(null);
      try {
        await cancelarTarea(port, id);
        avisarCambioDeTareas();
      } catch (e) {
        setMensajeErrorCancelar(mensajeDeErrorTarea(toDomainError(e)));
      } finally {
        enVuelo.current.delete(id);
        setCancelando(new Set(enVuelo.current));
      }
    },
    [port],
  );

  return { tareas: datos, isLoading, error, refresh, cancelar, cancelando, mensajeErrorCancelar };
}
