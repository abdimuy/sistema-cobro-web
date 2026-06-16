import { describe, it, expect, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { HttpClientesAdapter } from "./HttpClientesAdapter";
import type { ListResponseDTO, ClienteListItemDTO } from "./dtos";

// Minimal axios stub: records the params passed to client.get and returns an
// empty list. We only care about request wiring, not response mapping here.
function makeStubClient(): {
  client: AxiosInstance;
  get: ReturnType<typeof vi.fn>;
} {
  const empty: ListResponseDTO<ClienteListItemDTO> = {
    items: [],
    next_cursor: "",
  };
  const get = vi.fn().mockResolvedValue({ data: empty });
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
