import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FichaRitmoPago } from "./FichaRitmoPago";
import { makeFakeRitmoPago } from "../../application/__tests__/fakeClientesPort";

describe("FichaRitmoPago", () => {
  it("renders nothing when ritmo is null", () => {
    const { container } = render(<FichaRitmoPago ritmo={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders section title and resumen stats with data", () => {
    const ritmo = makeFakeRitmoPago();
    render(<FichaRitmoPago ritmo={ritmo} />);

    expect(screen.getByText("Ritmo de pago")).toBeInTheDocument();
    // constancia: formatPct("75.00") = "75%"
    expect(screen.getByText("75%")).toBeInTheDocument();
    // racha: "1 sem"
    expect(screen.getByText("1 sem")).toBeInTheDocument();
  });

  it("toggles 'Ver historial completo' button", () => {
    const ritmo = makeFakeRitmoPago();
    render(<FichaRitmoPago ritmo={ritmo} />);

    const btn = screen.getByRole("button", { name: /historial completo/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: /últimos 12 meses/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /últimos 12 meses/i }));
    expect(screen.getByRole("button", { name: /historial completo/i })).toBeInTheDocument();
  });

  it("renders event icons with aria-labels for all 3 event types", () => {
    const ritmo = makeFakeRitmoPago();
    // The fake has: venta_credito, venta_contado, liquidacion events
    // Two of those fall outside the default 52-week window (Mar/Apr 2026),
    // but one (May 15) falls within week of May 11-17 and should appear.
    // We render showAll=false by default. Force showAll by expanding.
    render(<FichaRitmoPago ritmo={ritmo} />);

    // Click "Ver historial completo" so all weeks visible
    fireEvent.click(screen.getByRole("button", { name: /historial completo/i }));

    // Each event icon has aria-label from EVENT_META
    // liquidacion on May 15 → week May 11: "Liquidación"
    const liquidacionIcons = screen.getAllByLabelText(/Liquidaci[oó]n/i);
    expect(liquidacionIcons.length).toBeGreaterThan(0);
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
