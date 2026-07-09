import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ---- Mocks (must be declared before component import) ----

vi.mock("@/hooks/useVentaV2", () => ({ default: vi.fn() }));
vi.mock("@/hooks/useGetZonasCliente", () => ({ default: vi.fn() }));
vi.mock("../../presentation/hooks/useVentaEventos", () => ({
  useVentaEventos: vi.fn(),
}));

// Stub ZonaMismatchBanner with a detectable marker so we can assert
// its presence without needing the hook internals wired.
vi.mock("./ZonaMismatchBanner", () => ({
  default: () => <div data-testid="zona-mismatch-banner">zona-mismatch</div>,
}));

// Stub heavier child components that aren't under test here.
vi.mock("../EditarVentaModal", () => ({ default: () => null }));

import useVentaV2 from "@/hooks/useVentaV2";
import useGetZonasCliente from "@/hooks/useGetZonasCliente";
import { useVentaEventos } from "../../presentation/hooks/useVentaEventos";
import type { VentaV2 } from "@/services/api/ventaV2Types";
import { VentaDetalleModal } from "./VentaDetalleModal";

const mockUseVentaV2 = vi.mocked(useVentaV2);
const mockUseGetZonasCliente = vi.mocked(useGetZonasCliente);
const mockUseVentaEventos = vi.mocked(useVentaEventos);

function makeVenta(overrides: Partial<VentaV2> = {}): VentaV2 {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    cliente: { cliente_id: null, nombre: "Cliente Demo", telefono: null, aval: null, referencia: null },
    direccion: {
      calle: "Calle",
      numero_exterior: null,
      colonia: "Centro",
      poblacion: "Pueblo",
      ciudad: "Ciudad",
      zona_cliente_id: 1,
    },
    gps: { latitud: 0, longitud: 0 },
    fecha_venta: "2026-06-09T01:22:32Z",
    tipo_venta: "CREDITO",
    estado: "active",
    situacion: "aprobada",
    sincronizacion: "pendiente",
    microsip_folio: null,
    microsip_docto_pv_id: null,
    microsip_aplicada_at: null,
    montos: { anual: "0", corto_plazo: "0", contado: "0" },
    plan_credito: null,
    dia_cobranza: null,
    nota: null,
    combos: [],
    productos: [],
    vendedores: [],
    imagenes: [],
    cancelacion: null,
    aprobacion: null,
    created_at: "2026-06-09T01:22:32Z",
    updated_at: "2026-06-09T01:22:32Z",
    created_by: "e45ef599-7bc4-4df0-a256-23de460a959e",
    updated_by: "e45ef599-7bc4-4df0-a256-23de460a959e",
    ...overrides,
  };
}

beforeEach(() => {
  mockUseVentaV2.mockReset();
  mockUseGetZonasCliente.mockReset();
  mockUseVentaEventos.mockReset();
  mockUseGetZonasCliente.mockReturnValue({
    zonas: [],
    loading: false,
    error: null,
    getZonaById: () => undefined,
    refetch: vi.fn().mockResolvedValue(undefined),
  });
  mockUseVentaEventos.mockReturnValue({ eventos: [], isLoading: false, error: null });
});

describe("VentaDetalleModal — zona mismatch banner", () => {
  it("renders the banner when zona_mismatch is true", () => {
    mockUseVentaV2.mockReturnValue({
      venta: makeVenta({ zona_mismatch: true, zona_cliente_microsip_id: 2 }),
      loading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    });
    render(<VentaDetalleModal ventaId="11111111-1111-1111-1111-111111111111" onClose={() => {}} />);
    expect(screen.getByTestId("zona-mismatch-banner")).toBeInTheDocument();
  });

  it("does not render the banner when zona_mismatch is false", () => {
    mockUseVentaV2.mockReturnValue({
      venta: makeVenta({ zona_mismatch: false }),
      loading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    });
    render(<VentaDetalleModal ventaId="11111111-1111-1111-1111-111111111111" onClose={() => {}} />);
    expect(screen.queryByTestId("zona-mismatch-banner")).not.toBeInTheDocument();
  });

  it("does not render the banner when zona_mismatch is absent", () => {
    mockUseVentaV2.mockReturnValue({
      venta: makeVenta(),
      loading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    });
    render(<VentaDetalleModal ventaId="11111111-1111-1111-1111-111111111111" onClose={() => {}} />);
    expect(screen.queryByTestId("zona-mismatch-banner")).not.toBeInTheDocument();
  });
});

describe("VentaDetalleModal — estatus cliente banner", () => {
  it("renders the banner when estatus_cliente_microsip is V", () => {
    mockUseVentaV2.mockReturnValue({
      venta: makeVenta({ estatus_cliente_microsip: "V" }),
      loading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    });
    render(<VentaDetalleModal ventaId="11111111-1111-1111-1111-111111111111" onClose={() => {}} />);
    expect(screen.getByText("Cliente vetado")).toBeInTheDocument();
  });

  it("renders the banner when estatus_cliente_microsip is C", () => {
    mockUseVentaV2.mockReturnValue({
      venta: makeVenta({ estatus_cliente_microsip: "C" }),
      loading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    });
    render(<VentaDetalleModal ventaId="11111111-1111-1111-1111-111111111111" onClose={() => {}} />);
    expect(screen.getByText("Cliente cancelado")).toBeInTheDocument();
  });

  it("does not render the banner when estatus_cliente_microsip is A", () => {
    mockUseVentaV2.mockReturnValue({
      venta: makeVenta({ estatus_cliente_microsip: "A" }),
      loading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    });
    render(<VentaDetalleModal ventaId="11111111-1111-1111-1111-111111111111" onClose={() => {}} />);
    expect(screen.queryByText("Cliente vetado")).not.toBeInTheDocument();
    expect(screen.queryByText("Cliente cancelado")).not.toBeInTheDocument();
  });

  it("does not render the banner when estatus_cliente_microsip is absent", () => {
    mockUseVentaV2.mockReturnValue({
      venta: makeVenta(),
      loading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    });
    render(<VentaDetalleModal ventaId="11111111-1111-1111-1111-111111111111" onClose={() => {}} />);
    expect(screen.queryByText("Cliente vetado")).not.toBeInTheDocument();
    expect(screen.queryByText("Cliente cancelado")).not.toBeInTheDocument();
  });
});
