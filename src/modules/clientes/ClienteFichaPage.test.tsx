import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ClientesProvider } from "./presentation/context/ClientesContext";
import {
  FakeClientesPort,
  makeFakeFichaCliente,
  makeFakeVentaCliente,
} from "./application/__tests__/fakeClientesPort";
import { ClienteFichaPage } from "./ClienteFichaPage";

// recharts: mock ResponsiveContainer for jsdom
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({
      children,
    }: {
      children: React.ReactNode;
    }) => (
      <div style={{ width: 400, height: 240 }}>
        {children}
      </div>
    ),
  };
});

// ClienteFichaPage uses ClientesContainer internally which wires the HTTP adapter.
// We bypass it by providing a fake port directly in tests — but ClienteFichaPage
// calls ClientesContainer.
// Solution: override the inner container by rendering the page inside a Provider
// that replaces what ClientesContainer would do.
// Because ClientesContainer wraps children in ClientesProvider, we can't easily
// stub it from outside. Instead, we test the route-parsing and ID-validation
// logic separately from the full ficha — just ensure the page mounts correctly.
//
// For full integration we use ClienteFicha.test.tsx.
// Here we focus on: routing, invalid-id guard, and that clienteId flows through.

// A simpler approach: mock ClientesContainer to just pass through to a Provider
vi.mock("./presentation/composition/ClientesContainer", () => ({
  ClientesContainer: ({ children }: { children: React.ReactNode }) => children,
}));

function renderPage(
  port: FakeClientesPort,
  path: string,
  routePath = "/clientes/:id",
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ClientesProvider port={port}>
        <Routes>
          <Route path={routePath} element={<ClienteFichaPage />} />
        </Routes>
      </ClientesProvider>
    </MemoryRouter>,
  );
}

describe("ClienteFichaPage", () => {
  let port: FakeClientesPort;

  beforeEach(() => {
    port = new FakeClientesPort();
    port.fichaResponse = makeFakeFichaCliente();
    port.listarVentasResponse = {
      items: [makeFakeVentaCliente()],
      nextCursor: "",
    };
  });

  it("renders the client nombre for a valid id", async () => {
    renderPage(port, "/clientes/1042");
    await waitFor(() =>
      expect(
        screen.getAllByText("MUEBLES HERNÁNDEZ S.A.").length,
      ).toBeGreaterThan(0),
    );
  });

  it("shows invalid message for non-numeric id", () => {
    renderPage(port, "/clientes/abc");
    expect(screen.getByText("Cliente no válido")).toBeInTheDocument();
  });

  it("shows invalid message for id=0", () => {
    renderPage(port, "/clientes/0");
    expect(screen.getByText("Cliente no válido")).toBeInTheDocument();
  });

  it("passes clienteId correctly (port receives numeric 1042)", async () => {
    renderPage(port, "/clientes/1042");
    await waitFor(() =>
      expect(port.fichaCalls.length).toBeGreaterThan(0),
    );
    expect(port.fichaCalls[0].clienteId).toBe(1042);
  });
});
