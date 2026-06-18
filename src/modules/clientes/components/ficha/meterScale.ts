// Pure scale helper for ScoreMeter, kept in its own module so the component file
// only exports components (react-refresh/only-export-components).

/** Clamp `value` to [min,max] and return its position as a 0–100 percentage. */
export function scaleToPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  const pct = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, pct));
}
