import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("clicking a sortable header refetches with sort_by/sort_order", async () => {
    const user = userEvent.setup();
    port.buscarResponse = {
      items: [makeFakeCliente({ nombre: "MUEBLES HERNÁNDEZ S.A." })],
      nextCursor: "",
    };
    renderScreen(port);
    await waitFor(() =>
      expect(screen.getByText("MUEBLES HERNÁNDEZ S.A.")).toBeInTheDocument(),
    );

    // First click on "Saldo" → asc
    await user.click(screen.getByRole("button", { name: /saldo/i }));
    await waitFor(() => {
      const last = port.buscarCalls[port.buscarCalls.length - 1].input;
      expect(last.sortBy).toBe("saldo");
      expect(last.sortOrder).toBe("asc");
    });

    // Second click on the same column toggles to desc
    await user.click(screen.getByRole("button", { name: /saldo/i }));
    await waitFor(() => {
      const last = port.buscarCalls[port.buscarCalls.length - 1].input;
      expect(last.sortBy).toBe("saldo");
      expect(last.sortOrder).toBe("desc");
    });
  });

  it("renders items in the order the port returned (no local re-sort)", async () => {
    // Deliberately out of natural (alphabetical / numeric) order — the screen
    // must render exactly this sequence because the API already sorted it.
    port.buscarResponse = {
      items: [
        makeFakeCliente({ clienteId: 1, nombre: "ZAPATERÍA ZÚÑIGA", saldo: "100.00" }),
        makeFakeCliente({ clienteId: 2, nombre: "ABARROTES ÁVILA", saldo: "900.00" }),
        makeFakeCliente({ clienteId: 3, nombre: "MUEBLES MENDOZA", saldo: "500.00" }),
      ],
      nextCursor: "",
    };
    renderScreen(port);
    await waitFor(() =>
      expect(screen.getByText("ZAPATERÍA ZÚÑIGA")).toBeInTheDocument(),
    );

    const dataRows = screen
      .getAllByRole("row")
      .filter((row) => within(row).queryByText(/ZÚÑIGA|ÁVILA|MENDOZA/));
    const order = dataRows.map((row) => {
      if (within(row).queryByText("ZAPATERÍA ZÚÑIGA")) return "ZAPATERÍA ZÚÑIGA";
      if (within(row).queryByText("ABARROTES ÁVILA")) return "ABARROTES ÁVILA";
      return "MUEBLES MENDOZA";
    });
    expect(order).toEqual([
      "ZAPATERÍA ZÚÑIGA",
      "ABARROTES ÁVILA",
      "MUEBLES MENDOZA",
    ]);
  });
});
