import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { VentaV2 } from "@/services/api/ventaV2Types";
import { useVentaEditState } from "./useVentaEditState";

// makeVenta espeja el fixture de components/detalle/VentaDetalleHero.test.tsx.
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

describe("useVentaEditState — edición de dirección va por el header", () => {
  it("al cambiar SOLO la calle, isDirty=true y el header PATCH lleva la dirección nueva", () => {
    const { result } = renderHook(() => useVentaEditState(makeVenta()));

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.updateCliente("calle", "Av. Reforma 100");
    });

    expect(result.current.isDirty).toBe(true);

    const out = result.current.getInput();
    expect(out.ok).toBe(true);
    if (!out.ok) return;

    // Regresión: antes de este fix, header quedaba undefined al cambiar solo
    // la dirección (clienteDiffers la veía, pero /cliente no la manda).
    expect(out.input.cambios.header).toBeDefined();
    expect(out.input.cambios.header?.direccion.calle).toBe("Av. Reforma 100");
    // La identidad no cambió → no se manda el bloque /cliente.
    expect(out.input.cambios.cliente).toBeUndefined();
  });
});
