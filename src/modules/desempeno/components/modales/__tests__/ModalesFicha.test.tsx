import { describe, expect, it, vi } from "vitest";
import { useEffect } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModalesFicha } from "../ModalesFicha";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DesempenoProvider } from "../../../presentation/context/DesempenoProvider";
import { FakeDesempenoPort } from "../../../application/__tests__/fakeDesempenoPort";
import type { ModalFicha } from "../ModalesFicha";
import { makeActividadPago, makeActividadVisita } from "../../../application/__tests__/fakeDesempenoPort";

// Cuántas veces se montó cada VentaModal (por doctoPvId).
const montajesVenta: number[] = [];
function VentaModalFalso(p: { clienteId: number; doctoPvId: number; onPagoClick?: (id: number) => void }) {
  useEffect(() => {
    montajesVenta.push(p.doctoPvId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div data-testid="venta-modal">
      {`${p.clienteId}-${p.doctoPvId}`}
      <button type="button" onClick={() => p.onPagoClick?.(15082369)}>abrir pago</button>
    </div>
  );
}

vi.mock("@/modules/clientes", () => ({
  PagoModal: (p: { clienteId: number; doctoCcId: number; onAbrirVenta?: (id: number) => void }) => (
    <div data-testid="pago-modal">
      {`${p.clienteId}-${p.doctoCcId}`}
      <button type="button" onClick={() => p.onAbrirVenta?.(9921)}>abrir venta</button>
    </div>
  ),
  VentaModal: (p: { clienteId: number; doctoPvId: number; onPagoClick?: (id: number) => void }) => <VentaModalFalso {...p} />,
  ClienteFicha: (p: { clienteId: number }) => <div data-testid="cliente-ficha">{p.clienteId}</div>,
}));
vi.mock("@/modules/ventasLocales/components/detalle/AuthenticatedImage", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt ?? "imagen"} />,
}));

describe("ModalesFicha", () => {
  it("un pago con docto_cc_id abre el PagoModal de Clientes y encadena la venta", async () => {
    const user = userEvent.setup();
    const onAbrir = vi.fn();
    renderConDesempeno(
      <ModalesFicha pila={[{ tipo: "actividad", actividad: makeActividadPago() }]} onCerrar={vi.fn()} onAbrir={onAbrir} />,
    );
    expect(screen.getByTestId("pago-modal")).toHaveTextContent("1544855-15082369");
    await user.click(screen.getByRole("button", { name: "abrir venta" }));
    expect(onAbrir).toHaveBeenCalledWith({ tipo: "venta", clienteId: 1544855, doctoPvId: 9921 });
  });

  it("un pago que aún no llega a Microsip (docto_cc_id nulo) abre el modal propio, no el de Clientes", () => {
    const base = makeActividadPago();
    renderConDesempeno(
      <ModalesFicha
        pila={[{ tipo: "actividad", actividad: { ...base, pago: { ...base.pago!, doctoCcId: null } } }]}
        onCerrar={vi.fn()}
        onAbrir={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("pago-modal")).not.toBeInTheDocument();
    expect(screen.getByText("Pagos")).toBeInTheDocument();
  });

  it("una visita abre el modal de visita nuevo y encadena la venta por docto_pv_id", async () => {
    const user = userEvent.setup();
    const onAbrir = vi.fn();
    renderConDesempeno(
      <ModalesFicha pila={[{ tipo: "actividad", actividad: makeActividadVisita() }]} onCerrar={vi.fn()} onAbrir={onAbrir} />,
    );
    expect(screen.getByText("Visitas")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Detalle de venta" }));
    expect(onAbrir).toHaveBeenCalledWith({ tipo: "venta", clienteId: 1602231, doctoPvId: 9934 });
  });

  it("venta y cliente usan los componentes de Clientes; se apilan", () => {
    renderConDesempeno(
      <ModalesFicha
        pila={[
          { tipo: "venta", clienteId: 1544855, doctoPvId: 9921 },
          { tipo: "cliente", clienteId: 1544855 },
        ]}
        onCerrar={vi.fn()}
        onAbrir={vi.fn()}
      />,
    );
    expect(screen.getByTestId("venta-modal")).toHaveTextContent("1544855-9921");
    expect(screen.getByTestId("cliente-ficha")).toHaveTextContent("1544855");
  });

  it("desde la venta se abre un pago de Clientes", async () => {
    const user = userEvent.setup();
    const onAbrir = vi.fn();
    renderConDesempeno(
      <ModalesFicha pila={[{ tipo: "venta", clienteId: 1544855, doctoPvId: 9921 }]} onCerrar={vi.fn()} onAbrir={onAbrir} />,
    );
    await user.click(screen.getByRole("button", { name: "abrir pago" }));
    expect(onAbrir).toHaveBeenCalledWith({ tipo: "pago", clienteId: 1544855, doctoCcId: 15082369 });
  });

  it("la clave es la identidad del modal: quitar uno de abajo no vuelve a montar los de arriba", () => {
    montajesVenta.length = 0;
    const venta = { tipo: "venta" as const, clienteId: 1544855, doctoPvId: 9921 };
    // Mismos providers en los dos renders: solo cambia la pila.
    const port = new FakeDesempenoPort();
    const ui = (pila: ModalFicha[]) => (
      <MemoryRouter>
        <DesempenoProvider port={port}>
          <ModalesFicha pila={pila} onCerrar={vi.fn()} onAbrir={vi.fn()} />
        </DesempenoProvider>
      </MemoryRouter>
    );
    const { rerender } = render(ui([{ tipo: "cliente", clienteId: 1544855 }, venta]));
    rerender(ui([venta]));
    expect(screen.getByTestId("venta-modal")).toBeInTheDocument();
    expect(montajesVenta).toEqual([9921]);
  });

  it("el mismo modal dos veces en la pila no repite clave", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const venta = { tipo: "venta" as const, clienteId: 1544855, doctoPvId: 9921 };
    renderConDesempeno(
      <ModalesFicha pila={[venta, { tipo: "pago", clienteId: 1544855, doctoCcId: 15082369 }, venta]} onCerrar={vi.fn()} onAbrir={vi.fn()} />,
    );
    expect(screen.getAllByTestId("venta-modal")).toHaveLength(2);
    expect(error.mock.calls.some((c) => String(c[0]).includes("same key"))).toBe(false);
    error.mockRestore();
  });
});
