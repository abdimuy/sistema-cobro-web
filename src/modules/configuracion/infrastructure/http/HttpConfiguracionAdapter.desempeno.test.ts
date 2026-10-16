import { describe, it, expect, vi } from "vitest";
import { AxiosError, type AxiosInstance } from "axios";
import { HttpConfiguracionAdapter } from "./HttpConfiguracionAdapter";

function makeClient(overrides: Partial<Record<"get" | "put" | "delete", ReturnType<typeof vi.fn>>>) {
  return {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as AxiosInstance & Record<"get" | "put" | "delete", ReturnType<typeof vi.fn>>;
}

describe("HttpConfiguracionAdapter — zonas excluidas de desempeño", () => {
  it("lista con GET /config/desempeno/zonas-excluidas y mapea items", async () => {
    const get = vi.fn().mockResolvedValue({
      data: { items: [{ zona_id: 23301, zona_nombre: "MAYOREO", created_at: "2026-10-01T18:00:00Z" }] },
    });
    const adapter = new HttpConfiguracionAdapter(makeClient({ get }));

    const out = await adapter.listarZonasExcluidasDesempeno();

    expect(get).toHaveBeenCalledWith("/config/desempeno/zonas-excluidas", { signal: undefined });
    expect(out).toEqual([{ zonaId: 23301, zonaNombre: "MAYOREO", createdAt: "2026-10-01T18:00:00Z" }]);
  });

  it("excluir hace PUT .../{zonaId} sin cuerpo y mapea la respuesta", async () => {
    const put = vi.fn().mockResolvedValue({
      data: { zona_id: 23301, zona_nombre: "MAYOREO", created_at: "2026-10-01T18:00:00Z" },
    });
    const adapter = new HttpConfiguracionAdapter(makeClient({ put }));

    const out = await adapter.excluirZonaDesempeno(23301);

    expect(put).toHaveBeenCalledWith("/config/desempeno/zonas-excluidas/23301", undefined, {
      signal: undefined,
    });
    expect(out.zonaId).toBe(23301);
  });

  it("quitar hace DELETE .../{zonaId}", async () => {
    const del = vi.fn().mockResolvedValue({ status: 204 });
    const adapter = new HttpConfiguracionAdapter(makeClient({ delete: del }));

    await adapter.quitarZonaExcluidaDesempeno(23301);

    expect(del).toHaveBeenCalledWith("/config/desempeno/zonas-excluidas/23301", { signal: undefined });
  });

  it("el 404 Huma de zona inexistente llega con code=zona_no_existe y mensaje en español", async () => {
    const err = new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: {} as never,
      data: {
        title: "Not Found",
        status: 404,
        detail: "la zona no existe",
        errors: [{ message: "code=zona_no_existe" }],
      },
    });
    const put = vi.fn().mockRejectedValue(err);
    const adapter = new HttpConfiguracionAdapter(makeClient({ put }));

    await expect(adapter.excluirZonaDesempeno(99999)).rejects.toMatchObject({
      code: "zona_no_existe",
      message: "la zona seleccionada ya no existe",
    });
  });

  it("permisos actuales: GET /me y devuelve permisos", async () => {
    const get = vi.fn().mockResolvedValue({ data: { id: "u", permisos: ["config:leer"] } });
    const adapter = new HttpConfiguracionAdapter(makeClient({ get }));

    expect(await adapter.listarPermisosActuales()).toEqual(["config:leer"]);
    expect(get).toHaveBeenCalledWith("/me", { signal: undefined });
  });

  it("permisos actuales: respuesta sin permisos da lista vacía", async () => {
    const get = vi.fn().mockResolvedValue({ data: {} });
    const adapter = new HttpConfiguracionAdapter(makeClient({ get }));
    expect(await adapter.listarPermisosActuales()).toEqual([]);
  });
});
