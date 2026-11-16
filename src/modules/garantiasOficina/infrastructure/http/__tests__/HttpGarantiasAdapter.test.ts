import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { HttpGarantiasAdapter } from "../HttpGarantiasAdapter";

function crearAdapter() {
  const get = vi.fn();
  const client = { get } as unknown as AxiosInstance;
  return { adapter: new HttpGarantiasAdapter(client), get };
}

describe("HttpGarantiasAdapter", () => {
  it("consulta la bandeja con filtros y límite del servidor", async () => {
    const { adapter, get } = crearAdapter();
    const pagina = {
      items: [],
      next_cursor: "",
      has_more: false,
    };
    get.mockResolvedValue({ data: pagina });

    const resultado = await adapter.listar(
      { estado: "abierta", origen: "cliente", cliente_id: 42 },
      { limit: 20 },
    );

    expect(resultado).toEqual(pagina);
    expect(get).toHaveBeenCalledWith(
      "/garantias",
      expect.objectContaining({
        params: {
          estado: "abierta",
          origen: "cliente",
          cliente_id: 42,
          limit: 20,
        },
      }),
    );
  });

  it("envía el cursor para obtener la página siguiente", async () => {
    const { adapter, get } = crearAdapter();
    get.mockResolvedValue({
      data: { items: [], next_cursor: "", has_more: false },
    });

    await adapter.listar(
      { etapa: "en_revision", ubicacion: "taller" },
      { limit: 10, cursor: "cursor-abc" },
    );

    expect(get).toHaveBeenCalledWith(
      "/garantias",
      expect.objectContaining({
        params: {
          etapa: "en_revision",
          ubicacion: "taller",
          limit: 10,
          cursor: "cursor-abc",
        },
      }),
    );
  });

  it("consulta el detalle del folio indicado", async () => {
    const { adapter, get } = crearAdapter();
    const detalle = {
      garantia: { id: "folio-1", articulos: [] },
      eventos: [],
    };
    get.mockResolvedValue({ data: detalle });

    expect(await adapter.obtener("folio-1")).toEqual(detalle);
    expect(get).toHaveBeenCalledWith(
      "/garantias/folio-1",
      expect.objectContaining({ signal: undefined }),
    );
  });

  it("descarga la imagen autenticada como blob", async () => {
    const { adapter, get } = crearAdapter();
    const imagen = new Blob(["imagen"], { type: "image/png" });
    get.mockResolvedValue({ data: imagen });

    const resultado = await adapter.descargarImagen(
      "garantia-1",
      "evento-2",
      "imagen-3",
    );

    expect(resultado).toBe(imagen);
    expect(get).toHaveBeenCalledWith(
      "/garantias/garantia-1/eventos/evento-2/imagenes/imagen-3",
      expect.objectContaining({
        responseType: "blob",
      }),
    );
  });

  it("propaga los errores del servidor", async () => {
    const { adapter, get } = crearAdapter();
    get.mockRejectedValue(new Error("Servidor no disponible"));

    await expect(
      adapter.listar({}, { limit: 20 }),
    ).rejects.toThrow("Servidor no disponible");
  });
});


describe("Catálogos de garantías", () => {
  it("consulta el endpoint de catálogos", async () => {
    const { adapter, get } = crearAdapter();
    const catalogos = {
      etapas: ["registrado", "en_revision"],
      ubicaciones: ["taller"],
      estados: ["abierto"],
      tipos_evento: [],
      transiciones: [],
    };

    get.mockResolvedValue({ data: catalogos });

    await expect(adapter.obtenerCatalogos()).resolves.toEqual(catalogos);
    expect(get).toHaveBeenCalledWith(
      "/garantias/catalogos",
      { signal: undefined },
    );
  });
});

describe("Comandos de garantías", () => {
  it("conserva la clave y la fecha al reintentar", async () => {
    const post = vi.fn().mockResolvedValue({ data: { ok: true } });
    const client = { post } as unknown as AxiosInstance;
    const adapter = new HttpGarantiasAdapter(client);

    const identidad = {
      claveIdempotencia: "50f89b87-68f3-460c-a117-dfd313ddf281",
      deviceCreatedAt: "2026-11-13T14:00:00.000Z",
    };

    const comando = {
      tipo: "diagnostico" as const,
      ruta: "taller" as const,
      rol_decisor: "tecnica" as const,
    };

    await adapter.ejecutarComandoArticulo(
      "garantia-1", "articulo-1", comando, identidad,
    );

    await adapter.ejecutarComandoArticulo(
      "garantia-1", "articulo-1", comando, identidad,
    );

    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[0]).toEqual(post.mock.calls[1]);

    expect(post).toHaveBeenCalledWith(
      "/garantias/garantia-1/articulos/articulo-1/diagnostico",
      {
        ruta: "taller",
        rol_decisor: "tecnica",
        device_created_at: identidad.deviceCreatedAt,
      },
      expect.objectContaining({
        headers: {
          "Idempotency-Key": identidad.claveIdempotencia,
        },
      }),
    );
  });

  it.each([
    {
      comando: { tipo: "dictamen", dictamen: "aceptada" },
      ruta: "dictamen",
      datos: { dictamen: "aceptada" },
    },
    {
      comando: { tipo: "cambio-fisico", rol_decisor: "oficina" },
      ruta: "cambio-fisico",
      datos: { rol_decisor: "oficina" },
    },
    {
      comando: { tipo: "desenlace", desenlace: "reparado" },
      ruta: "desenlace",
      datos: { desenlace: "reparado" },
    },
  ] as const)("envía correctamente el comando $ruta", async ({ comando, ruta, datos }) => {
    const post = vi.fn().mockResolvedValue({ data: {} });
    const adapter = new HttpGarantiasAdapter(
      { post } as unknown as AxiosInstance,
    );

    const identidad = {
      claveIdempotencia: "50f89b87-68f3-460c-a117-dfd313ddf281",
      deviceCreatedAt: "2026-11-13T14:00:00.000Z",
    };

    await adapter.ejecutarComandoArticulo(
      "garantia-1",
      "articulo-1",
      comando,
      identidad,
    );

    expect(post).toHaveBeenCalledWith(
      `/garantias/garantia-1/articulos/articulo-1/${ruta}`,
      { ...datos, device_created_at: identidad.deviceCreatedAt },
      expect.objectContaining({
        headers: { "Idempotency-Key": identidad.claveIdempotencia },
      }),
    );
  });
});

describe("Comandos de folio", () => {
  const identidad = {
    claveIdempotencia: "50f89b87-68f3-460c-a117-dfd313ddf281",
    deviceCreatedAt: "2026-11-13T14:00:00.000Z",
  };

  it.each([
    {
      comando: { tipo: "listo-entrega" },
      ruta: "listo-entrega",
      datos: {},
    },
    {
      comando: { tipo: "cancelar", motivo: "Solicitud del cliente" },
      ruta: "cancelar",
      datos: { motivo: "Solicitud del cliente" },
    },
    {
      comando: {
        tipo: "cerrar",
        justificacion_desvio: "Entrega en domicilio alternativo",
      },
      ruta: "cerrar",
      datos: {
        justificacion_desvio: "Entrega en domicilio alternativo",
      },
    },
  ] as const)("envía correctamente $ruta", async ({ comando, ruta, datos }) => {
    const post = vi.fn().mockResolvedValue({ data: {} });
    const adapter = new HttpGarantiasAdapter(
      { post } as unknown as AxiosInstance,
    );

    await adapter.ejecutarComandoFolio(
      "garantia-1",
      comando,
      identidad,
    );

    expect(post).toHaveBeenCalledWith(
      `/garantias/garantia-1/${ruta}`,
      {
        ...datos,
        device_created_at: identidad.deviceCreatedAt,
      },
      expect.objectContaining({
        headers: {
          "Idempotency-Key": identidad.claveIdempotencia,
        },
      }),
    );
  });

  it("un reintento conserva el encabezado y el cuerpo", async () => {
    const post = vi.fn().mockResolvedValue({ data: {} });
    const adapter = new HttpGarantiasAdapter(
      { post } as unknown as AxiosInstance,
    );

    const comando = {
      tipo: "cancelar" as const,
      motivo: "Solicitud del cliente",
    };

    await adapter.ejecutarComandoFolio("garantia-1", comando, identidad);
    await adapter.ejecutarComandoFolio("garantia-1", comando, identidad);

    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[0]).toEqual(post.mock.calls[1]);
  });
});
