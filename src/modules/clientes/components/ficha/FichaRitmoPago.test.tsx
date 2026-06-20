import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { FichaRitmoPago } from "./FichaRitmoPago";
import { makeFakeRitmoPago } from "../../application/__tests__/fakeClientesPort";
import type { Pulso } from "../../domain/entities/FichaCliente";

function makeFakePulso(overrides: Partial<Pulso> = {}): Pulso {
  const base: Pulso = {
    score: 75,
    segmento: "LEAL_POR_LIQUIDAR",
    estadoPago: "AL_CORRIENTE",
    recenciaDias: 30,
    frecuencia: 12,
    monetary: "85000.00",
    saldo: "13000.00",
    porLiquidarPct: "15.29",
    fechaUltimaCompra: new Date("2025-02-15T09:00:00Z"),
    fechaUltimoPago: new Date("2025-03-01T14:30:00Z"),
    nextBestProduct: "Comedor 6 personas",
    numPagos: 48,
    cadenciaDias: 14,
    diasAtrasoProm: 5,
    pctPagosATiempo: "94.68",
    fechaProxPago: new Date("2026-01-12T12:00:00Z"),
    montoProxPago: "4000.00",
    tierRiesgo: "AL_DIA",
    bandaCredito: "BAJO",
    scoreCredito: 91,
    bandaRecompra: "MEDIA",
    scoreRecompra: 32,
    clv: "302.17",
    bandaClv: "MEDIO",
  };
  return { ...base, ...overrides };
}

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

  it("window ends at today — includes trailing unpaid weeks for delinquent client", () => {
    // Fixture: May paid weeks followed by 3 unpaid weeks (Jun 1, Jun 8, Jun 15 2026).
    // Backend generates through current week, so the tail IS today's end.
    const ritmo = makeFakeRitmoPago({
      semanas: [
        { semanaInicio: new Date("2026-05-04T00:00:00.000Z"), montoAbonado: "1200.00", saldo: "8300.00", numPagos: 1, pagoIds: [] },
        { semanaInicio: new Date("2026-05-11T00:00:00.000Z"), montoAbonado: "850.00",  saldo: "7450.00", numPagos: 1, pagoIds: [] },
        { semanaInicio: new Date("2026-05-25T00:00:00.000Z"), montoAbonado: "1500.00", saldo: "5950.00", numPagos: 1, pagoIds: [] },
        { semanaInicio: new Date("2026-06-01T00:00:00.000Z"), montoAbonado: "0.00",    saldo: "5950.00", numPagos: 0, pagoIds: [] },
        { semanaInicio: new Date("2026-06-08T00:00:00.000Z"), montoAbonado: "0.00",    saldo: "5950.00", numPagos: 0, pagoIds: [] },
        { semanaInicio: new Date("2026-06-15T00:00:00.000Z"), montoAbonado: "0.00",    saldo: "5950.00", numPagos: 0, pagoIds: [] },
      ],
    });
    render(<FichaRitmoPago ritmo={ritmo} />);
    // Trailing gray cells: 3 weeks without payment → RACHA ACTUAL = 0
    const rachaEl = screen.getByText("RACHA ACTUAL", { exact: false });
    expect(rachaEl).toBeInTheDocument();
    // racha = 0 because last 3 weeks have montoAbonado=0
    // The "0" value appears in the summary strip
    expect(screen.getByText("0")).toBeInTheDocument();
    // Trailing gray cells are rendered for Jun 1, Jun 8, Jun 15 (Sin pago)
    const grayCells = document.querySelectorAll('[aria-label*="Sin pago"]');
    expect(grayCells.length).toBeGreaterThanOrEqual(3);
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

  it("shows CADENCIA and ATRASO PROM when pulso is provided", () => {
    const ritmo = makeFakeRitmoPago();
    const pulso = makeFakePulso({ cadenciaDias: 14, diasAtrasoProm: 5 });
    render(<FichaRitmoPago ritmo={ritmo} pulso={pulso} />);
    expect(screen.getByText("CADENCIA")).toBeInTheDocument();
    expect(screen.getByText("ATRASO PROM")).toBeInTheDocument();
    // Values + units appear inline
    expect(screen.getAllByText(/14/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/5/).length).toBeGreaterThan(0);
  });

  it("does not show CADENCIA or ATRASO PROM when pulso is absent", () => {
    const ritmo = makeFakeRitmoPago();
    render(<FichaRitmoPago ritmo={ritmo} />);
    expect(screen.queryByText("CADENCIA")).not.toBeInTheDocument();
    expect(screen.queryByText("ATRASO PROM")).not.toBeInTheDocument();
  });

  it("does not show CADENCIA or ATRASO PROM when pulso is null", () => {
    const ritmo = makeFakeRitmoPago();
    render(<FichaRitmoPago ritmo={ritmo} pulso={null} />);
    expect(screen.queryByText("CADENCIA")).not.toBeInTheDocument();
    expect(screen.queryByText("ATRASO PROM")).not.toBeInTheDocument();
  });
});

describe("FichaRitmoPago — onPagoClick", () => {
  it("cell with one pagoId calls onPagoClick with that id on click", async () => {
    const onPagoClick = vi.fn();
    const ritmo = makeFakeRitmoPago({
      semanas: [
        {
          semanaInicio: new Date("2026-05-11T00:00:00.000Z"),
          montoAbonado: "850.00",
          saldo: "7450.00",
          numPagos: 1,
          pagoIds: [70234],
        },
      ],
      eventos: [],
    });
    render(<FichaRitmoPago ritmo={ritmo} onPagoClick={onPagoClick} />);

    // aria-label uses toLocaleDateString — match on the money amount which is unique
    const cell = screen.getByRole("button", { name: /\$850\.00/ });
    await userEvent.click(cell);

    expect(onPagoClick).toHaveBeenCalledWith(70234);
    expect(onPagoClick).toHaveBeenCalledTimes(1);
  });

  it("cell with multiple pagoIds opens mini-picker, selecting one calls onPagoClick", async () => {
    const onPagoClick = vi.fn();
    const ritmo = makeFakeRitmoPago({
      semanas: [
        {
          semanaInicio: new Date("2026-05-11T00:00:00.000Z"),
          montoAbonado: "1500.00",
          saldo: "6000.00",
          numPagos: 2,
          pagoIds: [70234, 70235],
        },
      ],
      eventos: [],
    });
    render(<FichaRitmoPago ritmo={ritmo} onPagoClick={onPagoClick} />);

    const cell = screen.getByRole("button", { name: /\$1,500\.00/ });
    await userEvent.click(cell);

    // Picker should appear
    expect(screen.getByRole("listbox", { name: /seleccionar pago/i })).toBeInTheDocument();
    expect(onPagoClick).not.toHaveBeenCalled();

    // Select the second option
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    await userEvent.click(options[1]);

    expect(onPagoClick).toHaveBeenCalledWith(70235);
    expect(onPagoClick).toHaveBeenCalledTimes(1);
    // Picker closes after selection
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("cell with empty pagoIds is not a button (non-clickable)", () => {
    const onPagoClick = vi.fn();
    const ritmo = makeFakeRitmoPago({
      semanas: [
        {
          semanaInicio: new Date("2026-05-18T00:00:00.000Z"),
          montoAbonado: "0.00",
          saldo: "7450.00",
          numPagos: 0,
          pagoIds: [],
        },
      ],
      eventos: [],
    });
    render(<FichaRitmoPago ritmo={ritmo} onPagoClick={onPagoClick} />);

    // No button for this cell (no pagoIds) — it renders as a div
    const cellButton = screen.queryByRole("button", { name: /Sin pago/ });
    expect(cellButton).toBeNull();
    // The div is still rendered with the aria-label
    expect(screen.getByLabelText(/Sin pago/)).toBeInTheDocument();
  });

  it("renders without onPagoClick (back-compat — no crash, cells non-clickable)", () => {
    const ritmo = makeFakeRitmoPago({
      semanas: [
        {
          semanaInicio: new Date("2026-05-11T00:00:00.000Z"),
          montoAbonado: "850.00",
          saldo: "7450.00",
          numPagos: 1,
          pagoIds: [70234],
        },
      ],
      eventos: [],
    });
    render(<FichaRitmoPago ritmo={ritmo} />);
    // No button rendered for the heatmap cell when onPagoClick is absent
    const cellButton = screen.queryByRole("button", { name: /\$850\.00/ });
    expect(cellButton).toBeNull();
    // Still renders correctly
    expect(screen.getByText("Ritmo de pago")).toBeInTheDocument();
  });

  it("picker closes on Escape key", async () => {
    const onPagoClick = vi.fn();
    const ritmo = makeFakeRitmoPago({
      semanas: [
        {
          semanaInicio: new Date("2026-05-11T00:00:00.000Z"),
          montoAbonado: "1500.00",
          saldo: "6000.00",
          numPagos: 2,
          pagoIds: [70234, 70235],
        },
      ],
      eventos: [],
    });
    render(<FichaRitmoPago ritmo={ritmo} onPagoClick={onPagoClick} />);

    const cell = screen.getByRole("button", { name: /\$1,500\.00/ });
    await userEvent.click(cell);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onPagoClick).not.toHaveBeenCalled();
  });

  it("multi-pago cell activated via keyboard opens the picker", async () => {
    const onPagoClick = vi.fn();
    const ritmo = makeFakeRitmoPago({
      semanas: [
        {
          semanaInicio: new Date("2026-05-11T00:00:00.000Z"),
          montoAbonado: "1500.00",
          saldo: "6000.00",
          numPagos: 2,
          pagoIds: [70234, 70235],
        },
      ],
      eventos: [],
    });
    render(<FichaRitmoPago ritmo={ritmo} onPagoClick={onPagoClick} />);

    const cell = screen.getByRole("button", { name: /\$1,500\.00/ });
    fireEvent.keyDown(cell, { key: "Enter" });

    expect(screen.getByRole("listbox", { name: /seleccionar pago/i })).toBeInTheDocument();
    expect(onPagoClick).not.toHaveBeenCalled();
  });

  it("picker closes on click-outside (mousedown) without calling onPagoClick", async () => {
    const onPagoClick = vi.fn();
    const ritmo = makeFakeRitmoPago({
      semanas: [
        {
          semanaInicio: new Date("2026-05-11T00:00:00.000Z"),
          montoAbonado: "1500.00",
          saldo: "6000.00",
          numPagos: 2,
          pagoIds: [70234, 70235],
        },
      ],
      eventos: [],
    });
    render(<FichaRitmoPago ritmo={ritmo} onPagoClick={onPagoClick} />);

    const cell = screen.getByRole("button", { name: /\$1,500\.00/ });
    await userEvent.click(cell);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onPagoClick).not.toHaveBeenCalled();
  });
});

describe("FichaRitmoPago — onVentaClick", () => {
  it("icon button with doctoPvId>0 calls onVentaClick when clicked", async () => {
    // The liquidacion event (May 15) falls in the week starting May 11,
    // which is in the visible window. folio=CV-00589, doctoPvId=30021.
    const onVentaClick = vi.fn();
    const ritmo = makeFakeRitmoPago();
    render(<FichaRitmoPago ritmo={ritmo} onVentaClick={onVentaClick} />);

    // Find any "Ver venta" button — liquidacion (CV-00589) is in visible window (May 11 week)
    const btn = await screen.findByRole("button", { name: /Ver venta CV-00589/i });
    await userEvent.click(btn);

    expect(onVentaClick).toHaveBeenCalledWith(30021);
  });

  it("event with doctoPvId=0 does not render a button", () => {
    const onVentaClick = vi.fn();
    const ritmo = makeFakeRitmoPago({
      semanas: [
        {
          semanaInicio: new Date("2026-05-11T00:00:00.000Z"),
          montoAbonado: "850.00",
          saldo: "7450.00",
          numPagos: 1,
          pagoIds: [],
        },
      ],
      eventos: [
        {
          fecha: new Date("2026-05-12T00:00:00.000Z"),
          tipo: "liquidacion",
          monto: "0.00",
          doctoPvId: 0,
          folio: "",
          plazoMeses: 0,
        },
      ],
    });
    render(<FichaRitmoPago ritmo={ritmo} onVentaClick={onVentaClick} />);

    // No "Ver venta" button should be rendered for doctoPvId=0
    expect(screen.queryByRole("button", { name: /Ver venta/i })).toBeNull();
  });
});
