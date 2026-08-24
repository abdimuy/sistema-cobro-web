import { describe, it, expect, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { HttpVentasListAdapter } from "./HttpVentasListAdapter";
import type { VentaV2DTO, ListV2Response } from "../../../../services/api/getVentasLocales";

function makeVentaV2DTO(overrides: Partial<VentaV2DTO> = {}): VentaV2DTO {
  const base: VentaV2DTO = {
    id: "3fa1c2b0-3e9e-4b3a-8b1a-000000000001",
    cliente: { cliente_id: 24037, nombre: "GUADALUPE HERNÁNDEZ TORRES", telefono: "5512345678", aval: null, referencia: null },
    direccion: { calle: "Av. Insurgentes 45", numero_exterior: null, colonia: "Centro", poblacion: "CDMX", ciudad: "CDMX", zona_cliente_id: 12 },
    gps: { latitud: 19.4326, longitud: -99.1332 },
    fecha_venta: "2026-05-12T00:00:00.000Z",
    tipo_venta: "CREDITO",
    estado: "active",
    situacion: "aprobada",
    sincronizacion: "aplicada",
    microsip_folio: null,
    microsip_docto_pv_id: null,
    microsip_aplicada_at: null,
    montos: { anual: "8500.00", corto_plazo: "8500.00", contado: "7500.00" },
    plan_credito: null,
    dia_cobranza: null,
    nota: null,
    combos: [],
    productos: [],
    vendedores: [{ id: "v1", usuario_id: "u1", email: "maria.ramirez@muebleriamsp.mx", nombre: "María Ramírez" }],
    imagenes: [],
    created_at: "2026-05-12T00:00:00.000Z",
    updated_at: "2026-05-12T00:00:00.000Z",
    ...overrides,
  };
  return base;
}

function makeStubClient(
  response: Partial<ListV2Response<VentaV2DTO>> = {},
): { client: AxiosInstance; get: ReturnType<typeof vi.fn> } {
  const data: ListV2Response<VentaV2DTO> = {
    items: [],
    ...response,
  };
  const get = vi.fn().mockResolvedValue({ data });
  const client = { get } as unknown as AxiosInstance;
  return { client, get };
}

describe("HttpVentasListAdapter.buscarVentas query params", () => {
  it("sends every supported snake_case param when provided", async () => {
    const { client, get } = makeStubClient();
    const adapter = new HttpVentasListAdapter(client);

    await adapter.buscarVentas({
      search: "hernandez",
      tipoVenta: "CREDITO",
      situacion: "aprobada",
      sincronizacion: "aplicada",
      zonaClienteId: 12,
      vendedorEmail: "maria.ramirez@muebleriamsp.mx",
      precioMin: 1000,
      precioMax: 20000,
      fechaInicio: "2026-01-01",
      fechaFin: "2026-06-30",
      incluirCanceladas: true,
      sortBy: "fecha_venta",
      sortOrder: "desc",
      cursor: "cursor-abc",
      limit: 50,
    });

    expect(get).toHaveBeenCalledTimes(1);
    const [url, config] = get.mock.calls[0];
    expect(url).toBe("/ventas");
    expect(config.params).toEqual({
      search: "hernandez",
      tipo_venta: "CREDITO",
      situacion: "aprobada",
      sincronizacion: "aplicada",
      zona_cliente_id: 12,
      vendedor_email: "maria.ramirez@muebleriamsp.mx",
      precio_min: 1000,
      precio_max: 20000,
      desde: "2026-01-01T06:00:00Z",
      hasta: "2026-07-01T06:00:00Z",
      incluir_canceladas: true,
      sort_by: "fecha_venta",
      sort_order: "desc",
      cursor: "cursor-abc",
      limit: 50,
    });
    expect(config.signal).toBeUndefined();
  });

  it("convierte el rango de fechas a RFC3339 UTC con cota superior exclusiva", async () => {
    // Regresión: el front mandaba date-only (2026-07-20) y el backend exige
    // RFC3339 → 422. Ahora desde = inicio del día y hasta = inicio del día
    // SIGUIENTE, para incluir el día final (FECHA_VENTA < hasta).
    const { client, get } = makeStubClient();
    const adapter = new HttpVentasListAdapter(client);

    await adapter.buscarVentas({
      fechaInicio: "2026-07-17",
      fechaFin: "2026-07-20",
    });

    const [, config] = get.mock.calls[0];
    expect(config.params.desde).toBe("2026-07-17T06:00:00Z");
    expect(config.params.hasta).toBe("2026-07-21T06:00:00Z");
  });

  it("el día que pide el usuario es el día del NEGOCIO, no el día UTC", async () => {
    // Regresión medida en producción el 2026-08-21: filtrando "20 ago - 20
    // ago" para TAPIA salían 5 ventas y eran 7. Las dos que faltaban se
    // capturaron a las 18:15 y 18:18 locales — pasadas las 18:00, un instante
    // ya cae en el día UTC siguiente, y la ventana mandada las dejaba fuera.
    const { client, get } = makeStubClient();
    const adapter = new HttpVentasListAdapter(client);

    await adapter.buscarVentas({ fechaInicio: "2026-08-20", fechaFin: "2026-08-20" });

    const [, config] = get.mock.calls[0];
    const desde = new Date(config.params.desde as string);
    const hasta = new Date(config.params.hasta as string);
    const ventaDeLas1815 = new Date("2026-08-21T00:15:31Z");
    const ventaDeLas1815DelDiaAnterior = new Date("2026-08-20T00:15:31Z");

    expect(ventaDeLas1815 >= desde && ventaDeLas1815 < hasta).toBe(true);
    expect(ventaDeLas1815DelDiaAnterior < desde).toBe(true);
  });

  it("no manda desde/hasta cuando no hay fechas", async () => {
    const { client, get } = makeStubClient();
    const adapter = new HttpVentasListAdapter(client);

    await adapter.buscarVentas({ search: "x" });

    const [, config] = get.mock.calls[0];
    expect("desde" in config.params).toBe(false);
    expect("hasta" in config.params).toBe(false);
  });

  it("omits undefined/unsupported fields — this guards the dropped-params bug", async () => {
    const { client, get } = makeStubClient();
    const adapter = new HttpVentasListAdapter(client);

    await adapter.buscarVentas({
      search: "hernandez",
      almacenId: 11058, // unsupported — must never be sent
    });

    const [, config] = get.mock.calls[0];
    expect(config.params).toEqual({ search: "hernandez" });
    expect("almacen_id" in config.params).toBe(false);
    expect("almacenId" in config.params).toBe(false);
    expect("tipo_venta" in config.params).toBe(false);
    expect("cursor" in config.params).toBe(false);
    expect("limit" in config.params).toBe(false);
  });

  it("sends no params at all for an empty input", async () => {
    const { client, get } = makeStubClient();
    const adapter = new HttpVentasListAdapter(client);

    await adapter.buscarVentas({});

    const [, config] = get.mock.calls[0];
    expect(config.params).toEqual({});
  });

  it("propagates the abort signal", async () => {
    const { client, get } = makeStubClient();
    const adapter = new HttpVentasListAdapter(client);
    const ctrl = new AbortController();

    await adapter.buscarVentas({}, ctrl.signal);

    const [, config] = get.mock.calls[0];
    expect(config.signal).toBe(ctrl.signal);
  });

  it("maps each response item via adaptVentaV2ToLocal", async () => {
    const { client } = makeStubClient({ items: [makeVentaV2DTO()] });
    const adapter = new HttpVentasListAdapter(client);

    const result = await adapter.buscarVentas({});

    expect(result.items).toHaveLength(1);
    expect(result.items[0].NOMBRE_CLIENTE).toBe("GUADALUPE HERNÁNDEZ TORRES");
    expect(result.items[0].USER_EMAIL).toBe("maria.ramirez@muebleriamsp.mx");
  });

  it("maps absent next_cursor to '' (backend omits it on the last page)", async () => {
    const { client } = makeStubClient({ items: [] });
    const adapter = new HttpVentasListAdapter(client);

    const result = await adapter.buscarVentas({});

    expect(result.nextCursor).toBe("");
  });

  it("returns next_cursor verbatim when present", async () => {
    const { client } = makeStubClient({ items: [], next_cursor: "cursor-page2" });
    const adapter = new HttpVentasListAdapter(client);

    const result = await adapter.buscarVentas({});

    expect(result.nextCursor).toBe("cursor-page2");
  });

  it("wraps axios errors into a DomainError", async () => {
    const get = vi.fn().mockRejectedValue(
      Object.assign(new Error("Request failed with status code 500"), {
        isAxiosError: true,
        response: { status: 500, data: { code: "error_inesperado", message: "fallo interno" } },
      }),
    );
    const client = { get } as unknown as AxiosInstance;
    const adapter = new HttpVentasListAdapter(client);

    await expect(adapter.buscarVentas({})).rejects.toMatchObject({
      name: "DomainError",
      code: "error_inesperado",
    });
  });
});
