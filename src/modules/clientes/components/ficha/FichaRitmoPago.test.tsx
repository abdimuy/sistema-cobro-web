import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FichaRitmoPago } from "./FichaRitmoPago";
import { makeFakeRitmoPago } from "../../application/__tests__/fakeClientesPort";

describe("FichaRitmoPago", () => {
  it("renders nothing when ritmo is null", () => {
    const { container } = render(<FichaRitmoPago ritmo={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders section title and caption", () => {
    const ritmo = makeFakeRitmoPago();
    render(<FichaRitmoPago ritmo={ritmo} />);
    expect(screen.getByText("Ritmo de pago")).toBeInTheDocument();
    expect(screen.getByText(/últimos 12 meses/i)).toBeInTheDocument();
  });

  it("window is anchored to last activity, not Date.now()", () => {
    // All 4 semanas are in May 2026 (well in the past from today's current date).
    // The window should still show them because it anchors to the last active week.
    const ritmo = makeFakeRitmoPago();
    render(<FichaRitmoPago ritmo={ritmo} />);
    // With window anchored to last activity, all 4 weeks should be visible.
    // constancia = 75% (3/4) → expect to find that in the summary
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("summary is calculated from the visible window (relative)", () => {
    const ritmo = makeFakeRitmoPago();
    render(<FichaRitmoPago ritmo={ritmo} />);
    // RACHA ACTUAL: consecutive paid from end = 1 (May 25 paid, May 18 zero)
    expect(screen.getByText("1")).toBeInTheDocument(); // racha value
    // CONSTANCIA = 75%
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("history panel shows year rows when toggled", () => {
    const ritmo = makeFakeRitmoPago();
    render(<FichaRitmoPago ritmo={ritmo} />);

    // Panel hidden by default
    expect(screen.queryByText("2026")).toBeNull(); // year label not shown initially

    // Toggle history
    const btn = screen.getByRole("button", { name: /historial completo/i });
    fireEvent.click(btn);

    // Year label "2026" should now appear in the history panel
    expect(screen.getAllByText("2026").length).toBeGreaterThan(0);

    // Button changes to "Ocultar historial"
    expect(screen.getByRole("button", { name: /ocultar historial/i })).toBeInTheDocument();
  });

  it("cell with max monto uses darkest green class (relative intensity)", () => {
    // May 25 has monto 1500, which is the max → should be g4 (darkest)
    // May 4 has monto 1200 = 80% of max → > 75% → g4
    // May 11 has monto 850 = 56.7% of max → > 50%, <= 75% → g3
    // May 18 has monto 0 → g0
    const ritmo = makeFakeRitmoPago();
    const { container } = render(<FichaRitmoPago ritmo={ritmo} />);

    // Find cells with aria-labels
    const maxCell = container.querySelector('[aria-label*="25"]') ??
      container.querySelector('[aria-label*="$1,500"]');
    expect(maxCell).not.toBeNull();
    // Should have darkest green background
    expect(maxCell?.className).toContain("hsl(150,78%,24%)");
  });

  it("event icons render with aria-labels", () => {
    const ritmo = makeFakeRitmoPago();
    render(<FichaRitmoPago ritmo={ritmo} />);
    // The liquidacion event is on May 15 which falls in the week May 11-17
    // (semanaInicio = May 11, which is in the visible window)
    const liquidacion = screen.queryAllByLabelText(/Liquidaci[oó]n/i);
    // May 15 falls in week starting May 11 — should be visible
    expect(liquidacion.length).toBeGreaterThan(0);
  });

  it("does not crash with empty semanas array", () => {
    const ritmo = makeFakeRitmoPago({ semanas: [] });
    render(<FichaRitmoPago ritmo={ritmo} />);
    expect(screen.getByText("Ritmo de pago")).toBeInTheDocument();
    expect(screen.getByText(/Sin semanas en este período/i)).toBeInTheDocument();
  });

  it("renders isLoading with no ritmo as null", () => {
    const { container } = render(<FichaRitmoPago ritmo={null} isLoading />);
    expect(container.firstChild).toBeNull();
  });
});
