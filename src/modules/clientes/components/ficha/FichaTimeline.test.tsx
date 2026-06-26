import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { FichaTimeline } from "./FichaTimeline";
import { ClientesProvider } from "../../presentation/context/ClientesContext";
import { FakeClientesPort, makeFakeTimeline } from "../../application/__tests__/fakeClientesPort";
import type { EventoTimeline } from "../../domain/entities";

function wrapWith(port: FakeClientesPort) {
  return ({ children }: { children: React.ReactNode }) => (
    <ClientesProvider port={port}>{children}</ClientesProvider>
  );
}

describe("FichaTimeline", () => {
  it("shows loading state while fetching", () => {
    const port = new FakeClientesPort();
    port.obtenerTimeline = () => new Promise<EventoTimeline[]>(() => {});
    render(<FichaTimeline clienteId={1042} />, { wrapper: wrapWith(port) });
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });

  it("shows 'Sin movimientos' when timeline is empty", async () => {
    const port = new FakeClientesPort();
    port.timelineResponse = [];
    render(<FichaTimeline clienteId={1042} />, { wrapper: wrapWith(port) });
    await waitFor(() => expect(screen.getByText("Sin movimientos")).toBeInTheDocument());
  });

  it("renders compra_credito badge as 'Crédito'", async () => {
    const port = new FakeClientesPort();
    port.timelineResponse = makeFakeTimeline();
    render(<FichaTimeline clienteId={1042} />, { wrapper: wrapWith(port) });
    await waitFor(() => expect(screen.getByText("Crédito")).toBeInTheDocument());
  });

  it("renders compra_contado badge as 'Contado'", async () => {
    const port = new FakeClientesPort();
    port.timelineResponse = makeFakeTimeline();
    render(<FichaTimeline clienteId={1042} />, { wrapper: wrapWith(port) });
    await waitFor(() => expect(screen.getByText("Contado")).toBeInTheDocument());
  });

  it("renders pago badge as 'Pago'", async () => {
    const port = new FakeClientesPort();
    port.timelineResponse = makeFakeTimeline();
    render(<FichaTimeline clienteId={1042} />, { wrapper: wrapWith(port) });
    await waitFor(() => expect(screen.getByText("Pago")).toBeInTheDocument());
  });

  it("renders monto formatted as MXN", async () => {
    const port = new FakeClientesPort();
    port.timelineResponse = [
      { fecha: new Date("2026-05-12T00:00:00.000Z"), tipo: "compra_credito", monto: 8500, etiqueta: "A-1234", refId: 55012 },
    ];
    render(<FichaTimeline clienteId={1042} />, { wrapper: wrapWith(port) });
    await waitFor(() => expect(screen.getByText(/\$8[,.]?500/)).toBeInTheDocument());
  });

  it("renders etiqueta text", async () => {
    const port = new FakeClientesPort();
    port.timelineResponse = makeFakeTimeline();
    render(<FichaTimeline clienteId={1042} />, { wrapper: wrapWith(port) });
    await waitFor(() => expect(screen.getByText("A-1234")).toBeInTheDocument());
  });

  it("renders section title 'Historial'", async () => {
    const port = new FakeClientesPort();
    port.timelineResponse = makeFakeTimeline();
    render(<FichaTimeline clienteId={1042} />, { wrapper: wrapWith(port) });
    await waitFor(() => expect(screen.getByText("Historial")).toBeInTheDocument());
  });
});
