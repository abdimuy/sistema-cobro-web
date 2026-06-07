import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useVentaReplayEdit } from "./useVentaReplayEdit";

function makeValidBody(): Record<string, unknown> {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    cliente: {
      cliente_id: 7,
      nombre: "CARLOS MENDEZ",
      telefono: "+524491234567",
      aval: null,
      referencia: null,
    },
    direccion: {
      calle: "AV AGUASCALIENTES",
      numero_exterior: "123",
      colonia: "CENTRO",
      poblacion: "AGUASCALIENTES",
      ciudad: "AGUASCALIENTES",
      zona_cliente_id: 4,
    },
    gps: { latitud: 21.88, longitud: -102.29 },
    fecha_venta: "2026-06-06T10:00:00Z",
    tipo_venta: "CONTADO",
    montos: { anual: "1000.00", corto_plazo: "1000.00", contado: "1000.00" },
    combos: [],
    productos: [
      {
        id: "22222222-2222-2222-2222-222222222222",
        articulo_id: 100,
        articulo: "SILLA",
        cantidad: "1",
        precio_anual: "1000.00",
        precio_corto: "1000.00",
        precio_contado: "1000.00",
        combo_id: null,
        almacen_origen_id: 1,
        almacen_destino_id: 2,
      },
    ],
    vendedores: [
      {
        id: "33333333-3333-3333-3333-333333333333",
        usuario_id: "44444444-4444-4444-4444-444444444444",
        email: "v@muebleriamsp.mx",
        nombre: "JUAN",
      },
    ],
  };
}

describe("useVentaReplayEdit", () => {
  it("reports available=true and a populated state for a venta-shaped body", () => {
    const { result } = renderHook(() => useVentaReplayEdit(makeValidBody()));
    expect(result.current.available).toBe(true);
    expect(result.current.state).not.toBeNull();
    expect(result.current.state!.formData.cliente.nombreCliente).toBe("CARLOS MENDEZ");
  });

  it("reports available=false when the body is not venta-shaped", () => {
    const { result } = renderHook(() => useVentaReplayEdit({ some: "other body" }));
    expect(result.current.available).toBe(false);
    expect(result.current.state).toBeNull();
    expect(result.current.buildSubmitPayload()).toBeNull();
  });

  it("reports available=false when ventaV2ToDomain throws on invalid data", () => {
    const body = makeValidBody();
    (body.montos as Record<string, unknown>).anual = "not-a-number";
    const { result } = renderHook(() => useVentaReplayEdit(body));
    expect(result.current.available).toBe(false);
    expect(result.current.state).toBeNull();
  });

  it("buildSubmitPayload reflects edits applied via state callbacks", () => {
    const { result } = renderHook(() => useVentaReplayEdit(makeValidBody()));
    act(() => {
      result.current.state!.updateCliente("nombreCliente", "MARIA LOPEZ");
    });
    const payload = result.current.buildSubmitPayload() as Record<string, unknown>;
    expect(payload).not.toBeNull();
    const cliente = payload.cliente as Record<string, unknown>;
    expect(cliente.nombre).toBe("MARIA LOPEZ");
    expect(payload.id).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("buildSubmitPayload returns null when the state has validation errors", () => {
    const { result } = renderHook(() => useVentaReplayEdit(makeValidBody()));
    act(() => {
      result.current.state!.updateCliente("nombreCliente", "");
    });
    expect(result.current.buildSubmitPayload()).toBeNull();
  });
});
