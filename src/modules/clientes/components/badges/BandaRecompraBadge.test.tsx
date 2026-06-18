import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BandaRecompraBadge from "./BandaRecompraBadge";

describe("BandaRecompraBadge", () => {
  it("renders 'Recompra alta' with green class for ALTA", () => {
    const { container } = render(<BandaRecompraBadge value="ALTA" />);
    expect(screen.getByText("Recompra alta")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/green/);
  });

  it("renders 'Recompra media' with amber class for MEDIA", () => {
    const { container } = render(<BandaRecompraBadge value="MEDIA" />);
    expect(screen.getByText("Recompra media")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/amber/);
  });

  it("renders 'Recompra baja' with gray class for BAJA", () => {
    const { container } = render(<BandaRecompraBadge value="BAJA" />);
    expect(screen.getByText("Recompra baja")).toBeInTheDocument();
    const badge = container.querySelector("span");
    expect(badge?.className).toMatch(/gray/);
  });

  it("renders nothing for empty string", () => {
    const { container } = render(<BandaRecompraBadge value="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for undefined", () => {
    const { container } = render(<BandaRecompraBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for unknown value", () => {
    const { container } = render(<BandaRecompraBadge value="DESCONOCIDO" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the dot span inside the badge", () => {
    const { container } = render(<BandaRecompraBadge value="ALTA" />);
    const spans = container.querySelectorAll("span");
    // outer span (badge) + inner span (dot)
    expect(spans.length).toBeGreaterThanOrEqual(2);
    const dotSpan = spans[1];
    expect(dotSpan.className).toMatch(/rounded-full/);
  });
});
