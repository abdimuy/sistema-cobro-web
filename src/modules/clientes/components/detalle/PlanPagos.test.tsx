import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  makeFakeVentaDetalle,
  makeFakeVentaCliente,
  makeFakePago,
} from "../../application/__tests__/fakeClientesPort";
import { PlanPagos } from "./PlanPagos";

describe("PlanPagos", () => {
  it("renders heading and subtitle for a crédito detalle", () => {
    const detalle = makeFakeVentaDetalle();
    render(<PlanPagos detalle={detalle} />);

    expect(screen.getByText("Plan de pagos")).toBeInTheDocument();
    expect(
      screen.getByText("reconstruido del contrato · estimado"),
    ).toBeInTheDocument();
  });

  it("renders summary kpis with formatted values", () => {
    const detalle = makeFakeVentaDetalle();
    render(<PlanPagos detalle={detalle} />);

    // total = $18,500
    expect(screen.getAllByText(/\$18[,.]?500/i).length).toBeGreaterThan(0);
    // enganche = $3,700
    expect(screen.getAllByText(/\$3[,.]?700/i).length).toBeGreaterThan(0);
    // parcialidad = $3,200
    expect(screen.getAllByText(/\$3[,.]?200/i).length).toBeGreaterThan(0);
  });

  it("renders Enganche and Cuota 1 row labels", () => {
    const detalle = makeFakeVentaDetalle();
    render(<PlanPagos detalle={detalle} />);

    expect(screen.getByText("Enganche")).toBeInTheDocument();
    expect(screen.getByText("Cuota 1")).toBeInTheDocument();
  });

  it("shows ✓ for pagada rows when enganche is covered", () => {
    // makeFakeVentaDetalle has 1 pago of $3200 — not enough to cover $3700 enganche
    // so enganche is "actual" (●), nothing pagada
    // Use a pago that covers the enganche exactly
    const detalle = makeFakeVentaDetalle({
      pagos: [
        makeFakePago({ importe: "3700.00" }),
      ],
    });
    render(<PlanPagos detalle={detalle} />);

    // Enganche row should be pagada → ✓
    expect(screen.getAllByText("✓").length).toBeGreaterThan(0);
    // Cuota 1 should be actual → ●
    expect(screen.getAllByText("●").length).toBeGreaterThan(0);
  });

  it("shows ● for actual row when no pagos", () => {
    const detalle = makeFakeVentaDetalle({ pagos: [] });
    render(<PlanPagos detalle={detalle} />);

    // Enganche is the first row → actual
    expect(screen.getByText("●")).toBeInTheDocument();
    // No ✓ since nothing is pagada
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
  });

  it("renders nothing for a contado sale (contrato=null)", () => {
    const detalle = makeFakeVentaDetalle({
      venta: makeFakeVentaCliente({ tipo: "CONTADO" }),
      contrato: null,
    });
    const { container } = render(<PlanPagos detalle={detalle} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows plazo in summary as ≈N <cadencia-unit> derived from formaDePago", () => {
    // makeFakeVentaDetalle uses formaDePago="QUINCENAL" → label "quincenas"
    const detalle = makeFakeVentaDetalle();
    render(<PlanPagos detalle={detalle} />);

    // numCuotas for fixture = 5
    expect(screen.getByText("≈5 quincenas")).toBeInTheDocument();
  });

  it("shows 'Al corriente' when all overdue filas are pagadas", () => {
    // Pay off everything so atrasado=false
    const detalle = makeFakeVentaDetalle({
      pagos: [makeFakePago({ importe: "18500.00" })],
    });
    render(<PlanPagos detalle={detalle} />);
    expect(screen.getByText("Al corriente")).toBeInTheDocument();
  });
});
