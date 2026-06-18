import { scaleToPercent } from "./meterScale";

// ScoreMeter — a simple horizontal band thermometer with solid colored segments
// and a single marker tick. No labels, no floating value, no animation.

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
  activeBand: string; // authoritative band from backend
}

const BAND_BG: Record<BandColor, string> = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  gray: "bg-gray-400",
};

export function ScoreMeter({
  value,
  min,
  max,
  bands,
  activeBand,
}: ScoreMeterProps) {
  const pos = scaleToPercent(value, min, max);

  const segments = bands.map((b, i) => {
    const end = i < bands.length - 1 ? bands[i + 1].min : max;
    const segMin = scaleToPercent(b.min, min, max);
    const segMax = scaleToPercent(end, min, max);
    const widthPct = segMax - segMin;
    return { ...b, widthPct };
  });

  return (
    <div className="select-none" aria-label={`Medidor ${activeBand}`}>
      {/* Track with segments + marker */}
      <div className="relative">
        <div className="flex h-[10px] w-full overflow-hidden rounded-full">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className={BAND_BG[seg.color]}
              style={{ width: `${seg.widthPct}%` }}
            />
          ))}
        </div>
        {/* Single marker tick */}
        <div
          className="absolute top-1/2 h-[14px] w-[2px] -translate-y-1/2 bg-foreground"
          style={{ left: `${pos}%` }}
        />
      </div>
    </div>
  );
}
