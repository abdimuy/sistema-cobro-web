import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFakePago } from "../../application/__tests__/fakeClientesPort";
import { VentaPagosList } from "./VentaPagosList";

describe("VentaPagosList", () => {
  it("renders concepto badge for pago categoria", () => {
    const pagos = [makeFakePago({ concepto: "ABONO", categoria: "pago" })];
    render(<VentaPagosList pagos={pagos} />);
    expect(screen.getByText("ABONO")).toBeInTheDocument();
  });

  it("applies green accent class for pago categoria", () => {
    const pagos = [makeFakePago({ categoria: "pago" })];
    const { container } = render(<VentaPagosList pagos={pagos} />);
    const row = container.querySelector(".border-green-500");
    expect(row).not.toBeNull();
  });

  it("calls onPagoClick with correct doctoCcId when row clicked", async () => {
    const onPagoClick = vi.fn();
    const pagos = [makeFakePago({ doctoCcId: 70234 })];
    render(<VentaPagosList pagos={pagos} onPagoClick={onPagoClick} />);
    const btn = screen.getByRole("button");
    await userEvent.click(btn);
    expect(onPagoClick).toHaveBeenCalledWith(70234);
  });

  it("renders legend with Pago/Cobranza label", () => {
    const pagos = [makeFakePago()];
    render(<VentaPagosList pagos={pagos} />);
    expect(screen.getByText("Pago/Cobranza")).toBeInTheDocument();
  });

  it("renders blue badge for enganche categoria", () => {
    const pagos = [makeFakePago({ categoria: "enganche", concepto: "ENGANCHE" })];
    const { container } = render(<VentaPagosList pagos={pagos} />);
    const badge = container.querySelector(".border-blue-500");
    expect(badge).not.toBeNull();
  });

  it("renders violet badge for condonacion categoria", () => {
    const pagos = [makeFakePago({ categoria: "condonacion", concepto: "CONDONACION" })];
    const { container } = render(<VentaPagosList pagos={pagos} />);
    const badge = container.querySelector(".border-violet-500");
    expect(badge).not.toBeNull();
  });

  it("renders formaCobro and cobrador on second line", () => {
    const pagos = [
      makeFakePago({ formaCobro: "EFECTIVO", cobrador: "José Guadalupe Pérez Morales" }),
    ];
    render(<VentaPagosList pagos={pagos} />);
    expect(screen.getByText(/EFECTIVO · José Guadalupe Pérez Morales/)).toBeInTheDocument();
  });

  it("renders nothing extra when no pagos", () => {
    render(<VentaPagosList pagos={[]} />);
    expect(screen.getByText("Sin pagos registrados")).toBeInTheDocument();
  });
});
