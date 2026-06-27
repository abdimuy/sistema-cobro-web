import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { CuentasRiesgo } from "./CuentasRiesgo";
import { makeFakeCuentaRiesgo } from "../application/__tests__/fakeCarteraPort";

function renderInRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("CuentasRiesgo", () => {
  it("renders tier badge, estado badge, and segmento badge for a row", () => {
    const cuentas = [
      makeFakeCuentaRiesgo({
        tierRiesgo: "EN_RIESGO",
        estadoPago: "MOROSO",
        segmento: "DORMIDO_VALIOSO",
      }),
    ];
    renderInRouter(<CuentasRiesgo cuentas={cuentas} />);

    // "En riesgo" appears once in the dropdown option and once in the badge
    expect(screen.getAllByText("En riesgo")).toHaveLength(2);
    expect(screen.getByText("Moroso")).toBeInTheDocument();
    expect(screen.getByText("Dormido valioso")).toBeInTheDocument();
  });

  it("cliente link href points to /clientes/:clienteId", () => {
    const cuentas = [makeFakeCuentaRiesgo({ clienteId: 1001, nombre: "MUEBLES HERNANDEZ SA" })];
    renderInRouter(<CuentasRiesgo cuentas={cuentas} />);

    const link = screen.getByRole("link", { name: "MUEBLES HERNANDEZ SA" });
    expect(link.getAttribute("href")).toBe("/clientes/1001");
  });

  it("sorts rows when clicking a sortable header", () => {
    const cuentas = [
      makeFakeCuentaRiesgo({ clienteId: 1, nombre: "GARCIA LOPEZ SA", saldo: "5000.00" }),
      makeFakeCuentaRiesgo({ clienteId: 2, nombre: "RAMIREZ TORRES SA", saldo: "25000.00" }),
    ];
    renderInRouter(<CuentasRiesgo cuentas={cuentas} />);

    const saldoHeader = screen.getByText("Saldo");
    fireEvent.click(saldoHeader);

    const rows = screen.getAllByRole("row");
    // After clicking Saldo (desc), clienteId 2 (25000) should be first
    expect(rows[1]).toHaveTextContent("RAMIREZ TORRES SA");
  });

  it("renders empty state when no cuentas", () => {
    renderInRouter(<CuentasRiesgo cuentas={[]} />);
    expect(screen.getByText("Sin cuentas en riesgo")).toBeInTheDocument();
  });
});
