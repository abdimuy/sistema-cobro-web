import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ClientesProvider } from "../../presentation/context/ClientesContext";
import {
  FakeClientesPort,
  makeFakeFichaCliente,
  makeFakeVentaCliente,
  makeFakeVentaDetalle,
} from "../../application/__tests__/fakeClientesPort";
import { ClienteFicha } from "./ClienteFicha";

// ---------------------------------------------------------------------------
// recharts: mock ResponsiveContainer so it renders in jsdom (no real width)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Helper render
// ---------------------------------------------------------------------------

function renderFicha(port: FakeClientesPort) {
  return render(
    <MemoryRouter>
      <ClientesProvider port={port}>
        <ClienteFicha clienteId={1042} />
      </ClientesProvider>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ClienteFicha", () => {
  let port: FakeClientesPort;

  beforeEach(() => {
    port = new FakeClientesPort();
    port.fichaResponse = makeFakeFichaCliente();
    port.listarVentasResponse = {
      items: [makeFakeVentaCliente()],
      nextCursor: "",
    };
    port.obtenerDetalleResponse = makeFakeVentaDetalle();
  });

  it("renders nombre in serif heading", async () => {
    renderFicha(port);
    await waitFor(() =>
      expect(
        screen.getAllByText("MUEBLES HERNÁNDEZ S.A.").length,
      ).toBeGreaterThan(0),
    );
  });

  it("renders KPI: Total comprado", async () => {
    renderFicha(port);
    await waitFor(() =>
      expect(screen.getByText("Total comprado")).toBeInTheDocument(),
    );
  });

  it("renders KPI values (MXN formatted)", async () => {
    renderFicha(port);
    // totalComprado = "120000.00" → $120,000.00
    await waitFor(() =>
      expect(screen.getAllByText(/\$120[.,]?000/i).length).toBeGreaterThan(0),
    );
  });

  it("renders pct liquidado", async () => {
    renderFicha(port);
    // pctLiquidado "92.92" (0–100 del API) → "93%"
    await waitFor(() =>
      expect(screen.getByText("93%")).toBeInTheDocument(),
    );
  });

  it("renders chart section titles", async () => {
    renderFicha(port);
    await waitFor(() =>
      expect(screen.getByText("Abonos por mes")).toBeInTheDocument(),
    );
    expect(
      screen.getByText("Comprado vs abonado"),
    ).toBeInTheDocument();
  });

  it("renders pulso card with segmento and NBP when pulso present", async () => {
    renderFicha(port);
    await waitFor(() =>
      expect(screen.getByText("Pulso analítico")).toBeInTheDocument(),
    );
    // Segmento badge label (appears in both hero and pulso card)
    expect(screen.getAllByText("Dormido valioso").length).toBeGreaterThan(0);
    // Next best product
    expect(screen.getByText("COMEDOR")).toBeInTheDocument();
  });

  it("shows muted note when pulso is null", async () => {
    port.fichaResponse = makeFakeFichaCliente({ pulso: null });
    renderFicha(port);
    await waitFor(() =>
      expect(
        screen.getByText(
          /Este cliente aún no tiene pulso analítico/i,
        ),
      ).toBeInTheDocument(),
    );
  });

  it("renders ventas list rows", async () => {
    port.listarVentasResponse = {
      items: [
        makeFakeVentaCliente({ folio: "CV-00542" }),
        makeFakeVentaCliente({ doctoPvId: 30016, folio: "CV-00543" }),
      ],
      nextCursor: "",
    };
    renderFicha(port);
    await waitFor(() =>
      expect(screen.getByText("CV-00542")).toBeInTheDocument(),
    );
    expect(screen.getByText("CV-00543")).toBeInTheDocument();
  });

  it("clicking a venta row opens VentaModal (shows folio in modal)", async () => {
    port.listarVentasResponse = {
      items: [makeFakeVentaCliente({ folio: "CV-00542" })],
      nextCursor: "",
    };
    port.obtenerDetalleResponse = makeFakeVentaDetalle();

    renderFicha(port);

    // Wait for ventas list to load
    const row = await screen.findByText("CV-00542");
    await userEvent.click(row.closest("tr")!);

    // Modal opens and fetches detalle — folio appears at least twice
    await waitFor(() =>
      expect(
        screen.getAllByText("CV-00542").length,
      ).toBeGreaterThan(1),
    );
  });

  it("shows full-page error when ficha fetch fails", async () => {
    port.throwOnNext.obtenerFicha = new Error("falla de red");
    renderFicha(port);
    await waitFor(() =>
      expect(
        screen.getByText("No se pudo cargar el cliente"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("falla de red")).toBeInTheDocument();
  });

  it("shows empty ventas state when no ventas", async () => {
    port.listarVentasResponse = { items: [], nextCursor: "" };
    renderFicha(port);
    await waitFor(() =>
      expect(
        screen.getByText("Sin ventas registradas"),
      ).toBeInTheDocument(),
    );
  });
});
