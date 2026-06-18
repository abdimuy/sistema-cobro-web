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
  makeFakeRitmoPago,
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
    port.fichaResponse = makeFakeFichaCliente({
      pulso: {
        score: 68,
        segmento: "DORMIDO_VALIOSO",
        estadoPago: "AL_CORRIENTE",
        recenciaDias: 120,
        frecuencia: 7,
        monetary: "120000.00",
        saldo: "8500.00",
        porLiquidarPct: "7.08",
        fechaUltimaCompra: new Date("2025-11-01T00:00:00.000Z"),
        fechaUltimoPago: new Date("2025-12-15T00:00:00.000Z"),
        nextBestProduct: "COMEDOR",
        numPagos: 24,
        cadenciaDias: 30,
        diasAtrasoProm: 3,
        pctPagosATiempo: "87.50",
        fechaProxPago: new Date("2026-01-15T00:00:00.000Z"),
        montoProxPago: "3500.00",
        tierRiesgo: "VIGILANCIA",
        bandaCredito: "BAJO",
        scoreCredito: 85,
        bandaRecompra: "ALTA",
        scoreRecompra: 72,
        clv: "180000.00",
        bandaClv: "ALTO",
      },
    });
    port.listarVentasResponse = {
      items: [makeFakeVentaCliente()],
      nextCursor: "",
    };
    port.obtenerDetalleResponse = makeFakeVentaDetalle();
    port.ritmoResponse = makeFakeRitmoPago();
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
    // Appears in FichaKpis and FichaLiquidacionBar
    await waitFor(() =>
      expect(screen.getAllByText("93%").length).toBeGreaterThan(0),
    );
  });

  it("renders chart section title", async () => {
    renderFicha(port);
    await waitFor(() =>
      expect(screen.getByText("Comprado vs abonado")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Abonos por mes")).not.toBeInTheDocument();
  });

  it("renders pulso card with segmento and NBP when pulso present", async () => {
    renderFicha(port);
    await waitFor(() =>
      expect(screen.getByText("Pulso analítico")).toBeInTheDocument(),
    );
    // Segmento badge label (appears in both hero and pulso card)
    expect(screen.getAllByText("Dormido valioso").length).toBeGreaterThan(0);
    // Next best product (appears in both FichaNextBestAction and FichaPulsoCard)
    expect(screen.getAllByText("COMEDOR").length).toBeGreaterThan(0);
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

  it("renders FichaNextBestAction with 'Acción recomendada' heading when pulso has bands", async () => {
    renderFicha(port);
    // "Acción recomendada" appears as section aria-label and as heading text
    await waitFor(() =>
      expect(screen.getAllByText("Acción recomendada").length).toBeGreaterThan(0),
    );
  });

  it("renders FichaLiquidacionBar progressbar", async () => {
    renderFicha(port);
    await waitFor(() =>
      expect(screen.getByRole("progressbar")).toBeInTheDocument(),
    );
  });

  it("renders FichaRitmoPago with 'Ritmo de pago' heading", async () => {
    renderFicha(port);
    await waitFor(() =>
      expect(screen.getByText("Ritmo de pago")).toBeInTheDocument(),
    );
  });
});
