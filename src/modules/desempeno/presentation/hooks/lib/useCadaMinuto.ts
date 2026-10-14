import { useEffect, useRef } from "react";

export const UN_MINUTO_MS = 60_000;

// useCadaMinuto llama `alTocar` cada 60 s mientras `activo` (spec §5: el
// tablero se actualiza cada minuto). Siempre llama a la versión más reciente.
export function useCadaMinuto(alTocar: () => void, activo: boolean): void {
  const ultimo = useRef(alTocar);
  useEffect(() => {
    ultimo.current = alTocar;
  }, [alTocar]);
  useEffect(() => {
    if (!activo) return undefined;
    const id = window.setInterval(() => ultimo.current(), UN_MINUTO_MS);
    return () => window.clearInterval(id);
  }, [activo]);
}
