/** Coordenada utilizable: números finitos, en rango y distinta de 0,0. */
export function coordenadasValidas(
  lat: number | null | undefined,
  lng: number | null | undefined,
): lat is number {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  return !(lat === 0 && lng === 0);
}
