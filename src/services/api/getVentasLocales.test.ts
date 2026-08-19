import { describe, expect, it } from "vitest";

import { adaptVentaV2ToLocal, type VentaV2DTO } from "./getVentasLocales";

function makeVentaDTO(overrides: Partial<VentaV2DTO> = {}): VentaV2DTO {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    cliente: {
      cliente_id: 4821,
      nombre: "María Fernanda Olvera",
      telefono: "3312345678",
      aval: null,
      referencia: null,
    },
    direccion: {
      calle: "Av. Hidalgo",
      numero_exterior: "142",
      colonia: "Centro",
      poblacion: "Tepatitlán",
      ciudad: "Guadalajara",
      zona_cliente_id: 7,
    },
    gps: { latitud: 20.67, longitud: -103.34 },
    fecha_venta: "2026-08-10T18:00:00Z",
    tipo_venta: "CREDITO",
    estado: "active",
    situacion: "aprobada",
    sincronizacion: "pendiente",
    microsip_folio: null,
    microsip_docto_pv_id: null,
    microsip_aplicada_at: null,
    montos: { anual: "12500", corto_plazo: "9800", contado: "8600" },
    plan_credito: null,
    dia_cobranza: null,
    nota: null,
    combos: [],
    productos: [],
    vendedores: [],
    imagenes: [],
    created_at: "2026-08-10T18:00:00Z",
    updated_at: "2026-08-10T18:30:00Z",
    ...overrides,
  };
}

describe("adaptVentaV2ToLocal — nombre de zona", () => {
  it("toma el nombre que manda el API en direccion.zona_cliente", () => {
    const venta = adaptVentaV2ToLocal(
      makeVentaDTO({
        direccion: { ...makeVentaDTO().direccion, zona_cliente: "ZONA NORTE" },
      })
    );

    expect(venta.ZONA_CLIENTE).toBe("ZONA NORTE");
    expect(venta.ZONA_CLIENTE_ID).toBe(7);
  });

  it("deja undefined cuando el campo no viene (API sin desplegar)", () => {
    const venta = adaptVentaV2ToLocal(makeVentaDTO());

    expect(venta.ZONA_CLIENTE).toBeUndefined();
    // El id sigue llegando: la celda no debe resolver el nombre por catálogo.
    expect(venta.ZONA_CLIENTE_ID).toBe(7);
  });

  it("deja undefined cuando el campo viene null", () => {
    const venta = adaptVentaV2ToLocal(
      makeVentaDTO({
        direccion: { ...makeVentaDTO().direccion, zona_cliente: null },
      })
    );

    expect(venta.ZONA_CLIENTE).toBeUndefined();
  });

  it("deja undefined cuando la venta no trae zona en absoluto", () => {
    const venta = adaptVentaV2ToLocal(
      makeVentaDTO({
        direccion: {
          ...makeVentaDTO().direccion,
          zona_cliente_id: null,
          zona_cliente: null,
        },
      })
    );

    expect(venta.ZONA_CLIENTE).toBeUndefined();
    expect(venta.ZONA_CLIENTE_ID).toBeUndefined();
  });
});

describe("adaptVentaV2ToLocal — nombres de usuario", () => {
  it("mapea los nombres que manda el API junto al UUID", () => {
    const venta = adaptVentaV2ToLocal(
      makeVentaDTO({
        created_by: "0f8a1c22-6f5b-4a1e-9d3c-77b2a4e6d180",
        created_by_nombre: "Gabriel Roque Méndez",
        updated_by: "3b91d044-2c77-4f0a-84ab-5e1d9c2f7a63",
        updated_by_nombre: "Sayuri Vianey Morales",
        aprobacion: {
          at: "2026-08-11T10:00:00Z",
          by: "5d2e7f88-11aa-4bb3-9c44-6e8f0a1b2c3d",
          by_nombre: "Jesús Guillermo Soto",
        },
        cancelacion: {
          at: "2026-08-12T09:30:00Z",
          by: "9a1b2c3d-4e5f-6071-8293-a4b5c6d7e8f9",
          by_nombre: "Maribel Mendoza Blanco",
          reason: "cliente desistió",
        },
      })
    );

    expect(venta.CREATED_BY_NOMBRE).toBe("Gabriel Roque Méndez");
    expect(venta.UPDATED_BY_NOMBRE).toBe("Sayuri Vianey Morales");
    expect(venta.APROBADO_BY_NOMBRE).toBe("Jesús Guillermo Soto");
    expect(venta.CANCELADO_BY_NOMBRE).toBe("Maribel Mendoza Blanco");
    // El UUID se conserva: es el respaldo cuando el nombre no viene.
    expect(venta.CREATED_BY).toBe("0f8a1c22-6f5b-4a1e-9d3c-77b2a4e6d180");
    expect(venta.APROBADO_BY).toBe("5d2e7f88-11aa-4bb3-9c44-6e8f0a1b2c3d");
  });

  it("deja los nombres en undefined cuando el API todavía no los manda", () => {
    const venta = adaptVentaV2ToLocal(
      makeVentaDTO({ created_by: "0f8a1c22-6f5b-4a1e-9d3c-77b2a4e6d180" })
    );

    expect(venta.CREATED_BY_NOMBRE).toBeUndefined();
    expect(venta.UPDATED_BY_NOMBRE).toBeUndefined();
    expect(venta.APROBADO_BY_NOMBRE).toBeUndefined();
    expect(venta.CANCELADO_BY_NOMBRE).toBeUndefined();
    expect(venta.CREATED_BY).toBe("0f8a1c22-6f5b-4a1e-9d3c-77b2a4e6d180");
  });
});

describe("adaptVentaV2ToLocal — fase_desde", () => {
  it("mapea el momento en que la venta entró a su fase actual", () => {
    const venta = adaptVentaV2ToLocal(
      makeVentaDTO({ fase_desde: "2026-08-12T19:40:00Z" })
    );

    expect(venta.FASE_DESDE).toBe("2026-08-12T19:40:00Z");
  });

  it("queda undefined en ventas viejas sin bitácora", () => {
    expect(adaptVentaV2ToLocal(makeVentaDTO()).FASE_DESDE).toBeUndefined();
    expect(adaptVentaV2ToLocal(makeVentaDTO({ fase_desde: null })).FASE_DESDE).toBeUndefined();
  });
});

describe("adaptVentaV2ToLocal — fase_alcanzada", () => {
  it("mapea la fase más alta que la venta alcanzó jamás", () => {
    const venta = adaptVentaV2ToLocal(makeVentaDTO({ fase_alcanzada: 2 }));

    expect(venta.FASE_ALCANZADA).toBe(2);
  });

  it("queda undefined en ventas viejas sin bitácora", () => {
    expect(adaptVentaV2ToLocal(makeVentaDTO()).FASE_ALCANZADA).toBeUndefined();
    expect(
      adaptVentaV2ToLocal(makeVentaDTO({ fase_alcanzada: null })).FASE_ALCANZADA
    ).toBeUndefined();
  });
});
