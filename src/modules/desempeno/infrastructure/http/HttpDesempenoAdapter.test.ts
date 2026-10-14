import { describe, expect, it, vi } from "vitest";
import axios, { type AxiosInstance } from "axios";
import { server } from "../../../../test/msw/server";
import { desempenoHandlers } from "../../../../test/msw/handlers/desempeno";
import { HttpDesempenoAdapter } from "./HttpDesempenoAdapter";
import { FILTROS_ACTIVIDAD_INICIALES } from "../../domain/entities";
import { DomainError } from "../../domain/errors";

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

  it("cuentas: segmento sin_nada", async () => {
    let url: URL | undefined;
    server.use(...desempenoHandlers({ vistoPor: (u) => (url = u) }));
    const c = await adapter().obtenerCuentas("abc123", { segmento: "sin_nada", q: "", orden: "atrasos", dir: "desc" });
    expect(url?.searchParams.get("segmento")).toBe("sin_nada");
    expect(url?.searchParams.has("q")).toBe(false);
    expect(c.conteos.total).toBe(232);
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
});
