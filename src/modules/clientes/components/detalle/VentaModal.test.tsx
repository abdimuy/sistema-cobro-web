import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ClientesProvider } from "../../presentation/context/ClientesContext";
import {
  FakeClientesPort,
  makeFakeVentaDetalle,
  makeFakePago,
  makeFakeProductoVenta,
  makeFakeVentaCliente,
} from "../../application/__tests__/fakeClientesPort";
import { VentaModal } from "./VentaModal";

function renderModal(
  port: FakeClientesPort,
  props: {
    doctoPvId: number | null;
    open?: boolean;
    onClose?: () => void;
  },
) {
  const onClose = props.onClose ?? vi.fn();
  return render(
    <ClientesProvider port={port}>
      <VentaModal
        clienteId={1042}
        doctoPvId={props.doctoPvId}
        open={props.open ?? true}
        onClose={onClose}
      />
    </ClientesProvider>,
  );
}

describe("VentaModal", () => {
  let port: FakeClientesPort;

  beforeEach(() => {
    port = new FakeClientesPort();
    port.obtenerDetalleResponse = makeFakeVentaDetalle();
  });

  it("renders folio and total after loading", async () => {
    renderModal(port, { doctoPvId: 30015 });

    await waitFor(() =>
      expect(screen.getAllByText("CV-00542").length).toBeGreaterThan(0),
    );
    // total from fixture is $18,500 — formatted as MXN by Intl
    expect(screen.getAllByText(/\$18[,.]?500/i).length).toBeGreaterThan(0);
  });

  it("renders product rows", async () => {
    port.obtenerDetalleResponse = makeFakeVentaDetalle({
      productos: [
        makeFakeProductoVenta({ nombre: "SALA IMPERIAL 3-2-1", articuloId: 8801 }),
        makeFakeProductoVenta({
          articuloId: 9901,
          nombre: "COMEDOR COLONIAL 6 SILLAS",
          unidades: "1.00000",
          precioUnitario: "22000.00",
          precioTotalNeto: "22000.00",
          pctjeDscto: "0.00",
        }),
      ],
    });
    renderModal(port, { doctoPvId: 30015 });

    await waitFor(() =>
      expect(screen.getByText("SALA IMPERIAL 3-2-1")).toBeInTheDocument(),
    );
    expect(screen.getByText("COMEDOR COLONIAL 6 SILLAS")).toBeInTheDocument();
    expect(screen.getByText(/#8801/i)).toBeInTheDocument();
    expect(screen.getByText(/#9901/i)).toBeInTheDocument();
  });

  it("shows contrato card for CREDITO fixture", async () => {
    const detalle = makeFakeVentaDetalle({
      venta: makeFakeVentaCliente({ tipo: "CREDITO" }),
      contrato: {
        parcialidad: "3200.00",
        enganche: "3700.00",
        precioDeContado: "15000.00",
        plazoMeses: 6,
        formaDePago: "QUINCENAL",
        vendedores: ["María Concepción Ramírez Torres"],
      },
    });
    port.obtenerDetalleResponse = detalle;
    renderModal(port, { doctoPvId: 30015 });

    await waitFor(() =>
      expect(screen.getByText("Contrato de crédito")).toBeInTheDocument(),
    );
    expect(screen.getByText("Parcialidad")).toBeInTheDocument();
    expect(screen.getByText("Quincenal · 6 meses")).toBeInTheDocument();
    expect(
      screen.getByText("María Concepción Ramírez Torres"),
    ).toBeInTheDocument();
  });

  it("does NOT show contrato card for CONTADO fixture", async () => {
    port.obtenerDetalleResponse = makeFakeVentaDetalle({
      venta: makeFakeVentaCliente({ tipo: "CONTADO" }),
      contrato: null,
    });
    renderModal(port, { doctoPvId: 30015 });

    await waitFor(() =>
      expect(screen.getAllByText("CV-00542").length).toBeGreaterThan(0),
    );
    expect(
      screen.queryByText("Contrato de crédito"),
    ).not.toBeInTheDocument();
  });

  it("renders pagos list", async () => {
    port.obtenerDetalleResponse = makeFakeVentaDetalle({
      pagos: [
        makeFakePago({
          doctoCcId: 70234,
          fecha: new Date("2025-12-15T00:00:00.000Z"),
          importe: "3200.00",
          formaCobro: "EFECTIVO",
        }),
        makeFakePago({
          doctoCcId: 70300,
          fecha: new Date("2026-01-15T00:00:00.000Z"),
          importe: "3200.00",
          formaCobro: "TRANSFERENCIA SPEI",
        }),
      ],
    });
    renderModal(port, { doctoPvId: 30015 });

    await waitFor(() =>
      expect(screen.getByText(/EFECTIVO/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/TRANSFERENCIA SPEI/)).toBeInTheDocument();
  });

  it("shows 'Sin pagos registrados' for empty pagos", async () => {
    port.obtenerDetalleResponse = makeFakeVentaDetalle({ pagos: [] });
    renderModal(port, { doctoPvId: 30015 });

    await waitFor(() =>
      expect(
        screen.getByText("Sin pagos registrados"),
      ).toBeInTheDocument(),
    );
  });

  it("calls onClose when close button clicked", async () => {
    const onClose = vi.fn();
    renderModal(port, { doctoPvId: 30015, onClose });

    // Wait for modal to render
    await waitFor(() =>
      expect(screen.getAllByText("CV-00542").length).toBeGreaterThan(0),
    );

    // The header close button contains an X icon — select the last button with
    // an svg child (the one in our sticky header, not radix's hidden close btn)
    const buttons = screen.getAllByRole("button");
    const closeBtn = buttons[buttons.length - 1];
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when doctoPvId is null", () => {
    renderModal(port, { doctoPvId: null });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(port.obtenerDetalleCalls).toHaveLength(0);
  });

  it("renders nothing when open is false", () => {
    renderModal(port, { doctoPvId: 30015, open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
