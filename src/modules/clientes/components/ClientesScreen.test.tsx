import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ClientesProvider } from "../presentation/context/ClientesContext";
import { ClientesScreen } from "./ClientesScreen";
import {
  FakeClientesPort,
  makeFakeCliente,
} from "../application/__tests__/fakeClientesPort";

function renderScreen(port: FakeClientesPort) {
  return render(
    <MemoryRouter>
      <ClientesProvider port={port}>
        <ClientesScreen />
      </ClientesProvider>
    </MemoryRouter>,
  );
}

describe("ClientesScreen", () => {
  let port: FakeClientesPort;

  beforeEach(() => {
    port = new FakeClientesPort();
    port.buscarResponse = {
      items: [makeFakeCliente()],
      nextCursor: "",
    };
  });

  it("renders the screen title", () => {
    renderScreen(port);
    expect(screen.getByText("Clientes")).toBeInTheDocument();
  });

  it("renders the eyebrow subtitle", () => {
    renderScreen(port);
    expect(screen.getByText(/directorio de clientes/i)).toBeInTheDocument();
  });

  it("shows client nombre in table after loading", async () => {
    port.buscarResponse = {
      items: [makeFakeCliente({ nombre: "MUEBLES HERNÁNDEZ S.A." })],
      nextCursor: "",
    };
    renderScreen(port);
    await waitFor(() =>
      expect(
        screen.getByText("MUEBLES HERNÁNDEZ S.A."),
      ).toBeInTheDocument(),
    );
  });

  it("shows empty state when no items", async () => {
    port.buscarResponse = { items: [], nextCursor: "" };
    renderScreen(port);
    await waitFor(() =>
      expect(screen.getByText("No hay clientes")).toBeInTheDocument(),
    );
  });

  it("shows error state on error", async () => {
    port.throwOnNext.buscarClientes = new Error("red de red");
    renderScreen(port);
    await waitFor(() =>
      expect(screen.getByText("red de red")).toBeInTheDocument(),
    );
  });

  it("score cell shows dash when tienePulso is false", async () => {
    port.buscarResponse = {
      items: [makeFakeCliente({ tienePulso: false, score: 0 })],
      nextCursor: "",
    };
    renderScreen(port);
    await waitFor(() => {
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  it("saldo formatted as MXN", async () => {
    port.buscarResponse = {
      items: [makeFakeCliente({ saldo: "8500.00" })],
      nextCursor: "",
    };
    renderScreen(port);
    // es-MX Intl formatter: $8,500 (0 fraction digits)
    await waitFor(() =>
      expect(screen.getByText(/\$8[,.]?500/i)).toBeInTheDocument(),
    );
  });

  it("renders the reindexar button", () => {
    renderScreen(port);
    expect(screen.getByTestId("reindexar-button")).toBeInTheDocument();
  });
});
