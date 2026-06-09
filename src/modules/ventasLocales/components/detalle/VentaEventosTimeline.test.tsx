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

  it("maps traspaso.reversado", () => {
    const meta = eventoMeta(makeEvento({ eventType: "traspaso.reversado", payload: {} }));
    expect(meta.label).toBe("Traspaso revertido");
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
});
