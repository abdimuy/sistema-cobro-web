import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { VentaV2 } from "@/services/api/ventaV2Types";

// Mock the actions hook so tests don't hit the network.
vi.mock("./useVentaActions", () => ({
  useVentaActions: vi.fn(),
}));

import { useVentaActions } from "./useVentaActions";
import VentaActionBar from "./VentaActionBar";

const mockUseVentaActions = vi.mocked(useVentaActions);

function makeVenta(overrides: Partial<VentaV2> = {}): VentaV2 {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    cliente: { cliente_id: 24037, nombre: "Cliente Demo", telefono: null, aval: null, referencia: null },
    direccion: {
      calle: "Calle",
      numero_exterior: "12",
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
    montos: { anual: "1000", corto_plazo: "1200", contado: "900" },
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
  mockUseVentaActions.mockReset();
  mockUseVentaActions.mockReturnValue({
    pending: null,
    isPending: false,
    revisar: vi.fn(),
    aprobar: vi.fn(),
    regresar: vi.fn(),
    aplicar: vi.fn(),
    cancelar: vi.fn(),
  });
});

describe("VentaActionBar — botón Aplicar según estatus del cliente", () => {
  it("enables the Aplicar button when estatus is A", () => {
    render(
      <VentaActionBar
        venta={makeVenta({ estatus_cliente_microsip: "A" })}
        onClose={() => {}}
        onUpdated={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /aplicar a microsip/i })).toBeEnabled();
  });

  it("disables the Aplicar button when estatus is V", () => {
    render(
      <VentaActionBar
        venta={makeVenta({ estatus_cliente_microsip: "V" })}
        onClose={() => {}}
        onUpdated={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /aplicar a microsip/i })).toBeDisabled();
  });

  it("disables the Aplicar button when estatus is C", () => {
    render(
      <VentaActionBar
        venta={makeVenta({ estatus_cliente_microsip: "C" })}
        onClose={() => {}}
        onUpdated={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /aplicar a microsip/i })).toBeDisabled();
  });

  it("enables the Aplicar button when estatus is absent", () => {
    render(
      <VentaActionBar
        venta={makeVenta({ estatus_cliente_microsip: undefined })}
        onClose={() => {}}
        onUpdated={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /aplicar a microsip/i })).toBeEnabled();
  });
});
