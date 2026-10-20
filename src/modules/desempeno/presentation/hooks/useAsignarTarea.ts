import { useCallback, useRef, useState } from "react";
import type { NuevaTarea, Tarea } from "../../domain/entities";
import { asignarTarea } from "../../application/usecases/consultas";
import { useDesempenoPort } from "../context/useDesempenoPort";
import { toDomainError } from "./lib/toDomainError";
import { avisarCambioDeTareas } from "./lib/avisoTareas";
import { mensajeDeErrorTarea } from "./lib/mensajeDeErrorTarea";

export type EstadoEnvioTarea = "idle" | "enviando" | "hecho" | "error";

export type UseAsignarTarea = {
  readonly estado: EstadoEnvioTarea;
  readonly mensajeError: string | null;
  readonly asignar: (cuerpo: NuevaTarea) => Promise<void>;
};

// useAsignarTarea: POST /v2/visitas/tareas (visitas P3, spec §6.2) con la
// máquina idle → enviando → hecho | error de useAccionesBorrador. La guarda
// contra el doble envío es un ref y no el estado: el estado leído dentro del
// callback está viejo justo en el render contra el que compite un doble clic.
// El id lo trae el cuerpo (lo generó el diálogo al abrirse), así que un
// reintento tras un error es la misma tarea para el servidor.
export function useAsignarTarea(onHecho: (t: Tarea) => void): UseAsignarTarea {
  const port = useDesempenoPort();
  const [estado, setEstado] = useState<EstadoEnvioTarea>("idle");
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const enviandoRef = useRef(false);

  const asignar = useCallback(
    async (cuerpo: NuevaTarea) => {
      if (enviandoRef.current) return;
      enviandoRef.current = true;
      setEstado("enviando");
      setMensajeError(null);
      try {
        const tarea = await asignarTarea(port, cuerpo);
        setEstado("hecho");
        avisarCambioDeTareas();
        onHecho(tarea);
      } catch (e) {
        setEstado("error");
        setMensajeError(mensajeDeErrorTarea(toDomainError(e)));
      } finally {
        enviandoRef.current = false;
      }
    },
    [port, onHecho],
  );

  return { estado, mensajeError, asignar };
}
