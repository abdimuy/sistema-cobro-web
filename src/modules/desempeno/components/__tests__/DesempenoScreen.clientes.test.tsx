import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ClientesProvider } from "@/modules/clientes";
import {
  FakeClientesPort,
  makeFakeImagenPago,
  makeFakePagoDetalle,
} from "@/modules/clientes/application/__tests__/fakeClientesPort";
import { DesempenoScreen } from "../DesempenoScreen";
import { DesempenoProvider } from "../../presentation/context/DesempenoProvider";
import { FakeDesempenoPort } from "../../application/__tests__/fakeDesempenoPort";

// Sin sustitutos de Clientes: el pago abre el PagoModal REAL del módulo, con su
// puerto (falso) y sus fotos por pago_recibido_id (D11, Tarea 3.2).
vi.mock("@/modules/clientes/components/ficha/FichaMapEmbed", () => ({
  FichaMapEmbed: () => <div data-testid="mapa-cliente" />,
}));
vi.mock("@/modules/ventasLocales/components/detalle/AuthenticatedImage", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt ?? "imagen"} />,
}));
vi.mock("../jornada/MapaJornadaGoogle", () => ({
  MapaJornadaGoogle: () => <div data-testid="mapa-google" />,
}));

describe("DesempenoScreen con los modales reales de Clientes", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-14T22:40:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("abrir un pago muestra el PagoModal de Clientes con sus fotos", async () => {
    const user = userEvent.setup();
    const clientes = new FakeClientesPort();
    clientes.obtenerPagoDetalleResponse = makeFakePagoDetalle({ pagoRecibidoId: "7a1f39e4", numFotos: 1 });
    clientes.imagenesPagoResponse = [makeFakeImagenPago({ id: "a", descripcion: "Recibo firmado" })];
    render(
      <MemoryRouter initialEntries={["/?usuario=uid-juan&dia=2026-10-14"]}>
        <DesempenoProvider port={new FakeDesempenoPort()}>
          <ClientesProvider port={clientes}>
            <DesempenoScreen puedeConfigurar />
          </ClientesProvider>
        </DesempenoProvider>
      </MemoryRouter>,
    );
    await user.click(await screen.findByText("JUANA ANDRADE LECHUGA"));
    const modal = await screen.findByRole("dialog");
    expect(await within(modal).findByText("Fotos · 1")).toBeInTheDocument();
    expect(within(modal).getByAltText("Recibo firmado")).toBeInTheDocument();
    expect(clientes.obtenerPagoDetalleCalls[0].input).toMatchObject({ clienteId: 1544855, doctoCcId: 15082369 });
    expect(clientes.listarImagenesPagoCalls[0].pagoRecibidoId).toBe("7a1f39e4");
  });
});
