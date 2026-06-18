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
  it("renders with correct aria-label", () => {
    render(
      <ScoreMeter
        value={32}
        min={0}
        max={100}
        bands={RECOMPRA_BANDS}
        activeBand="MEDIA"
      />,
    );
    expect(screen.getByLabelText("Medidor MEDIA")).toBeInTheDocument();
  });

  it("renders one segment per band", () => {
    render(
      <ScoreMeter
        value={32}
        min={0}
        max={100}
        bands={RECOMPRA_BANDS}
        activeBand="MEDIA"
      />,
    );
    // The outer aria-label div is the meter; it renders without text (no labels/ticks)
    expect(screen.getByLabelText("Medidor MEDIA")).toBeInTheDocument();
    // No text nodes from old labels/ticks
    expect(screen.queryByText("MEDIA")).not.toBeInTheDocument();
    expect(screen.queryByText("22")).not.toBeInTheDocument();
  });

  it("does not render band labels or tick values", () => {
    render(
      <ScoreMeter
        value={32}
        min={0}
        max={100}
        bands={RECOMPRA_BANDS}
        activeBand="MEDIA"
      />,
    );
    expect(screen.queryByText("BAJA")).not.toBeInTheDocument();
    expect(screen.queryByText("ALTA")).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("100")).not.toBeInTheDocument();
  });
});
