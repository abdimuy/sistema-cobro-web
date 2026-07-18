import { describe, it, expect, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { HttpConfiguracionAdapter } from "./HttpConfiguracionAdapter";
import type {
  AsignarVendedorResponseDTO,
  AsignarZonaCajaResponseDTO,
  OpcionesVendedorResponseDTO,
  OpcionesZonasCajasDTO,
  VendedorAsignacionDTO,
  VendedoresListResponseDTO,
  ZonaCajaAsignacionDTO,
  ZonasCajasListResponseDTO,
} from "./dtos";

function makeVendedorAsignacionDTO(
  overrides: Partial<VendedorAsignacionDTO> = {},
): VendedorAsignacionDTO {
  return {
    usuario_id: "uid-brenda",
    nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
    email: "brenda.sanchez@muebleriamsp.mx",
    mapping: {
      v1: { lista_id: 101, nombre: "BRENDA SANCHEZ" },
      v2: { lista_id: 102, nombre: "BRENDA SANCHEZ" },
      v3: { lista_id: 103, nombre: "BRENDA SANCHEZ" },
    },
    estado: "3/3",
    ...overrides,
  };
}

function makeZonaCajaAsignacionDTO(
  overrides: Partial<ZonaCajaAsignacionDTO> = {},
): ZonaCajaAsignacionDTO {
  return {
    zona_cliente_id: 12,
    zona_nombre: "ZONA CENTRO — MORELIA",
    caja: { id: 501, nombre: "CAJA1" },
    cajero: { id: 601, nombre: "PATRICIA ELIZONDO VARGAS" },
    vendedor: { id: 701, nombre: "OSCAR IVÁN DOMÍNGUEZ REYES" },
    cobrador: { id: 801, nombre: "RUBÉN ALEJANDRO CASTILLO PEÑA" },
    ...overrides,
  };
}

function makeStubClient() {
  const get = vi.fn();
  const put = vi.fn();
  const del = vi.fn();
  const client = { get, put, delete: del } as unknown as AxiosInstance;
  return { client, get, put, del };
}

describe("HttpConfiguracionAdapter", () => {
  it("listarVendedores hace GET a /config/vendedores y mapea los items", async () => {
    const { client, get } = makeStubClient();
    const data: VendedoresListResponseDTO = { items: [makeVendedorAsignacionDTO()] };
    get.mockResolvedValue({ data });
    const adapter = new HttpConfiguracionAdapter(client);

    const result = await adapter.listarVendedores();

    expect(get).toHaveBeenCalledWith("/config/vendedores", { signal: undefined });
    expect(result).toHaveLength(1);
    expect(result[0].usuarioId).toBe("uid-brenda");
    expect(result[0].mapping.v1).toEqual({ listaId: 101, nombre: "BRENDA SANCHEZ" });
  });

  it("listarVendedores propaga el abort signal", async () => {
    const { client, get } = makeStubClient();
    get.mockResolvedValue({ data: { items: [] } });
    const adapter = new HttpConfiguracionAdapter(client);
    const ctrl = new AbortController();

    await adapter.listarVendedores(ctrl.signal);

    expect(get).toHaveBeenCalledWith("/config/vendedores", { signal: ctrl.signal });
  });

  it("listarOpciones hace GET a /config/vendedores/opciones y mapea los items", async () => {
    const { client, get } = makeStubClient();
    const data: OpcionesVendedorResponseDTO = {
      items: [
        {
          nombre: "CARLOS RAMOS LUNA",
          v1_lista_id: 201,
          v2_lista_id: null,
          v3_lista_id: null,
          match_count: 1,
        },
      ],
    };
    get.mockResolvedValue({ data });
    const adapter = new HttpConfiguracionAdapter(client);

    const result = await adapter.listarOpciones();

    expect(get).toHaveBeenCalledWith("/config/vendedores/opciones", { signal: undefined });
    expect(result).toEqual([
      { nombre: "CARLOS RAMOS LUNA", v1ListaId: 201, v2ListaId: null, v3ListaId: null, matchCount: 1 },
    ]);
  });

  it("asignarVendedor hace PUT a /config/vendedores/{usuarioId} con el body snake_case correcto", async () => {
    const { client, put } = makeStubClient();
    const responseDTO: AsignarVendedorResponseDTO = { item: makeVendedorAsignacionDTO() };
    put.mockResolvedValue({ data: responseDTO });
    const adapter = new HttpConfiguracionAdapter(client);

    const result = await adapter.asignarVendedor({
      usuarioId: "uid-brenda",
      listaId1: 101,
      listaId2: 102,
      listaId3: 103,
    });

    expect(put).toHaveBeenCalledWith(
      "/config/vendedores/uid-brenda",
      { vendedor_lista_id_1: 101, vendedor_lista_id_2: 102, vendedor_lista_id_3: 103 },
      { signal: undefined },
    );
    expect(result.usuarioId).toBe("uid-brenda");
    expect(result.estado).toBe("3/3");
  });

  it("asignarVendedor resuelve los 3 ids a partir de una identidad completa (auto-resolve)", async () => {
    const { client, put } = makeStubClient();
    put.mockResolvedValue({ data: { item: makeVendedorAsignacionDTO() } });
    const adapter = new HttpConfiguracionAdapter(client);

    // Simula el picker: identidad con match_count 3 → los tres slots se resuelven.
    const identidad = { v1ListaId: 301, v2ListaId: 302, v3ListaId: 303, matchCount: 3 };

    await adapter.asignarVendedor({
      usuarioId: "uid-x",
      listaId1: identidad.v1ListaId,
      listaId2: identidad.v2ListaId,
      listaId3: identidad.v3ListaId,
    });

    const [, body] = put.mock.calls[0];
    expect(body).toEqual({
      vendedor_lista_id_1: 301,
      vendedor_lista_id_2: 302,
      vendedor_lista_id_3: 303,
    });
  });

  it("asignarVendedor: un slot sin match en la identidad (null) queda overridable (no se envía)", async () => {
    const { client, put } = makeStubClient();
    put.mockResolvedValue({ data: { item: makeVendedorAsignacionDTO() } });
    const adapter = new HttpConfiguracionAdapter(client);

    // Identidad incompleta: v3 sin match (null) — el caller no lo toca (undefined)
    // porque el admin aún no eligió el override manual.
    await adapter.asignarVendedor({
      usuarioId: "uid-x",
      listaId1: 301,
      listaId2: 302,
      listaId3: undefined,
    });

    const [, body] = put.mock.calls[0];
    expect(body).toEqual({ vendedor_lista_id_1: 301, vendedor_lista_id_2: 302 });
    expect("vendedor_lista_id_3" in body).toBe(false);
  });

  it("asignarVendedor codifica el usuarioId en la URL", async () => {
    const { client, put } = makeStubClient();
    put.mockResolvedValue({ data: { item: makeVendedorAsignacionDTO() } });
    const adapter = new HttpConfiguracionAdapter(client);

    await adapter.asignarVendedor({ usuarioId: "uid con espacio", listaId1: 1 });

    expect(put).toHaveBeenCalledWith(
      "/config/vendedores/uid%20con%20espacio",
      { vendedor_lista_id_1: 1 },
      { signal: undefined },
    );
  });

  it("eliminarVendedor hace DELETE a /config/vendedores/{usuarioId}", async () => {
    const { client, del } = makeStubClient();
    del.mockResolvedValue({ data: { ok: true } });
    const adapter = new HttpConfiguracionAdapter(client);

    await adapter.eliminarVendedor("uid-brenda");

    expect(del).toHaveBeenCalledWith("/config/vendedores/uid-brenda", { signal: undefined });
  });

  it("wrappea errores de axios en DomainError con el code del backend", async () => {
    const { client, get } = makeStubClient();
    get.mockRejectedValue(
      Object.assign(new Error("Request failed with status code 403"), {
        isAxiosError: true,
        response: { status: 403, data: { code: "forbidden", message: "forbidden" } },
      }),
    );
    const adapter = new HttpConfiguracionAdapter(client);

    await expect(adapter.listarVendedores()).rejects.toMatchObject({
      name: "DomainError",
      code: "forbidden",
    });
  });

  it("wrappea errores de PUT (asignar) en DomainError", async () => {
    const { client, put } = makeStubClient();
    put.mockRejectedValue(
      Object.assign(new Error("Request failed with status code 422"), {
        isAxiosError: true,
        response: {
          status: 422,
          data: { code: "vendedor_lista_id_no_pertenece", message: "no pertenece" },
        },
      }),
    );
    const adapter = new HttpConfiguracionAdapter(client);

    await expect(
      adapter.asignarVendedor({ usuarioId: "uid-x", listaId1: 999 }),
    ).rejects.toMatchObject({
      name: "DomainError",
      code: "vendedor_lista_id_no_pertenece",
    });
  });

  it("wrappea errores de DELETE (eliminar) en DomainError", async () => {
    const { client, del } = makeStubClient();
    del.mockRejectedValue(
      Object.assign(new Error("Request failed with status code 404"), {
        isAxiosError: true,
        response: { status: 404, data: { code: "usuario_no_existe", message: "no existe" } },
      }),
    );
    const adapter = new HttpConfiguracionAdapter(client);

    await expect(adapter.eliminarVendedor("uid-fantasma")).rejects.toMatchObject({
      name: "DomainError",
      code: "usuario_no_existe",
    });
  });

  it("listarZonasCajas hace GET a /config/zonas-cajas y mapea los items", async () => {
    const { client, get } = makeStubClient();
    const data: ZonasCajasListResponseDTO = { items: [makeZonaCajaAsignacionDTO()] };
    get.mockResolvedValue({ data });
    const adapter = new HttpConfiguracionAdapter(client);

    const result = await adapter.listarZonasCajas();

    expect(get).toHaveBeenCalledWith("/config/zonas-cajas", { signal: undefined });
    expect(result).toHaveLength(1);
    expect(result[0].zonaClienteId).toBe(12);
    expect(result[0].caja).toEqual({ id: 501, nombre: "CAJA1" });
  });

  it("listarZonasCajas propaga el abort signal", async () => {
    const { client, get } = makeStubClient();
    get.mockResolvedValue({ data: { items: [] } });
    const adapter = new HttpConfiguracionAdapter(client);
    const ctrl = new AbortController();

    await adapter.listarZonasCajas(ctrl.signal);

    expect(get).toHaveBeenCalledWith("/config/zonas-cajas", { signal: ctrl.signal });
  });

  it("listarOpcionesZonasCajas hace GET a /config/zonas-cajas/opciones y mapea los 5 catálogos", async () => {
    const { client, get } = makeStubClient();
    const data: OpcionesZonasCajasDTO = {
      zonas: [{ id: 12, nombre: "ZONA CENTRO — MORELIA" }],
      cajas: [{ id: 501, nombre: "CAJA1" }],
      cajeros: [{ id: 601, nombre: "PATRICIA ELIZONDO VARGAS" }],
      vendedores: [{ id: 701, nombre: "OSCAR IVÁN DOMÍNGUEZ REYES" }],
      cobradores: [{ id: 801, nombre: "RUBÉN ALEJANDRO CASTILLO PEÑA" }],
    };
    get.mockResolvedValue({ data });
    const adapter = new HttpConfiguracionAdapter(client);

    const result = await adapter.listarOpcionesZonasCajas();

    expect(get).toHaveBeenCalledWith("/config/zonas-cajas/opciones", { signal: undefined });
    expect(result.cajas).toEqual([{ id: 501, nombre: "CAJA1" }]);
    expect(result.cobradores).toEqual([{ id: 801, nombre: "RUBÉN ALEJANDRO CASTILLO PEÑA" }]);
  });

  it("asignarZonaCaja hace PUT a /config/zonas-cajas/{zonaClienteId} con el body snake_case correcto", async () => {
    const { client, put } = makeStubClient();
    const responseDTO: AsignarZonaCajaResponseDTO = { item: makeZonaCajaAsignacionDTO() };
    put.mockResolvedValue({ data: responseDTO });
    const adapter = new HttpConfiguracionAdapter(client);

    const result = await adapter.asignarZonaCaja({
      zonaClienteId: 12,
      cajaId: 501,
      cajeroId: 601,
      vendedorId: 701,
      cobradorId: 801,
    });

    expect(put).toHaveBeenCalledWith(
      "/config/zonas-cajas/12",
      { caja_id: 501, cajero_id: 601, vendedor_id: 701, cobrador_id: 801 },
      { signal: undefined },
    );
    expect(result.zonaClienteId).toBe(12);
  });

  it("asignarZonaCaja envía -1 explícitamente para los slots sin asignar", async () => {
    const { client, put } = makeStubClient();
    put.mockResolvedValue({
      data: {
        item: makeZonaCajaAsignacionDTO({ caja: null, cajero: null, vendedor: null, cobrador: null }),
      },
    });
    const adapter = new HttpConfiguracionAdapter(client);

    await adapter.asignarZonaCaja({
      zonaClienteId: 12,
      cajaId: -1,
      cajeroId: -1,
      vendedorId: -1,
      cobradorId: -1,
    });

    const [, body] = put.mock.calls[0];
    expect(body).toEqual({ caja_id: -1, cajero_id: -1, vendedor_id: -1, cobrador_id: -1 });
  });

  it("wrappea errores de PUT (asignarZonaCaja) en DomainError", async () => {
    const { client, put } = makeStubClient();
    put.mockRejectedValue(
      Object.assign(new Error("Request failed with status code 422"), {
        isAxiosError: true,
        response: { status: 422, data: { code: "caja_no_existe", message: "no existe" } },
      }),
    );
    const adapter = new HttpConfiguracionAdapter(client);

    await expect(
      adapter.asignarZonaCaja({
        zonaClienteId: 12,
        cajaId: 999,
        cajeroId: -1,
        vendedorId: -1,
        cobradorId: -1,
      }),
    ).rejects.toMatchObject({ name: "DomainError", code: "caja_no_existe" });
  });
});
