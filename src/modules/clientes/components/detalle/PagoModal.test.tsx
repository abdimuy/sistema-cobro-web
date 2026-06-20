import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientesProvider } from "../../presentation/context/ClientesContext";
import {
  FakeClientesPort,
  makeFakePagoDetalle,
} from "../../application/__tests__/fakeClientesPort";
import { PagoModal } from "./PagoModal";

// Mock FichaMapEmbed — no real API key in test env.
vi.mock("../ficha/FichaMapEmbed", () => ({
  FichaMapEmbed: ({ lat, lng }: { lat: number; lng: number }) => (
    <div data-testid="mock-map">{lat},{lng}</div>
  ),
}));

function renderModal(
  port: FakeClientesPort,
  props: {
    doctoCcId: number | null;
    onClose?: () => void;
  },
) {
  const onClose = props.onClose ?? vi.fn();
  return render(
    <ClientesProvider port={port}>
      <PagoModal
        clienteId={1042}
        doctoCcId={props.doctoCcId}
        onClose={onClose}
      />
    </ClientesProvider>,
  );
}

describe("PagoModal", () => {
  let port: FakeClientesPort;

  beforeEach(() => {
    port = new FakeClientesPort();
    port.obtenerPagoDetalleResponse = makeFakePagoDetalle();
  });

  it("renders nothing when doctoCcId is null", () => {
    renderModal(port, { doctoCcId: null });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows importe, cobrador, concepto badge, folio after loading", async () => {
    renderModal(port, { doctoCcId: 70234 });
    await waitFor(() =>
      expect(screen.getAllByText("AB-00234").length).toBeGreaterThan(0),
    );
    // importe formatted as MXN
    expect(screen.getAllByText(/\$3[,.]?200/i).length).toBeGreaterThan(0);
    // cobrador
    expect(screen.getByText("José Guadalupe Pérez Morales")).toBeInTheDocument();
    // concepto badge
    expect(screen.getAllByText("ABONO").length).toBeGreaterThan(0);
  });

  it("shows GPS section when lat/lon present (fallback: mapa-no-disponible because no API key)", async () => {
    renderModal(port, { doctoCcId: 70234 });
    await waitFor(() =>
      expect(screen.getAllByText("AB-00234").length).toBeGreaterThan(0),
    );
    // The map container or fallback must be present
    const fallback = screen.queryByTestId("mapa-no-disponible");
    const mockMap = screen.queryByTestId("mock-map");
    // One or the other should exist
    expect(fallback ?? mockMap).not.toBeNull();
    // Also check coords are shown
    expect(screen.getByText(/19.4326/)).toBeInTheDocument();
  });

  it("hides GPS section when lat/lon are null", async () => {
    port.obtenerPagoDetalleResponse = makeFakePagoDetalle({ lat: null, lon: null });
    renderModal(port, { doctoCcId: 70234 });
    await waitFor(() =>
      expect(screen.getAllByText("AB-00234").length).toBeGreaterThan(0),
    );
    expect(screen.queryByText(/19\./)).not.toBeInTheDocument();
    expect(screen.queryByTestId("mapa-no-disponible")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-map")).not.toBeInTheDocument();
  });

  it("shows Diagnóstico section for origen app", async () => {
    renderModal(port, { doctoCcId: 70234 });
    await waitFor(() =>
      expect(screen.getAllByText("AB-00234").length).toBeGreaterThan(0),
    );
    expect(screen.getByText("Diagnóstico de sincronización")).toBeInTheDocument();
  });

  it("hides Diagnóstico for microsip origen with null dates", async () => {
    port.obtenerPagoDetalleResponse = makeFakePagoDetalle({
      origen: "microsip",
      recibidoAt: null,
      aplicadoAt: null,
    });
    renderModal(port, { doctoCcId: 70234 });
    await waitFor(() =>
      expect(screen.getAllByText("AB-00234").length).toBeGreaterThan(0),
    );
    expect(
      screen.queryByText("Diagnóstico de sincronización"),
    ).not.toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const onClose = vi.fn();
    renderModal(port, { doctoCcId: 70234, onClose });
    await waitFor(() =>
      expect(screen.getAllByText("AB-00234").length).toBeGreaterThan(0),
    );
    const buttons = screen.getAllByRole("button");
    const closeBtn = buttons[buttons.length - 1];
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
