import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  makeFakeVentaDetalle,
  makeFakeVentaCliente,
  makeFakePago,
} from "../../application/__tests__/fakeClientesPort";
import { PlanPagos } from "./PlanPagos";

describe("PlanPagos", () => {
  it("renders heading and projection subtitle for a crédito detalle", () => {
    const detalle = makeFakeVentaDetalle();
    render(<PlanPagos detalle={detalle} />);

    expect(screen.getByText("Plan de pagos")).toBeInTheDocument();
    expect(
      screen.getByText("proyección estimada del contrato"),
    ).toBeInTheDocument();
  });

  it("shows a progress line (X de N pagos + % liquidado)", () => {
    const detalle = makeFakeVentaDetalle();
    render(<PlanPagos detalle={detalle} />);

    // fixture: enganche + 5 cuotas = 6 pagos
    expect(screen.getByText(/\d+ de 6 pagos/)).toBeInTheDocument();
    expect(screen.getByText(/% liquidado/)).toBeInTheDocument();
    // legend explaining the two bars (with money amounts)
    expect(screen.getByText("Pagado")).toBeInTheDocument();
    expect(screen.getByText("Debería llevar a hoy")).toBeInTheDocument();
  });

  it("explains paid vs expected (with %) on hovering the bar", async () => {
    const user = userEvent.setup();
    render(<PlanPagos detalle={makeFakeVentaDetalle()} />);

    await user.hover(screen.getByLabelText("Avance de pago"));

    // Radix renders tooltip content twice (visible + a11y), so allow multiple.
    expect(
      (await screen.findAllByText(/Pagado .*\(\d+%\)/)).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Debería llevar .*\(\d+%\)/).length,
    ).toBeGreaterThan(0);
  });

  it("renders the forward-looking stats and cadence", () => {
    const detalle = makeFakeVentaDetalle();
    render(<PlanPagos detalle={detalle} />);

    expect(screen.getByText("Próximo pago")).toBeInTheDocument();
    expect(screen.getByText("Restante")).toBeInTheDocument();
    expect(screen.getByText("Liquidación est.")).toBeInTheDocument();
    // numCuotas=5, formaDePago QUINCENAL → "quincenas"
    expect(screen.getByText("5 quincenas")).toBeInTheDocument();
  });

  it("shows 'Al corriente' and 'liquidada' once everything is paid", () => {
    const detalle = makeFakeVentaDetalle({
      pagos: [makeFakePago({ importe: "18500.00" })],
    });
    render(<PlanPagos detalle={detalle} />);

    expect(screen.getByText("Al corriente")).toBeInTheDocument();
    expect(screen.getByText("liquidada")).toBeInTheDocument();
  });

  it("renders nothing for a contado sale (contrato=null)", () => {
    const detalle = makeFakeVentaDetalle({
      venta: makeFakeVentaCliente({ tipo: "CONTADO" }),
      contrato: null,
    });
    const { container } = render(<PlanPagos detalle={detalle} />);
    expect(container.firstChild).toBeNull();
  });
});
