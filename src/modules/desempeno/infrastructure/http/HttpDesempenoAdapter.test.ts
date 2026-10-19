import { describe, expect, it, vi } from "vitest";
import axios, { type AxiosInstance } from "axios";
import { http, HttpResponse } from "msw";
import { server } from "../../../../test/msw/server";
import { desempenoHandlers } from "../../../../test/msw/handlers/desempeno";
import { HttpDesempenoAdapter } from "./HttpDesempenoAdapter";
import { FILTROS_ACTIVIDAD_INICIALES } from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { agendaDTO } from "../../../../test/msw/fixtures/desempeno";

const adapter = () => new HttpDesempenoAdapter(axios.create({ baseURL: "http://api.test/v2" }));

describe("HttpDesempenoAdapter", () => {
  it("tablero: periodo, pausa_min y horario como parámetros", async () => {
    let url: URL | undefined;
    server.use(...desempenoHandlers({ vistoPor: (u) => (url = u) }));
    const t = await adapter().obtenerTablero({ periodo: "semana", pausaMin: 30, horario: { desde: "08:00", hasta: "18:00" } });
    expect(url?.pathname).toBe("/v2/desempeno/usuarios");
    expect(url?.searchParams.get("periodo")).toBe("semana");
    expect(url?.searchParams.get("pausa_min")).toBe("30");
    expect(url?.searchParams.get("desde_hora")).toBe("08:00");
    expect(url?.searchParams.get("hasta_hora")).toBe("18:00");
    expect(t.usuarios).toHaveLength(2);
  });

  it("jornada: fecha y sin horario no manda desde/hasta_hora", async () => {
    let url: URL | undefined;
    server.use(...desempenoHandlers({ vistoPor: (u) => (url = u) }));
    const j = await adapter().obtenerJornada("abc 123", "2026-10-13", { pausaMin: 45, horario: null });
    expect(url?.pathname).toBe("/v2/desempeno/usuarios/abc%20123/jornada");
    expect(url?.searchParams.get("fecha")).toBe("2026-10-13");
    expect(url?.searchParams.has("desde_hora")).toBe(false);
    expect(url?.searchParams.has("hasta_hora")).toBe(false);
    expect(j.generadoAt).toBe("2026-10-14T22:40:00Z");
  });

  it("actividad: arreglos repetidos sin corchetes, booleanos y paginación", async () => {
    let url: URL | undefined;
    server.use(...desempenoHandlers({ vistoPor: (u) => (url = u) }));
    const p = await adapter().listarActividad(
      "abc123",
      {
        ...FILTROS_ACTIVIDAD_INICIALES,
        tipos: ["pago", "condonacion"],
        registradoPor: ["abc123", "oficina"],
        conGps: false,
        q: "  andrade ",
        montoMin: "400",
      },
      { cursor: "opaco-1", limit: 100 },
    );
    expect(url?.searchParams.getAll("tipo")).toEqual(["pago", "condonacion"]);
    expect(url?.searchParams.getAll("registrado_por")).toEqual(["abc123", "oficina"]);
    expect(url?.searchParams.get("con_gps")).toBe("false");
    expect(url?.searchParams.has("con_fotos")).toBe(false);
    expect(url?.searchParams.get("q")).toBe("andrade");
    expect(url?.searchParams.get("monto_min")).toBe("400");
    expect(url?.searchParams.get("orden")).toBe("hora");
    expect(url?.searchParams.get("dir")).toBe("desc");
    expect(url?.searchParams.get("cursor")).toBe("opaco-1");
    expect(url?.searchParams.get("limit")).toBe("100");
    expect(p.totales.n).toBe(1188);
  });

  it("actividad: formas de cobro por código, tipos de visita literales y rango", async () => {
    let url: URL | undefined;
    server.use(...desempenoHandlers({ vistoPor: (u) => (url = u) }));
    await adapter().listarActividad(
      "abc123",
      {
        ...FILTROS_ACTIVIDAD_INICIALES,
        desde: "2026-10-09T06:00:00Z",
        hasta: "2026-10-15T06:00:00Z",
        formasCobro: ["efectivo", "cheque"],
        tiposVisita: ["No se encontraba"],
        conFotos: true,
        montoMax: "1000",
      },
      { cursor: null, limit: 50 },
    );
    expect(url?.searchParams.get("desde")).toBe("2026-10-09T06:00:00Z");
    expect(url?.searchParams.get("hasta")).toBe("2026-10-15T06:00:00Z");
    expect(url?.searchParams.getAll("forma_cobro")).toEqual(["efectivo", "cheque"]);
    expect(url?.searchParams.getAll("tipo_visita")).toEqual(["No se encontraba"]);
    expect(url?.searchParams.get("con_fotos")).toBe("true");
    expect(url?.searchParams.get("monto_max")).toBe("1000");
    expect(url?.searchParams.has("cursor")).toBe(false);
    expect(url?.searchParams.has("tipo")).toBe(false);
  });

  it("cuentas: columna sin_nada, nunca segmento", async () => {
    let url: URL | undefined;
    server.use(...desempenoHandlers({ vistoPor: (u) => (url = u) }));
    const c = await adapter().obtenerCuentas("abc123", { columna: "sin_nada", q: "", orden: "atrasos", dir: "desc" });
    expect(url?.searchParams.get("columna")).toBe("sin_nada");
    expect(url?.searchParams.has("segmento")).toBe(false);
    expect(url?.searchParams.has("q")).toBe(false);
    expect(c.conteos.total).toBe(209);
  });

  it("usuario: GET /v2/desempeno/usuarios/<uid> con periodo, pausa y contrato", async () => {
    let url: URL | undefined;
    server.use(...desempenoHandlers({ vistoPor: (u) => (url = u) }));
    const f = await adapter().obtenerUsuario("abc 123", { periodo: "semana", pausaMin: 30, horario: { desde: "08:00", hasta: "18:00" } });
    expect(url?.pathname).toBe("/v2/desempeno/usuarios/abc%20123");
    expect(url?.searchParams.get("periodo")).toBe("semana");
    expect(url?.searchParams.get("pausa_min")).toBe("30");
    expect(url?.searchParams.get("desde_hora")).toBe("08:00");
    expect(f.diasNavegables).toHaveLength(6);
  });

  // E-INF-018: sin contrato=2.2 el servidor sirve v2.1; toda petición por usuario lo manda.
  it("toda petición a /v2/desempeno/usuarios* manda contrato=2.2", async () => {
    const vistas: URL[] = [];
    server.use(...desempenoHandlers({ vistoPor: (u) => vistas.push(u) }));
    const a = adapter();
    const consulta = { periodo: "hoy" as const, pausaMin: 45, horario: null };
    await a.obtenerTablero(consulta);
    await a.obtenerUsuario("abc123", consulta);
    await a.obtenerJornada("abc123", "2026-10-14", { pausaMin: 45, horario: null });
    await a.listarActividad("abc123", FILTROS_ACTIVIDAD_INICIALES, { cursor: null, limit: 100 });
    await a.obtenerCuentas("abc123", { columna: null, q: "", orden: "cliente", dir: "asc" });
    expect(vistas.map((u) => u.pathname)).toEqual([
      "/v2/desempeno/usuarios",
      "/v2/desempeno/usuarios/abc123",
      "/v2/desempeno/usuarios/abc123/jornada",
      "/v2/desempeno/usuarios/abc123/actividad",
      "/v2/desempeno/usuarios/abc123/cuentas",
    ]);
    for (const u of vistas) expect(u.searchParams.get("contrato"), u.pathname).toBe("2.2");
  });

  // Contrato pulido 2 §3: ruta estática fuera de /usuarios/{uid}, contrato=2.2
  // y los uids en UN parámetro separado por comas.
  it("lote de último movimiento: GET /v2/desempeno/ultimo-movimiento?contrato=2.2&uids=a,b", async () => {
    let url: URL | undefined;
    server.use(...desempenoHandlers({ vistoPor: (u) => (url = u) }));
    const r = await adapter().obtenerUltimosMovimientos(["abc123", "ghi789"]);
    expect(url?.pathname).toBe("/v2/desempeno/ultimo-movimiento");
    expect(url?.searchParams.get("contrato")).toBe("2.2");
    expect(url?.searchParams.getAll("uids")).toEqual(["abc123,ghi789"]);
    expect(r.porUid.get("abc123")).toEqual({ id: "visita:9d1e", tipo: "visita", hora: "2026-09-14T17:05:00Z" });
    expect(r.porUid.get("ghi789")).toBeNull();
  });

  it("lote de último movimiento: una respuesta mal formada es desempeno_respuesta_invalida", async () => {
    server.use(
      http.get("*/v2/desempeno/ultimo-movimiento", () =>
        HttpResponse.json({ generado_at: "2026-10-14T22:40:00Z", usuarios: [{ uid: "abc123" }] }),
      ),
    );
    const e = await adapter().obtenerUltimosMovimientos(["abc123"]).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(DomainError);
    expect((e as DomainError).code).toBe("desempeno_respuesta_invalida");
  });

  it("lote de último movimiento: el 422 llega como DomainError con su código", async () => {
    server.use(
      ...desempenoHandlers({
        error: {
          status: 422,
          body: { title: "Unprocessable Entity", status: 422, detail: "parámetro inválido", errors: [{ message: "code=desempeno_parametro_invalido", location: "query.uids" }] },
        },
      }),
    );
    const e = await adapter().obtenerUltimosMovimientos(["abc123"]).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(DomainError);
    expect((e as DomainError).code).toBe("desempeno_parametro_invalido");
  });

  it("catálogos: GET /v2/desempeno/catalogos", async () => {
    let url: URL | undefined;
    server.use(...desempenoHandlers({ vistoPor: (u) => (url = u) }));
    const cat = await adapter().obtenerCatalogos();
    expect(url?.pathname).toBe("/v2/desempeno/catalogos");
    expect(cat.formasCobro.map((f) => f.codigo)).toEqual(["efectivo", "transferencia", "cheque", "condonacion"]);
    expect(cat.tiposVisita[0].grupo).toBe("No estaba");
  });

  it("fotos: pago por pago_recibido_id y visita por visita_id", async () => {
    const vistas: string[] = [];
    server.use(...desempenoHandlers({ vistoPor: (u) => vistas.push(u.pathname) }));
    await adapter().listarImagenes({ tipo: "pago", pagoRecibidoId: "p-1" });
    const imgs = await adapter().listarImagenes({ tipo: "visita", visitaId: "v-1" });
    expect(vistas).toEqual(["/v2/cobranza/pagos/p-1/imagenes", "/v2/visitas/v-1/imagenes"]);
    expect(imgs[0].descripcion).toBeNull();
  });

  it("descarga de foto como blob", async () => {
    const blob = new Blob(["jpg"]);
    const get = vi.fn().mockResolvedValue({ data: blob });
    const a = new HttpDesempenoAdapter({ get } as unknown as AxiosInstance);
    await expect(a.descargarImagen({ tipo: "visita", visitaId: "v-1" }, "img-1")).resolves.toBe(blob);
    expect(get).toHaveBeenCalledWith("/visitas/v-1/imagenes/img-1", { responseType: "blob", signal: undefined });
    await a.descargarImagen({ tipo: "pago", pagoRecibidoId: "p-1" }, "img-2");
    expect(get).toHaveBeenLastCalledWith("/cobranza/pagos/p-1/imagenes/img-2", { responseType: "blob", signal: undefined });
  });

  it("descarga de foto que falla: el cuerpo JSON llega como Blob y aun así se lee el código", async () => {
    server.use(
      http.get("*/v2/visitas/:id/imagenes/:img", () =>
        HttpResponse.json(
          { title: "Not Found", status: 404, detail: "la imagen no es de esa visita", errors: [{ message: "code=imagen_not_found" }] },
          { status: 404 },
        ),
      ),
    );
    const e = await adapter()
      .descargarImagen({ tipo: "visita", visitaId: "v-1" }, "img-ajena")
      .catch((x: unknown) => x);
    expect(e).toBeInstanceOf(DomainError);
    expect((e as DomainError).code).toBe("imagen_not_found");
    expect((e as DomainError).message).toBe("la imagen no es de esa visita");
  });

  it("errores del API llegan como DomainError con el código del contrato", async () => {
    server.use(
      ...desempenoHandlers({
        error: {
          status: 503,
          body: { title: "Service Unavailable", status: 503, detail: "no se pudo consultar a los usuarios", errors: [{ message: "code=desempeno_firestore_unavailable" }] },
        },
      }),
    );
    const e = await adapter().obtenerTablero({ periodo: "hoy", pausaMin: 45, horario: null }).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(DomainError);
    expect((e as DomainError).code).toBe("desempeno_firestore_unavailable");
  });

  // Visitas P2, Tarea 21: la agenda del servidor (spec §5.5).
  describe("agenda de compromisos", () => {
    it("GET /v2/visitas/agenda?zona_id=21563 sin hoy y mapea por venta", async () => {
      let url: URL | undefined;
      server.use(...desempenoHandlers({ vistoPor: (u) => (url = u) }));
      const agenda = await adapter().obtenerAgenda(21563, null);
      expect(url?.pathname).toBe("/v2/visitas/agenda");
      expect(url?.searchParams.get("zona_id")).toBe("21563");
      expect(url?.searchParams.has("hoy")).toBe(false);
      expect(url?.searchParams.has("contrato")).toBe(false);
      expect(agenda.get(13790011)).toEqual({
        ventaId: 13790011,
        tipo: "promesa",
        estado: "vigente_futura",
        dia: "2026-10-20",
        hora: null,
        montoCentavos: 15000,
      });
      expect(agenda.get(13785217)).toMatchObject({ tipo: "cita", estado: "cerrada_sin_cumplir", hora: "16:30" });
      expect(agenda.size).toBe(2);
    });

    it("manda hoy cuando se pide un día", async () => {
      let url: URL | undefined;
      server.use(...desempenoHandlers({ vistoPor: (u) => (url = u) }));
      await adapter().obtenerAgenda(21563, "2026-10-14");
      expect(url?.searchParams.get("zona_id")).toBe("21563");
      expect(url?.searchParams.get("hoy")).toBe("2026-10-14");
    });

    const responderAgenda = (cuerpo: unknown) =>
      server.use(http.get("*/v2/visitas/agenda", () => HttpResponse.json(cuerpo as Record<string, unknown>)));
    const item = agendaDTO.items[1];

    it.each([
      ["un estado fuera del contrato", { ...item, estado: "reemplazada" }],
      ["un tipo fuera del contrato", { ...item, tipo: "recordatorio" }],
      ["un monto que no es entero de centavos", { ...item, monto_centavos: 150.5 }],
      ["un día que no es AAAA-MM-DD", { ...item, dia: "20/10/2026" }],
      ["una hora que no es HH:MM", { ...item, tipo: "cita", hora: "4:30 pm" }],
      ["un venta_id ausente", { ...item, venta_id: undefined }],
    ])("%s es desempeno_respuesta_invalida", async (_, malo) => {
      responderAgenda({ ...agendaDTO, items: [malo] });
      await expect(adapter().obtenerAgenda(21563, null)).rejects.toMatchObject({
        code: "desempeno_respuesta_invalida",
      });
    });

    it("dos compromisos para la misma venta es desempeno_respuesta_invalida", async () => {
      responderAgenda({ ...agendaDTO, items: [item, { ...item, visita_id: "otra" }] });
      await expect(adapter().obtenerAgenda(21563, null)).rejects.toMatchObject({
        code: "desempeno_respuesta_invalida",
      });
    });

    it("la agenda de otra zona es desempeno_respuesta_invalida", async () => {
      responderAgenda({ ...agendaDTO, zona_id: 99 });
      await expect(adapter().obtenerAgenda(21563, null)).rejects.toMatchObject({
        code: "desempeno_respuesta_invalida",
      });
    });

    // Forma real de visitashttp/auth.go requirePerm: 403 de Huma sin código.
    it("el 403 sin cobranza:ver_pagos llega como DomainError http_403", async () => {
      server.use(
        ...desempenoHandlers({
          error: {
            status: 403,
            body: {
              title: "Forbidden",
              status: 403,
              detail: "permiso denegado",
              errors: [{ message: "el principal no tiene el permiso requerido", location: "header.authorization" }],
            },
          },
        }),
      );
      const e = await adapter().obtenerAgenda(21563, null).catch((x: unknown) => x);
      expect(e).toBeInstanceOf(DomainError);
      expect(e).toMatchObject({ code: "http_403", message: "permiso denegado" });
    });
  });
});
