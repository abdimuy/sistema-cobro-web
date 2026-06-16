import { describe, it, expect, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { HttpClientesAdapter } from "./HttpClientesAdapter";
import type { BuscarClientesResponseDTO, FichaDTO } from "./dtos";

// Minimal axios stub: records the params passed to client.get and returns an
// empty list. We only care about request wiring and facets parsing here.
function makeStubClient(
  response: Partial<BuscarClientesResponseDTO> = {},
): {
  client: AxiosInstance;
  get: ReturnType<typeof vi.fn>;
} {
  const data: BuscarClientesResponseDTO = {
    items: [],
    next_cursor: "",
    ...response,
  };
  const get = vi.fn().mockResolvedValue({ data });
  const client = { get } as unknown as AxiosInstance;
  return { client, get };
}

describe("HttpClientesAdapter.buscarClientes query params", () => {
  it("sends sort_by and sort_order when provided", async () => {
    const { client, get } = makeStubClient();
    const adapter = new HttpClientesAdapter(client);

    await adapter.buscarClientes({ sortBy: "saldo", sortOrder: "desc" });

    expect(get).toHaveBeenCalledTimes(1);
    const [, config] = get.mock.calls[0];
    expect(config.params.sort_by).toBe("saldo");
    expect(config.params.sort_order).toBe("desc");
  });

  it("omits sort params when not provided", async () => {
    const { client, get } = makeStubClient();
    const adapter = new HttpClientesAdapter(client);

    await adapter.buscarClientes({ q: "hernandez" });

    const [, config] = get.mock.calls[0];
    expect("sort_by" in config.params).toBe(false);
    expect("sort_order" in config.params).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// obtenerFicha date-range params
// ---------------------------------------------------------------------------

function makeStubFichaClient(ficha: Partial<FichaDTO> = {}): {
  client: AxiosInstance;
  get: ReturnType<typeof vi.fn>;
} {
  const data: FichaDTO = {
    cliente_id: 1042,
    nombre: "MUEBLES HERNÁNDEZ S.A.",
    direccion: { calle: "Av. Insurgentes 45", colonia: "Col. Centro", poblacion: "Ciudad de México", estado: "CDMX" },
    telefono: "5512345678",
    limite_credito: "50000.00",
    notas: "",
    zona: "ZONA_NORTE",
    cobrador: "José Guadalupe Pérez Morales",
    estatus: "ACTIVO",
    resumen: { total_comprado: "120000.00", total_abonado: "111500.00", saldo: "8500.00", pct_liquidado: "0.93", ticket_promedio: "17142.86", num_ventas: 7, num_pagos: 24 },
    series: { abonos_por_mes: [], comprado_vs_abonado: [] },
    pulso: null,
    ubicacion: { lat: 19.4326, lng: -99.1332, disponible: true },
    ...ficha,
  };
  const get = vi.fn().mockResolvedValue({ data });
  const client = { get } as unknown as AxiosInstance;
  return { client, get };
}

describe("HttpClientesAdapter.obtenerFicha date-range params", () => {
  it("sends desde and hasta when both provided", async () => {
    const { client, get } = makeStubFichaClient();
    const adapter = new HttpClientesAdapter(client);

    await adapter.obtenerFicha(1042, { desde: "2025-01-01", hasta: "2025-12-31" });

    expect(get).toHaveBeenCalledTimes(1);
    const [, config] = get.mock.calls[0];
    expect(config.params?.desde).toBe("2025-01-01");
    expect(config.params?.hasta).toBe("2025-12-31");
  });

  it("sends only desde when hasta is absent", async () => {
    const { client, get } = makeStubFichaClient();
    const adapter = new HttpClientesAdapter(client);

    await adapter.obtenerFicha(1042, { desde: "2025-06-01" });

    const [, config] = get.mock.calls[0];
    expect(config.params?.desde).toBe("2025-06-01");
    expect("hasta" in (config.params ?? {})).toBe(false);
  });

  it("omits params entirely when no range provided", async () => {
    const { client, get } = makeStubFichaClient();
    const adapter = new HttpClientesAdapter(client);

    await adapter.obtenerFicha(1042);

    const [, config] = get.mock.calls[0];
    expect(config.params).toBeUndefined();
  });

  it("omits params when range is empty object", async () => {
    const { client, get } = makeStubFichaClient();
    const adapter = new HttpClientesAdapter(client);

    await adapter.obtenerFicha(1042, {});

    const [, config] = get.mock.calls[0];
    expect(config.params).toBeUndefined();
  });
});

describe("HttpClientesAdapter.buscarClientes facets", () => {
  it("returns facets from response when present", async () => {
    const facets = {
      segmento: { ACTIVO: 9000, MOROSO: 1240 },
      estado_pago: { AL_CORRIENTE: 8000, ATRASADO: 900 },
    };
    const { client } = makeStubClient({ facets });
    const adapter = new HttpClientesAdapter(client);

    const result = await adapter.buscarClientes({});

    expect(result.facets).toEqual(facets);
  });

  it("defaults facets to empty object when absent from response", async () => {
    const { client } = makeStubClient(); // no facets field
    const adapter = new HttpClientesAdapter(client);

    const result = await adapter.buscarClientes({});

    expect(result.facets).toEqual({});
  });
});
