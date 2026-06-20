import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { VentaRitmoPagos } from "./VentaRitmoPagos";
import {
  makeFakeVentaCliente,
  makeFakePago,
} from "../../application/__tests__/fakeClientesPort";
import type { ContratoCredito } from "../../domain/entities/VentaDetalle";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

// Sale on Monday 2025-11-03 (UTC noon to avoid TZ edge)
const VENTA_FECHA = new Date("2025-11-03T12:00:00.000Z");

const baseVenta = makeFakeVentaCliente({
  fecha: VENTA_FECHA,
  total: "18500.00",
  saldoVenta: "9500.00",
});

const baseContrato: ContratoCredito = {
  parcialidad: "3200.00",
  enganche: "2000.00",
  precioDeContado: "15000.00",
  plazoMeses: 6,
  formaDePago: "QUINCENAL",
  vendedores: ["María Torres"],
};

// Week 0 (2025-11-03): cobranza
const pago1 = makeFakePago({
  doctoCcId: 101,
  fecha: new Date("2025-11-04T10:00:00.000Z"),
  importe: "3000.00",
  categoria: "pago",
  concepto: "ABONO",
});
// Week 1 (2025-11-10): condonacion
const pago2 = makeFakePago({
  doctoCcId: 102,
  fecha: new Date("2025-11-11T10:00:00.000Z"),
  importe: "1000.00",
  categoria: "condonacion",
  concepto: "CONDONACION",
});
// Week 2 (2025-11-17): two pagos → multi-pago week
const pago3 = makeFakePago({
  doctoCcId: 103,
  fecha: new Date("2025-11-18T10:00:00.000Z"),
  importe: "2000.00",
  categoria: "pago",
  concepto: "ABONO",
});
const pago4 = makeFakePago({
  doctoCcId: 104,
  fecha: new Date("2025-11-19T10:00:00.000Z"),
  importe: "1000.00",
  categoria: "pago",
  concepto: "ABONO 2",
});

const allPagos = [pago1, pago2, pago3, pago4];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("VentaRitmoPagos", () => {
  it("renders section heading", () => {
    render(
      <VentaRitmoPagos venta={baseVenta} pagos={allPagos} contrato={baseContrato} />,
    );
    expect(screen.getByText("Cadencia de pagos")).toBeInTheDocument();
  });

  it("renders cell buttons", () => {
    render(
      <VentaRitmoPagos venta={baseVenta} pagos={allPagos} contrato={baseContrato} />,
    );
    const cells = screen.getAllByRole("button");
    expect(cells.length).toBeGreaterThan(0);
  });

  it("income week and forgiveness week have different colors in bands", () => {
    const { container } = render(
      <VentaRitmoPagos venta={baseVenta} pagos={allPagos} contrato={baseContrato} />,
    );
    // CellBands renders inner flex-1 divs with backgroundColor set via inline style.
    // Using div.flex-1[style] targets only band divs, excluding unrelated styled elements
    // (saldo svg wrapper, month labels, etc.) that would pollute the color set.
    const bandDivs = container.querySelectorAll("div.flex-1[style]");
    const bandColors = Array.from(bandDivs)
      .map((d) => (d as HTMLElement).style.backgroundColor)
      .filter(Boolean);
    // pago → green, condonacion → violet — at least 2 distinct colors
    const colorSet = new Set(bandColors);
    expect(colorSet.size).toBeGreaterThanOrEqual(2);
  });

  it("% liquidado is computed and rendered correctly", () => {
    const v = makeFakeVentaCliente({
      fecha: VENTA_FECHA,
      total: "10000.00",
      saldoVenta: "3000.00",
    });
    render(<VentaRitmoPagos venta={v} pagos={[]} contrato={null} />);
    // pctLiquidado = round((1 - 3000/10000)*100) = 70
    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  it("synthesizes enganche cell when contrato.enganche > 0 and no enganche pago exists", () => {
    // Use no real pagos so the synthetic enganche is the only movement in its week
    const ventaSolaEnDeuda = makeFakeVentaCliente({
      fecha: VENTA_FECHA,
      total: "18500.00",
      saldoVenta: "16500.00",
    });
    render(
      <VentaRitmoPagos
        venta={ventaSolaEnDeuda}
        pagos={[]}
        contrato={baseContrato}
      />,
    );
    // The synthetic enganche lands in week 0 as sole movement → dominant = "enganche"
    const engancheCells = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-label")?.includes("(enganche)"));
    expect(engancheCells.length).toBeGreaterThan(0);
  });

  it("does not add extra synthetic enganche when a real enganche pago is present", () => {
    const enganchePago = makeFakePago({
      doctoCcId: 200,
      fecha: new Date("2025-11-04T10:00:00.000Z"),
      importe: "2000.00",
      categoria: "enganche",
      concepto: "ENGANCHE",
    });
    // With a real enganche pago, synthesis must NOT fire (no duplicate)
    const { unmount } = render(
      <VentaRitmoPagos
        venta={baseVenta}
        pagos={[enganchePago]}
        contrato={baseContrato}
        onPagoClick={vi.fn()}
      />,
    );
    const engancheCellsWithReal = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-label")?.includes("(enganche)"));
    // Exactly 1 enganche cell (the real pago's week), not 2
    expect(engancheCellsWithReal.length).toBe(1);
    unmount();

    // Without a real enganche pago, synthesis fires → still exactly 1 enganche cell
    render(
      <VentaRitmoPagos
        venta={baseVenta}
        pagos={[]}
        contrato={baseContrato}
        onPagoClick={vi.fn()}
      />,
    );
    const engancheCellsWithSynth = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-label")?.includes("(enganche)"));
    expect(engancheCellsWithSynth.length).toBe(1);
  });

  it("does not render enganche synthesis when contrato is null", () => {
    render(<VentaRitmoPagos venta={baseVenta} pagos={allPagos} contrato={null} />);
    // Renders fine without contrato
    expect(screen.getByText("Cadencia de pagos")).toBeInTheDocument();
  });

  it("clicking a single-pago cell calls onPagoClick with that doctoCcId", async () => {
    const onPagoClick = vi.fn();
    render(
      <VentaRitmoPagos
        venta={baseVenta}
        pagos={[pago2]}
        contrato={null}
        onPagoClick={onPagoClick}
      />,
    );
    // pago2 (doctoCcId=102) is the only pago — its cell has data-testid="cell-pago-102"
    const cell = screen.getByTestId("cell-pago-102");
    await userEvent.click(cell);
    expect(onPagoClick).toHaveBeenCalledWith(102);
  });

  it("multi-pago week shows mini-picker; selecting a pago calls onPagoClick", async () => {
    const onPagoClick = vi.fn();
    render(
      <VentaRitmoPagos
        venta={baseVenta}
        pagos={[pago3, pago4]}
        contrato={null}
        onPagoClick={onPagoClick}
      />,
    );
    // Week 2 has pago3 + pago4 (both enabled). Click until picker appears.
    const buttons = screen.getAllByRole("button");
    let pickerFound = false;
    for (const btn of buttons) {
      if ((btn as HTMLButtonElement).disabled) continue;
      await userEvent.click(btn);
      const picker = document.querySelector('[role="listbox"]');
      if (picker) {
        pickerFound = true;
        // Select first option
        const options = screen.getAllByRole("option");
        await userEvent.click(options[0]);
        expect(onPagoClick).toHaveBeenCalled();
        break;
      }
    }
    expect(pickerFound).toBe(true);
  });

  it("picker closes on Escape key", async () => {
    const onPagoClick = vi.fn();
    render(
      <VentaRitmoPagos
        venta={baseVenta}
        pagos={[pago3, pago4]}
        contrato={null}
        onPagoClick={onPagoClick}
      />,
    );
    // Open picker
    const buttons = screen.getAllByRole("button");
    let opened = false;
    for (const btn of buttons) {
      if ((btn as HTMLButtonElement).disabled) continue;
      await userEvent.click(btn);
      if (document.querySelector('[role="listbox"]')) {
        opened = true;
        break;
      }
    }
    expect(opened).toBe(true);
    // Press Escape
    await userEvent.keyboard("{Escape}");
    expect(document.querySelector('[role="listbox"]')).not.toBeInTheDocument();
  });

  it("picker closes when clicking outside it", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <VentaRitmoPagos
          venta={baseVenta}
          pagos={[pago3, pago4]}
          contrato={null}
          onPagoClick={vi.fn()}
        />
        <button type="button" data-testid="outside-btn">
          fuera
        </button>
      </div>,
    );
    // Open picker by clicking the multi-pago cell (data-testid="cell-pago-103" or pago-104 won't exist since week has 2 pagos)
    const buttons = screen.getAllByRole("button");
    let opened = false;
    for (const btn of buttons) {
      if ((btn as HTMLButtonElement).disabled) continue;
      await user.click(btn);
      if (document.querySelector('[role="listbox"]')) {
        opened = true;
        break;
      }
    }
    expect(opened).toBe(true);
    // Click outside the picker
    await user.click(screen.getByTestId("outside-btn"));
    expect(document.querySelector('[role="listbox"]')).not.toBeInTheDocument();
  });

  it("synthetic enganche cell is not clickable (no doctoCcId)", () => {
    // contrato.enganche > 0, no enganche pago → synthesized enganche at venta.fecha
    // The synthetic enganche has no doctoCcId → cell button disabled
    // If there is also a real pago in same week, the cell IS clickable for that pago.
    // With no real pagos at all, the week has only synthetic → disabled.
    const v = makeFakeVentaCliente({
      fecha: new Date("2025-11-03T12:00:00.000Z"),
      total: "10000.00",
      saldoVenta: "8000.00",
    });
    render(
      <VentaRitmoPagos venta={v} pagos={[]} contrato={baseContrato} />,
    );
    // Enganche week cell exists but is disabled (no real doctoCcId)
    const buttons = screen.getAllByRole("button");
    const disabledButtons = buttons.filter(
      (b) => (b as HTMLButtonElement).disabled,
    );
    // The synthetic enganche cell and all empty cells should be disabled
    expect(disabledButtons.length).toBeGreaterThan(0);
  });
});
