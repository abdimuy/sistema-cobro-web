import { useEffect, useRef } from "react";

export const UN_MINUTO_MS = 60_000;

// useCadaMinuto llama `alTocar` cada 60 s mientras `activo` (spec §5: el
// tablero se actualiza cada minuto). Siempre llama a la versión más reciente.
//
// Con la ventana oculta (minimizada, otra pestaña) se pausa: no se piden datos
// que nadie ve. Al volver a ser visible refresca una vez en ese momento y
// reanuda el ritmo de 60 s.
export function useCadaMinuto(alTocar: () => void, activo: boolean): void {
  const ultimo = useRef(alTocar);
  useEffect(() => {
    ultimo.current = alTocar;
  }, [alTocar]);
  useEffect(() => {
    if (!activo) return undefined;
    let id: number | null = null;
    const arrancar = () => {
      if (id === null) id = window.setInterval(() => ultimo.current(), UN_MINUTO_MS);
    };
    const detener = () => {
      if (id !== null) window.clearInterval(id);
      id = null;
    };
    const alCambiarVisibilidad = () => {
      if (document.hidden) {
        detener();
      } else if (id === null) {
        ultimo.current();
        arrancar();
      }
    };
    if (!document.hidden) arrancar();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      detener();
    };
  }, [activo]);
}
