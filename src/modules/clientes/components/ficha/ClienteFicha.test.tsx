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
// Helper render — accepts an optional initial URL path+search for deep-link tests
// ---------------------------------------------------------------------------

function renderFicha(port: FakeClientesPort, initialUrl = "/clientes/1042") {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
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

  // ── Tab structure ──────────────────────────────────────────────────────────

  it("renders 5 tab triggers", async () => {
    renderFicha(port);
    await waitFor(() =>
      expect(screen.getByText("Total comprado")).toBeInTheDocument(),
    );
    expect(screen.getByRole("tab", { name: "Resumen" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Análisis & predicción" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Pagos & solvencia" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Productos" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Riesgo & crédito" })).toBeInTheDocument();
  });

  it("clicking 'Análisis & predicción' reveals scores section", async () => {
    renderFicha(port);
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Análisis & predicción" })).toBeInTheDocument(),
    );
    expect(screen.queryByText("Inteligencia del cliente")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Análisis & predicción" }));

    await waitFor(() =>
      expect(screen.getByText("Inteligencia del cliente")).toBeInTheDocument(),
    );
  });

  it("clicking 'Pagos & solvencia' reveals ritmo de pago", async () => {
    renderFicha(port);
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Pagos & solvencia" })).toBeInTheDocument(),
    );
    expect(screen.queryByText("Ritmo de pago")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Pagos & solvencia" }));

    await waitFor(() =>
      expect(screen.getByText("Ritmo de pago")).toBeInTheDocument(),
    );
  });

  it("clicking 'Productos' reveals ventas list", async () => {
    renderFicha(port);
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Productos" })).toBeInTheDocument(),
    );
    expect(screen.queryByText("Historial de ventas")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Productos" }));

    await waitFor(() =>
      expect(screen.getByText("Historial de ventas")).toBeInTheDocument(),
    );
  });

  it("clicking 'Riesgo & crédito' reveals chart section", async () => {
    renderFicha(port);
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Riesgo & crédito" })).toBeInTheDocument(),
    );
    expect(screen.queryByText("Comprado vs abonado")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Riesgo & crédito" }));

    await waitFor(() =>
      expect(screen.getByText("Comprado vs abonado")).toBeInTheDocument(),
    );
  });

  it("?tab=pagos URL opens on Pagos & solvencia tab", async () => {
    renderFicha(port, "/clientes/1042?tab=pagos");
    await waitFor(() =>
      expect(screen.getByText("Ritmo de pago")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Total comprado")).not.toBeInTheDocument();
  });

  it("?tab=analisis URL opens on Análisis & predicción tab", async () => {
    renderFicha(port, "/clientes/1042?tab=analisis");
    await waitFor(() =>
      expect(screen.getByText("Inteligencia del cliente")).toBeInTheDocument(),
    );
  });

  // ── Resumen tab (default) ──────────────────────────────────────────────────

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
    // Rendered by FichaSaludStrip (% LIQUIDADO strip item)
    await waitFor(() =>
      expect(screen.getAllByText("93%").length).toBeGreaterThan(0),
    );
  });

  it("renders FichaSaludStrip progressbar", async () => {
    renderFicha(port);
    await waitFor(() =>
      expect(screen.getByRole("progressbar")).toBeInTheDocument(),
    );
  });

  // ── Análisis & predicción tab ──────────────────────────────────────────────

  it("renders inteligencia scores section with segmento when pulso present", async () => {
    renderFicha(port, "/clientes/1042?tab=analisis");
    await waitFor(() =>
      expect(screen.getByText("Inteligencia del cliente")).toBeInTheDocument(),
    );
    // Segmento badge label (appears in inteligencia Contexto RFM row)
    expect(screen.getAllByText("Dormido valioso").length).toBeGreaterThan(0);
  });

  it("hides inteligencia scores section when pulso is null", async () => {
    port.fichaResponse = makeFakeFichaCliente({ pulso: null });
    renderFicha(port, "/clientes/1042?tab=analisis");
    // Wait for ficha to load (header is always visible after load)
    await waitFor(() =>
      expect(screen.queryByText("No se pudo cargar el cliente")).not.toBeInTheDocument(),
    );
    // FichaInteligenciaScores returns null when pulso is null
    expect(screen.queryByText("Inteligencia del cliente")).not.toBeInTheDocument();
  });

  // ── Pagos & solvencia tab ──────────────────────────────────────────────────

  it("renders FichaRitmoPago with 'Ritmo de pago' heading", async () => {
    renderFicha(port, "/clientes/1042?tab=pagos");
    await waitFor(() =>
      expect(screen.getByText("Ritmo de pago")).toBeInTheDocument(),
    );
  });

  it("clicking a ritmo pago icon opens VentaModal for that venta", async () => {
    port.ritmoResponse = makeFakeRitmoPago({
      semanas: [
        {
          semanaInicio: new Date("2026-06-09T00:00:00.000Z"),
          montoAbonado: "500.00",
          saldo: "3000.00",
          numPagos: 1,
          pagos: [],
        },
      ],
      eventos: [
        {
          fecha: new Date("2026-06-10T00:00:00.000Z"),
          tipo: "venta_credito",
          monto: "9500.00",
          doctoPvId: 30099,
          folio: "CV-00999",
          plazoMeses: 6,
        },
      ],
    });
    port.obtenerDetalleResponse = makeFakeVentaDetalle({
      venta: makeFakeVentaCliente({ doctoPvId: 30099, folio: "CV-00999" }),
    });

    renderFicha(port, "/clientes/1042?tab=pagos");

    const iconBtn = await screen.findByRole("button", { name: "Ver venta CV-00999" });
    await userEvent.click(iconBtn);

    await waitFor(() =>
      expect(screen.getAllByText("CV-00999").length).toBeGreaterThan(1),
    );
  });

  // ── Productos tab ──────────────────────────────────────────────────────────

  it("renders ventas list rows", async () => {
    port.listarVentasResponse = {
      items: [
        makeFakeVentaCliente({ folio: "CV-00542" }),
        makeFakeVentaCliente({ doctoPvId: 30016, folio: "CV-00543" }),
      ],
      nextCursor: "",
    };
    renderFicha(port, "/clientes/1042?tab=productos");
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

    renderFicha(port, "/clientes/1042?tab=productos");

    const row = await screen.findByText("CV-00542");
    await userEvent.click(row.closest("tr")!);

    await waitFor(() =>
      expect(
        screen.getAllByText("CV-00542").length,
      ).toBeGreaterThan(1),
    );
  });

  it("shows empty ventas state when no ventas", async () => {
    port.listarVentasResponse = { items: [], nextCursor: "" };
    renderFicha(port, "/clientes/1042?tab=productos");
    await waitFor(() =>
      expect(
        screen.getByText("Sin ventas registradas"),
      ).toBeInTheDocument(),
    );
  });

  // ── Riesgo & crédito tab ───────────────────────────────────────────────────

  it("renders chart section title in riesgo tab", async () => {
    renderFicha(port, "/clientes/1042?tab=riesgo");
    await waitFor(() =>
      expect(screen.getByText("Comprado vs abonado")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Abonos por mes")).not.toBeInTheDocument();
  });

  // ── Error / edge cases ─────────────────────────────────────────────────────

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

  it("does not render the 'Acción recomendada' section (hidden for now)", async () => {
    renderFicha(port, "/clientes/1042?tab=analisis");
    await waitFor(() =>
      expect(screen.getByText("Inteligencia del cliente")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Acción recomendada")).not.toBeInTheDocument();
  });
});
