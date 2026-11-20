import { useEffect, useState, type RefObject } from "react";

/**
 * Ancho de la barra de filtros por debajo del cual Vistas, Densidad y Columnas
 * pasan al menú "Más" (decisión del dueño, 2026-11-20: opción C). Con todo en
 * línea la barra mide ~1,010 px (buscador 200 + origen + vista + fecha +
 * filtros + densidad + columnas + separaciones).
 */
export const ANCHO_BARRA_COMPLETA = 1020;

/**
 * true cuando el contenedor mide menos que `umbral`. Mide el contenedor, no la
 * ventana: también responde al menú lateral abierto. Sin ResizeObserver (jsdom)
 * se queda en false: todo en línea.
 */
export function useBarraAngosta(ref: RefObject<HTMLElement | null>, umbral = ANCHO_BARRA_COMPLETA) {
  const [angosta, setAngosta] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entradas) => {
      const ancho = entradas[0]?.contentRect.width ?? el.getBoundingClientRect().width;
      setAngosta(ancho > 0 && ancho < umbral);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, umbral]);
  return angosta;
}
