import { describe, it, expect, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { HttpClientesAdapter } from "./HttpClientesAdapter";
import type { BuscarClientesResponseDTO } from "./dtos";

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
