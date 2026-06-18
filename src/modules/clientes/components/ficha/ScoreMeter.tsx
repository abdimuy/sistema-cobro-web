import { useEffect, useState } from "react";
import { scaleToPercent } from "./meterScale";

// ScoreMeter — a refined horizontal band thermometer. It places a client's value
// on a linear scale divided into the model's band zones, so a label like "media"
// gains visual context: you see where the marker sits relative to the band
// boundaries. Editorial/luxury treatment — precise, restrained, CSS-only motion.

export type BandColor = "green" | "amber" | "orange" | "red" | "gray";

export interface MeterBand {
  label: string;
  min: number; // band starts here (ascending); spans [min, nextBand.min) or [min, max]
  color: BandColor;
}

export interface ScoreMeterProps {
  value: number;
  min: number;
  max: number;
  bands: MeterBand[]; // ascending by min
  activeBand: string; // authoritative band from the backend — the zone to highlight
  valueLabel: string; // floats above the marker ("32" or "$302")
  tickFormat: (n: number) => string;
  delayMs?: number; // stagger the entrance animation
}

// Idle zones are deliberately legible (~/35) so the whole scale reads as a band
// of colors, not just the active segment; the active zone goes near-solid (/70)
// and adds a top accent + the marker so it still clearly dominates.
const COLOR: Record<
  BandColor,
  { idle: string; active: string; accent: string; text: string; marker: string }
> = {
  green: {
    idle: "bg-green-500/35",
    active: "bg-green-500/70",
    accent: "bg-green-500",
    text: "text-green-500",
    marker: "bg-green-500",
  },
  amber: {
    idle: "bg-amber-500/35",
    active: "bg-amber-500/70",
    accent: "bg-amber-500",
    text: "text-amber-500",
    marker: "bg-amber-500",
  },
  orange: {
    idle: "bg-orange-500/35",
    active: "bg-orange-500/70",
    accent: "bg-orange-500",
    text: "text-orange-500",
    marker: "bg-orange-500",
  },
  red: {
    idle: "bg-red-500/35",
    active: "bg-red-500/70",
    accent: "bg-red-500",
    text: "text-red-500",
    marker: "bg-red-500",
  },
  gray: {
    idle: "bg-gray-500/30",
    active: "bg-gray-400/55",
    accent: "bg-gray-400",
    text: "text-gray-400",
    marker: "bg-gray-400",
  },
};

export function ScoreMeter({
  value,
  min,
  max,
  bands,
  activeBand,
  valueLabel,
  tickFormat,
  delayMs = 0,
}: ScoreMeterProps) {
  // Animate the marker in from the left on mount (CSS transition on `left`).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const pos = scaleToPercent(value, min, max);
  const activeIdx = bands.findIndex((b) => b.label === activeBand);
  const activeColor = COLOR[bands[activeIdx]?.color ?? "gray"];

  const zones = bands.map((b, i) => {
    const end = i < bands.length - 1 ? bands[i + 1].min : max;
    const left = scaleToPercent(b.min, min, max);
    const width = scaleToPercent(end, min, max) - left;
    return { ...b, left, width, active: i === activeIdx };
  });

  // Tick labels at every band boundary plus the scale max.
  const ticks = [...bands.map((b) => b.min), max];

  return (
    <div className="select-none" aria-label={`Medidor ${activeBand}`}>
      {/* Floating value marker */}
      <div className="relative h-6">
        <div
          className="absolute bottom-0 transition-[left] duration-700 ease-out motion-reduce:transition-none"
          style={{ left: `${mounted ? pos : 0}%`, transitionDelay: `${delayMs}ms` }}
        >
          <div className="flex -translate-x-1/2 flex-col items-center">
            <span
              className={`font-mono text-xs font-semibold tabular-nums ${activeColor.text}`}
            >
              {valueLabel}
            </span>
            <div className={`mt-1 h-2 w-2 rotate-45 rounded-[1px] ${activeColor.marker}`} />
          </div>
        </div>
      </div>

      {/* Track */}
      <div className="relative flex h-[7px] w-full overflow-hidden rounded-full bg-muted/30">
        {zones.map((z) => {
          const c = COLOR[z.color];
          return (
            <div
              key={z.label}
              className={`relative h-full ${z.active ? c.active : c.idle}`}
              style={{ width: `${z.width}%` }}
            >
              {z.active && (
                <div className={`absolute inset-x-0 top-0 h-[1.5px] ${c.accent}`} />
              )}
            </div>
          );
        })}
        <div
          className={`absolute -bottom-1 -top-1 w-[1.5px] transition-[left] duration-700 ease-out motion-reduce:transition-none ${activeColor.marker}`}
          style={{ left: `${mounted ? pos : 0}%`, transitionDelay: `${delayMs}ms` }}
        />
      </div>

      {/* Zone labels (skip zones too narrow to fit a centered label) */}
      <div className="relative mt-1.5 h-3">
        {zones.map((z) => {
          if (z.width < 14) return null;
          const c = COLOR[z.color];
          return (
            <span
              key={z.label}
              className={`absolute -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.1em] ${
                z.active ? `${c.text} font-semibold` : "text-muted-foreground/45"
              }`}
              style={{ left: `${z.left + z.width / 2}%` }}
            >
              {z.label}
            </span>
          );
        })}
      </div>

      {/* Boundary tick values — the scale reference ("what is medio") */}
      <div className="relative mt-0.5 h-3">
        {ticks.map((t, i) => {
          const label = tickFormat(t);
          if (!label) return null; // tickFormat may return "" to hide a boundary
          const align =
            i === 0
              ? "translate-x-0"
              : i === ticks.length - 1
                ? "-translate-x-full"
                : "-translate-x-1/2";
          return (
            <span
              key={i}
              className={`absolute font-mono text-[9px] tabular-nums text-muted-foreground/40 ${align}`}
              style={{ left: `${scaleToPercent(t, min, max)}%` }}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
