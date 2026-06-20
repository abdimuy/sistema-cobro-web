import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientesProvider } from "../../presentation/context/ClientesContext";
import {
  FakeClientesPort,
  makeFakeVentaCliente,
} from "../../application/__tests__/fakeClientesPort";
import { ReporteModal } from "./ReporteModal";
import type { VentaCliente } from "../../domain/entities/VentaCliente";

beforeEach(() => {
  // jsdom lacks the object-URL APIs the download path uses, and treats anchor
  // .click() as a navigation it can't perform — stub both to keep output clean.
  global.URL.createObjectURL = vi.fn(() => "blob:fake");
  global.URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

function renderModal(port: FakeClientesPort, ventas: VentaCliente[]) {
  return render(
    <ClientesProvider port={port}>
      <ReporteModal
        open
        onClose={vi.fn()}
        clienteId={1042}
        ventas={ventas}
        hasMore={false}
        loadMore={vi.fn()}
        isLoadingMore={false}
      />
    </ClientesProvider>,
  );
}

const twoVentas = (): VentaCliente[] => [
  makeFakeVentaCliente({ doctoPvId: 1, folio: "A-1" }),
  makeFakeVentaCliente({ doctoPvId: 2, folio: "A-2" }),
];

describe("ReporteModal", () => {
  it("selects all ventas by default and generates without a filter", async () => {
    const user = userEvent.setup();
    const port = new FakeClientesPort();
    renderModal(port, twoVentas());

    await user.click(screen.getByText("Generar PDF (2)"));

    await waitFor(() => expect(port.descargarReporteCalls).toHaveLength(1));
    // All selected → no filter, the server returns every sale.
    expect(port.descargarReporteCalls[0].ventaIds).toBeUndefined();
  });

  it("sends only the selected ventas when one is deselected", async () => {
    const user = userEvent.setup();
    const port = new FakeClientesPort();
    renderModal(port, twoVentas());

    await user.click(screen.getByLabelText("Incluir venta A-1"));
    await user.click(screen.getByText("Generar PDF (1)"));

    await waitFor(() => expect(port.descargarReporteCalls).toHaveLength(1));
    expect(port.descargarReporteCalls[0].ventaIds).toEqual([2]);
  });
});
