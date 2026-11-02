// Distancia en metros (haversine). Sólo decide cómo pintar los marcadores
// Inicio/Fin; no es un dato del negocio.
export function distanciaMetros(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Debajo de esta distancia Inicio y Fin se pintan en un solo marcador. */
export const UMBRAL_FUSION_M = 150;
