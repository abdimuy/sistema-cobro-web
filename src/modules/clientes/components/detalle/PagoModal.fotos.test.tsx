import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientesProvider } from "../../presentation/context/ClientesContext";
import { FakeClientesPort, makeFakeImagenPago, makeFakePagoDetalle } from "../../application/__tests__/fakeClientesPort";
import { PagoModal } from "./PagoModal";

vi.mock("../ficha/FichaMapEmbed", () => ({ FichaMapEmbed: () => <div data-testid="mock-map" /> }));
vi.mock("@/modules/ventasLocales/components/detalle/AuthenticatedImage", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt ?? "imagen"} />,
}));

function montar(port: FakeClientesPort, extra: { onAbrirVenta?: (id: number) => void; onAbrirCliente?: () => void } = {}) {
  return render(
    <ClientesProvider port={port}>
      <PagoModal clienteId={1544855} doctoCcId={15082369} onClose={vi.fn()} {...extra} />
    </ClientesProvider>,
  );
}

describe("PagoModal — fotos", () => {
  it("sin pago_recibido_id: 'Sin comprobante' y no pide fotos", async () => {
    const port = new FakeClientesPort();
    port.obtenerPagoDetalleResponse = makeFakePagoDetalle({ pagoRecibidoId: null, numFotos: 0 });
    montar(port);
    expect(await screen.findByText("Sin comprobante")).toBeInTheDocument();
    expect(port.listarImagenesPagoCalls).toHaveLength(0);
  });

  it("con pago_recibido_id: pide la lista y muestra las miniaturas", async () => {
    const port = new FakeClientesPort();
    port.obtenerPagoDetalleResponse = makeFakePagoDetalle({ pagoRecibidoId: "p-1", numFotos: 2 });
    port.imagenesPagoResponse = [makeFakeImagenPago({ id: "a", descripcion: "Recibo firmado" }), makeFakeImagenPago({ id: "b", descripcion: null })];
    montar(port);
    expect(await screen.findByText("Fotos · 2")).toBeInTheDocument();
    expect(screen.getByAltText("Recibo firmado")).toBeInTheDocument();
    expect(port.listarImagenesPagoCalls[0].pagoRecibidoId).toBe("p-1");
  });

  it("si la lista de fotos falla lo dice y el resto del pago sigue visible", async () => {
    const port = new FakeClientesPort();
    port.obtenerPagoDetalleResponse = makeFakePagoDetalle({ pagoRecibidoId: "p-1", numFotos: 1 });
    port.throwOnNext.listarImagenesPago = new Error("503");
    montar(port);
    expect(await screen.findByText("No se pudieron cargar las fotos")).toBeInTheDocument();
    expect(screen.getByText("Quién cobró")).toBeInTheDocument();
  });

  it("sin callbacks no hay botones de pie (Clientes sigue igual)", async () => {
    const port = new FakeClientesPort();
    montar(port);
    await screen.findByText("Sin comprobante");
    expect(screen.queryByRole("button", { name: "Detalle de venta" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ficha del cliente" })).not.toBeInTheDocument();
  });

  it("los botones de pie solo aparecen si quien abre el modal los pide", async () => {
    const user = userEvent.setup();
    const onAbrirVenta = vi.fn();
    const port = new FakeClientesPort();
    port.obtenerPagoDetalleResponse = makeFakePagoDetalle({ doctoPvId: 30015 });
    montar(port, { onAbrirVenta, onAbrirCliente: vi.fn() });
    await user.click(await screen.findByRole("button", { name: "Detalle de venta" }));
    expect(onAbrirVenta).toHaveBeenCalledWith(30015);
    expect(screen.getByRole("button", { name: "Ficha del cliente" })).toBeInTheDocument();
  });
});
