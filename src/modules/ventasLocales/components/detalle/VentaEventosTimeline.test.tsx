import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { eventoMeta, formatBytes } from "./eventoMeta";
import type { VentaEvento } from "../../domain/entities/VentaEvento";
import { VentaEventosTimeline } from "./VentaEventosTimeline";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvento(overrides: Partial<VentaEvento> = {}): VentaEvento {
  return {
    id: "test-id",
    eventType: "venta.creada",
    payload: { tipo_venta: "CREDITO" },
    occurredAt: new Date("2026-06-09T07:22:33Z"),
    actorNombre: "",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// eventoMeta — label mapping
// ---------------------------------------------------------------------------

describe("eventoMeta — label mapping", () => {
  it("maps venta.creada", () => {
    const meta = eventoMeta(makeEvento({ eventType: "venta.creada", payload: { tipo_venta: "CREDITO" } }));
    expect(meta.label).toBe("Venta creada");
    expect(meta.detail).toBe("CREDITO");
  });

  it("maps venta.aplicada with folio", () => {
    const meta = eventoMeta(
      makeEvento({ eventType: "venta.aplicada", payload: { microsip_folio: "Y00002214" } }),
    );
    expect(meta.label).toBe("Aplicada en Microsip");
    expect(meta.detail).toBe("Folio Y00002214");
  });

  it("maps venta.aplicada without folio to empty detail", () => {
    const meta = eventoMeta(makeEvento({ eventType: "venta.aplicada", payload: {} }));
    expect(meta.label).toBe("Aplicada en Microsip");
    expect(meta.detail).toBe("");
  });

  it("maps venta.imagen_adjuntada with size_bytes", () => {
    const meta = eventoMeta(
      makeEvento({ eventType: "venta.imagen_adjuntada", payload: { size_bytes: 131710 } }),
    );
    expect(meta.label).toBe("Imagen adjuntada");
    // 131710 / 1024 ≈ 129 KB
    expect(meta.detail).toBe("129 KB");
  });

  it("maps traspaso.creado", () => {
    const meta = eventoMeta(makeEvento({ eventType: "traspaso.creado", payload: {} }));
    expect(meta.label).toBe("Traspaso de inventario creado");
    expect(meta.detail).toBe("");
  });

  it("maps traspaso.creado with almacén route + count", () => {
    const meta = eventoMeta(
      makeEvento({
        eventType: "traspaso.creado",
        payload: {
          almacen_origen_nombre: "CAMIONETA NISSAN 2000 - JUEVES",
          almacen_destino_nombre: "TIENDA DE EXHIBICION",
          detalles_count: 1,
          folio: "MST000123",
        },
      }),
    );
    expect(meta.detail).toBe("CAMIONETA NISSAN 2000 - JUEVES → TIENDA DE EXHIBICION · 1 art.");
  });

  it("pluralizes the traspaso article count", () => {
    const meta = eventoMeta(
      makeEvento({
        eventType: "traspaso.creado",
        payload: {
          almacen_origen_nombre: "BODEGA",
          almacen_destino_nombre: "TIENDA",
          detalles_count: 3,
        },
      }),
    );
    expect(meta.detail).toBe("BODEGA → TIENDA · 3 arts.");
  });

  it("falls back to the folio when almacén names are absent", () => {
    const meta = eventoMeta(
      makeEvento({
        eventType: "traspaso.creado",
        payload: { folio: "MST000123", detalles_count: 2 },
      }),
    );
    expect(meta.detail).toBe("MST000123 · 2 arts.");
  });

  it("maps traspaso.reversado", () => {
    const meta = eventoMeta(makeEvento({ eventType: "traspaso.reversado", payload: {} }));
    expect(meta.label).toBe("Traspaso revertido");
  });

  it("maps traspaso.reversado with route detail", () => {
    const meta = eventoMeta(
      makeEvento({
        eventType: "traspaso.reversado",
        payload: {
          almacen_origen_nombre: "TIENDA",
          almacen_destino_nombre: "CAMIONETA NISSAN",
          detalles_count: 1,
        },
      }),
    );
    expect(meta.detail).toBe("TIENDA → CAMIONETA NISSAN · 1 art.");
  });

  it("maps venta.productos_reemplazados with count", () => {
    const meta = eventoMeta(
      makeEvento({ eventType: "venta.productos_reemplazados", payload: { productos_count: 4 } }),
    );
    expect(meta.label).toBe("Productos actualizados");
    expect(meta.detail).toBe("4 productos");
  });

  it("maps venta.combos_reemplazados with count (singular)", () => {
    const meta = eventoMeta(
      makeEvento({ eventType: "venta.combos_reemplazados", payload: { combos_count: 1 } }),
    );
    expect(meta.label).toBe("Combos actualizados");
    expect(meta.detail).toBe("1 combo");
  });

  it("maps venta.vendedores_reemplazados with count", () => {
    const meta = eventoMeta(
      makeEvento({ eventType: "venta.vendedores_reemplazados", payload: { vendedores_count: 2 } }),
    );
    expect(meta.label).toBe("Vendedores actualizados");
    expect(meta.detail).toBe("2 vendedores");
  });

  it("omits the count detail when the payload lacks it", () => {
    const meta = eventoMeta(makeEvento({ eventType: "venta.productos_reemplazados", payload: {} }));
    expect(meta.detail).toBe("");
  });

  it("maps venta.cancelada with reason", () => {
    const meta = eventoMeta(
      makeEvento({ eventType: "venta.cancelada", payload: { reason: "Error de captura" } }),
    );
    expect(meta.label).toBe("Cancelada");
    expect(meta.detail).toBe("Error de captura");
  });

  it("returns raw event_type as label for unknown types", () => {
    const meta = eventoMeta(makeEvento({ eventType: "alguna.cosa.nueva", payload: {} }));
    expect(meta.label).toBe("alguna.cosa.nueva");
    expect(meta.detail).toBe("");
  });
});

// ---------------------------------------------------------------------------
// formatBytes
// ---------------------------------------------------------------------------

describe("formatBytes", () => {
  it("formats bytes under 1 KB", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes (rounds to whole number)", () => {
    expect(formatBytes(131710)).toBe("129 KB");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("2 KB");
  });

  it("formats megabytes (one decimal)", () => {
    expect(formatBytes(1048576)).toBe("1.0 MB");
    expect(formatBytes(2621440)).toBe("2.5 MB");
  });
});

// ---------------------------------------------------------------------------
// VentaEventosTimeline — component rendering
// ---------------------------------------------------------------------------

// Mock the hook so component tests don't hit the network.
vi.mock("../../presentation/hooks/useVentaEventos", () => ({
  useVentaEventos: vi.fn(),
}));

import { useVentaEventos } from "../../presentation/hooks/useVentaEventos";

const mockUseVentaEventos = vi.mocked(useVentaEventos);

beforeEach(() => {
  mockUseVentaEventos.mockReset();
});

describe("VentaEventosTimeline", () => {
  it("renders loading skeleton while fetching", () => {
    mockUseVentaEventos.mockReturnValue({ eventos: [], isLoading: true, error: null });
    render(<VentaEventosTimeline ventaID="test-id" />);
    expect(screen.getByLabelText("Cargando historial")).toBeInTheDocument();
  });

  it("renders empty state when no events", () => {
    mockUseVentaEventos.mockReturnValue({ eventos: [], isLoading: false, error: null });
    render(<VentaEventosTimeline ventaID="test-id" />);
    expect(screen.getByText("Sin eventos registrados")).toBeInTheDocument();
  });

  it("renders error state", () => {
    mockUseVentaEventos.mockReturnValue({
      eventos: [],
      isLoading: false,
      error: "fallo de red",
    });
    render(<VentaEventosTimeline ventaID="test-id" />);
    expect(screen.getByText("No se pudo cargar el historial")).toBeInTheDocument();
  });

  it("renders event labels for a list of eventos", () => {
    const eventos: VentaEvento[] = [
      makeEvento({ id: "1", eventType: "venta.creada", payload: { tipo_venta: "CREDITO" } }),
      makeEvento({ id: "2", eventType: "venta.aprobada", payload: {} }),
      makeEvento({
        id: "3",
        eventType: "venta.aplicada",
        payload: { microsip_folio: "Y00002214" },
      }),
    ];
    mockUseVentaEventos.mockReturnValue({ eventos, isLoading: false, error: null });

    render(<VentaEventosTimeline ventaID="test-id" />);

    expect(screen.getByText("Venta creada")).toBeInTheDocument();
    expect(screen.getByText("Aprobada")).toBeInTheDocument();
    expect(screen.getByText("Aplicada en Microsip")).toBeInTheDocument();
    expect(screen.getByText("Folio Y00002214")).toBeInTheDocument();
  });

  it("renders the traspaso route detail", () => {
    const eventos: VentaEvento[] = [
      makeEvento({
        id: "1",
        eventType: "traspaso.creado",
        payload: {
          almacen_origen_nombre: "CAMIONETA NISSAN 2000 - JUEVES",
          almacen_destino_nombre: "TIENDA DE EXHIBICION",
          detalles_count: 1,
        },
      }),
    ];
    mockUseVentaEventos.mockReturnValue({ eventos, isLoading: false, error: null });

    render(<VentaEventosTimeline ventaID="test-id" />);
    expect(screen.getByText("Traspaso de inventario creado")).toBeInTheDocument();
    expect(
      screen.getByText("CAMIONETA NISSAN 2000 - JUEVES → TIENDA DE EXHIBICION · 1 art."),
    ).toBeInTheDocument();
  });

  it("renders the edit count detail", () => {
    const eventos: VentaEvento[] = [
      makeEvento({ id: "1", eventType: "venta.productos_reemplazados", payload: { productos_count: 5 } }),
    ];
    mockUseVentaEventos.mockReturnValue({ eventos, isLoading: false, error: null });

    render(<VentaEventosTimeline ventaID="test-id" />);
    expect(screen.getByText("5 productos")).toBeInTheDocument();
  });

  it("renders size detail for imagen_adjuntada", () => {
    const eventos: VentaEvento[] = [
      makeEvento({
        id: "1",
        eventType: "venta.imagen_adjuntada",
        payload: { size_bytes: 131710 },
      }),
    ];
    mockUseVentaEventos.mockReturnValue({ eventos, isLoading: false, error: null });

    render(<VentaEventosTimeline ventaID="test-id" />);
    expect(screen.getByText("129 KB")).toBeInTheDocument();
  });

  it("renders a raw label for an unknown event_type", () => {
    const eventos: VentaEvento[] = [
      makeEvento({ id: "1", eventType: "nueva.funcionalidad.futura", payload: {} }),
    ];
    mockUseVentaEventos.mockReturnValue({ eventos, isLoading: false, error: null });

    render(<VentaEventosTimeline ventaID="test-id" />);
    expect(screen.getByText("nueva.funcionalidad.futura")).toBeInTheDocument();
  });

  it("renders the actor name when present", () => {
    const eventos: VentaEvento[] = [
      makeEvento({ id: "1", eventType: "venta.aprobada", payload: {}, actorNombre: "Aldrich Cortero" }),
    ];
    mockUseVentaEventos.mockReturnValue({ eventos, isLoading: false, error: null });

    render(<VentaEventosTimeline ventaID="test-id" />);
    expect(screen.getByText("Aldrich Cortero")).toBeInTheDocument();
  });

  it("omits the actor line when no actor is present", () => {
    const eventos: VentaEvento[] = [
      makeEvento({ id: "1", eventType: "venta.imagen_adjuntada", payload: { size_bytes: 1024 }, actorNombre: "" }),
    ];
    mockUseVentaEventos.mockReturnValue({ eventos, isLoading: false, error: null });

    render(<VentaEventosTimeline ventaID="test-id" />);
    // No "por …" actor line is rendered.
    expect(screen.queryByText(/^por /)).not.toBeInTheDocument();
  });
});
