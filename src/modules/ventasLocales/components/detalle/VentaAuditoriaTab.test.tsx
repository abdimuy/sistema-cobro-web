import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import VentaAuditoriaTab from "./VentaAuditoriaTab";
import type { VentaV2 } from "@/services/api/ventaV2Types";

// VentaAuditoriaTab renders the events timeline (network-backed) — mock the
// hook so these tests stay focused on the audit metadata panel.
vi.mock("../../presentation/hooks/useVentaEventos", () => ({
  useVentaEventos: vi.fn(),
}));

import { useVentaEventos } from "../../presentation/hooks/useVentaEventos";

const mockUseVentaEventos = vi.mocked(useVentaEventos);

beforeEach(() => {
  mockUseVentaEventos.mockReset();
  mockUseVentaEventos.mockReturnValue({ eventos: [], isLoading: false, error: null });
});

const CREATED_BY = "e45ef599-7bc4-4df0-a256-23de460a959e";

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
      zona_cliente_id: null,
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
    updated_at: "2026-06-09T01:39:44Z",
    created_by: CREATED_BY,
    updated_by: CREATED_BY,
    ...overrides,
  };
}

describe("VentaAuditoriaTab — audit actors", () => {
  it("shows the resolved display name when present", () => {
    render(
      <VentaAuditoriaTab
        venta={makeVenta({ created_by_nombre: "Aldrich Cortero", updated_by_nombre: "Aldrich Cortero" })}
      />,
    );
    expect(screen.getAllByText("Aldrich Cortero").length).toBeGreaterThanOrEqual(2);
    // The raw UUID is no longer rendered for those fields.
    expect(screen.queryByText(CREATED_BY)).not.toBeInTheDocument();
  });

  it("falls back to the raw UUID when no name was resolved", () => {
    render(<VentaAuditoriaTab venta={makeVenta()} />);
    // created_by + updated_by both fall back to the same UUID.
    expect(screen.getAllByText(CREATED_BY).length).toBe(2);
  });

  it("resolves the aprobada_by actor name", () => {
    render(
      <VentaAuditoriaTab
        venta={makeVenta({
          aprobacion: { at: "2026-06-09T01:39:42Z", by: CREATED_BY, by_nombre: "Beto Aprobador" },
        })}
      />,
    );
    expect(screen.getByText("Beto Aprobador")).toBeInTheDocument();
  });
});
