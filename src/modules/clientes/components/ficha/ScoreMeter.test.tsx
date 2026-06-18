import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreMeter, type MeterBand } from "./ScoreMeter";
import { scaleToPercent } from "./meterScale";

const RECOMPRA_BANDS: MeterBand[] = [
  { label: "BAJA", min: 0, color: "gray" },
  { label: "MEDIA", min: 22, color: "amber" },
  { label: "ALTA", min: 53, color: "green" },
];

describe("scaleToPercent", () => {
  it("maps a value linearly within [min,max]", () => {
    expect(scaleToPercent(50, 0, 100)).toBe(50);
    expect(scaleToPercent(0, 0, 100)).toBe(0);
    expect(scaleToPercent(100, 0, 100)).toBe(100);
    expect(scaleToPercent(750, 0, 3000)).toBe(25);
  });

  it("clamps below min and above max", () => {
    expect(scaleToPercent(-10, 0, 100)).toBe(0);
    expect(scaleToPercent(5000, 0, 3000)).toBe(100);
  });

  it("returns 0 for a degenerate scale", () => {
    expect(scaleToPercent(5, 10, 10)).toBe(0);
  });
});

describe("ScoreMeter", () => {
  it("renders the value label, zone labels and boundary ticks", () => {
    render(
      <ScoreMeter
        value={32}
        min={0}
        max={100}
        bands={RECOMPRA_BANDS}
        activeBand="MEDIA"
        valueLabel="32"
        tickFormat={(n) => String(n)}
      />,
    );
    expect(screen.getByText("32")).toBeInTheDocument(); // floating value
    expect(screen.getByText("MEDIA")).toBeInTheDocument(); // active zone label
    expect(screen.getByText("22")).toBeInTheDocument(); // boundary tick
    expect(screen.getByText("53")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("hides a boundary tick when tickFormat returns an empty string", () => {
    render(
      <ScoreMeter
        value={300}
        min={0}
        max={3000}
        bands={[
          { label: "BAJO", min: 0, color: "gray" },
          { label: "ALTO", min: 1226, color: "green" },
        ]}
        activeBand="BAJO"
        valueLabel="$300"
        tickFormat={(n) => (n === 0 ? "" : `$${n}`)}
      />,
    );
    expect(screen.queryByText("$0")).not.toBeInTheDocument();
    expect(screen.getByText("$1226")).toBeInTheDocument();
    expect(screen.getByText("$3000")).toBeInTheDocument();
  });
});
