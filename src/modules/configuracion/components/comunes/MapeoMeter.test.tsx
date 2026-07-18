import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MapeoMeter } from "./MapeoMeter";

describe("MapeoMeter", () => {
  it("renders exactly `total` pips", () => {
    const { container } = render(<MapeoMeter filled={2} total={3} />);
    expect(container.querySelectorAll("span[aria-hidden='true']")).toHaveLength(3);
  });

  it("fills exactly `filled` pips", () => {
    const { container } = render(<MapeoMeter filled={2} total={3} />);
    const pips = container.querySelectorAll("span[aria-hidden='true']");
    expect(pips[0].textContent).toBe("▮");
    expect(pips[1].textContent).toBe("▮");
    expect(pips[2].textContent).toBe("▯");
  });

  it("colors empty (0 filled) as muted, not amber or emerald", () => {
    const { container } = render(<MapeoMeter filled={0} total={3} />);
    const pips = container.querySelectorAll("span[aria-hidden='true']");
    pips.forEach((p) => {
      expect(p.className).not.toMatch(/emerald|amber/);
    });
  });

  it("colors partial (0<filled<total) fills as amber", () => {
    const { container } = render(<MapeoMeter filled={1} total={3} />);
    const pips = container.querySelectorAll("span[aria-hidden='true']");
    expect(pips[0].className).toMatch(/amber-500/);
  });

  it("colors complete (filled===total) fills as emerald", () => {
    const { container } = render(<MapeoMeter filled={3} total={3} />);
    const pips = container.querySelectorAll("span[aria-hidden='true']");
    pips.forEach((p) => expect(p.className).toMatch(/emerald-500/));
  });

  it("exposes an aria-label summarizing the count", () => {
    render(<MapeoMeter filled={2} total={3} />);
    expect(screen.getByRole("img", { name: "2 de 3 asignados" })).toBeInTheDocument();
  });

  it("clamps filled to [0, total] defensively", () => {
    const { container } = render(<MapeoMeter filled={5} total={3} />);
    const pips = container.querySelectorAll("span[aria-hidden='true']");
    expect(pips).toHaveLength(3);
    pips.forEach((p) => expect(p.textContent).toBe("▮"));
  });
});
