import { useEffect, useState } from "react";

// Por debajo de este ancho la línea 7–20 h deja de leerse (spec §5: aviso en
// pantalla angosta).
export const CONSULTA_PANTALLA_ANGOSTA = "(max-width: 1100px)";

export function useEsPantallaAngosta(): boolean {
  const [angosta, setAngosta] = useState(
    () => window.matchMedia(CONSULTA_PANTALLA_ANGOSTA).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(CONSULTA_PANTALLA_ANGOSTA);
    const alCambiar = (e: MediaQueryListEvent) => setAngosta(e.matches);
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);
  return angosta;
}
