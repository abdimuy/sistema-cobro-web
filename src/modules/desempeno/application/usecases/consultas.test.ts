import { describe, expect, it } from "vitest";
import {
  descargarImagen,
  listarActividad,
  listarImagenes,
  obtenerCatalogos,
  obtenerCuentas,
  obtenerJornada,
  obtenerTablero,
  obtenerUltimosMovimientos92Dias,
} from "./consultas";
import { FakeDesempenoPort, makeCatalogos, makeTablero } from "../__tests__/fakeDesempenoPort";
import { FILTROS_ACTIVIDAD_INICIALES } from "../../domain/entities";

describe("casos de uso de desempeño (pass-through al puerto)", () => {
  it("obtenerTablero reenvía la consulta completa", async () => {
    const port = new FakeDesempenoPort();
    port.tableroResponse = makeTablero({ periodo: "semana" });
    const consulta = { periodo: "semana" as const, pausaMin: 30, horario: { desde: "08:00", hasta: "18:00" } };

    const t = await obtenerTablero(port, consulta);

    expect(port.tableroCalls).toEqual([{ consulta }]);
    expect(t.periodo).toBe("semana");
  });

  it("obtenerJornada reenvía uid, fecha y consulta", async () => {
    const port = new FakeDesempenoPort();
    await obtenerJornada(port, "uid-juan", "2026-10-13", { pausaMin: 45, horario: null });
    expect(port.jornadaCalls).toEqual([
      { uid: "uid-juan", fecha: "2026-10-13", consulta: { pausaMin: 45, horario: null } },
    ]);
  });

  it("listarActividad reenvía los filtros sin tocarlos", async () => {
    const port = new FakeDesempenoPort();
    const filtros = { ...FILTROS_ACTIVIDAD_INICIALES, tipos: ["pago" as const], q: "andrade" };
    await listarActividad(port, "uid-juan", filtros, { cursor: "c1", limit: 100 });
    expect(port.actividadCalls[0]).toEqual({ uid: "uid-juan", filtros, pagina: { cursor: "c1", limit: 100 } });
  });

  it("obtenerCuentas, listarImagenes y descargarImagen reenvían sus argumentos", async () => {
    const port = new FakeDesempenoPort();
    const consulta = { columna: "sin_nada" as const, q: "", orden: "atrasos" as const, dir: "desc" as const };
    const ref = { tipo: "visita" as const, visitaId: "v-1" };
    await obtenerCuentas(port, "uid-juan", consulta);
    await listarImagenes(port, ref);
    await descargarImagen(port, ref, "img-1");
    expect(port.cuentasCalls[0]).toEqual({ uid: "uid-juan", consulta });
    expect(port.imagenesCalls[0]).toEqual({ ref });
    expect(port.descargarCalls[0]).toEqual({ ref, imagenId: "img-1" });
  });

  it("obtenerCatalogos devuelve los catálogos del servidor tal cual (contrato v2 §4b)", async () => {
    const port = new FakeDesempenoPort();
    const catalogos = makeCatalogos({ tiposVisita: [] });
    port.catalogosResponse = catalogos;

    const c = await obtenerCatalogos(port);

    expect(port.catalogosCalls).toBe(1);
    expect(c).toBe(catalogos);
  });

  it("propaga el error del puerto tal cual", async () => {
    const port = new FakeDesempenoPort();
    port.throwOnNext.obtenerTablero = new Error("se cayó");
    await expect(obtenerTablero(port, { periodo: "hoy", pausaMin: 45, horario: null })).rejects.toThrow("se cayó");
  });
});

// Contrato pulido 2 §3–§4: el lote acepta de 1 a 100 uids; el escritorio parte
// en trozos de 100 y une las respuestas. Sin uids no se llama.
describe("obtenerUltimosMovimientos92Dias", () => {
  const uids = (n: number) => Array.from({ length: n }, (_, i) => `u${i + 1}`);

  it("sin uids no llama al puerto", async () => {
    const port = new FakeDesempenoPort();
    const r = await obtenerUltimosMovimientos92Dias(port, []);
    expect(port.ultimosMovimientosCalls).toEqual([]);
    expect(r.size).toBe(0);
  });

  it("100 uids van en una sola llamada", async () => {
    const port = new FakeDesempenoPort();
    await obtenerUltimosMovimientos92Dias(port, uids(100));
    expect(port.ultimosMovimientosCalls.map((c) => c.uids.length)).toEqual([100]);
  });

  it("150 uids van en dos llamadas de 100 y 50, sin repetir, y se unen", async () => {
    const port = new FakeDesempenoPort();
    port.ultimosMovimientosResponse = (pedidos) => ({
      generadoAt: "2026-10-14T22:40:00Z",
      porUid: new Map(pedidos.map((u) => [u, null])),
    });
    const r = await obtenerUltimosMovimientos92Dias(port, uids(150));
    const llamadas = port.ultimosMovimientosCalls.map((c) => c.uids);
    expect(llamadas.map((l) => l.length)).toEqual([100, 50]);
    expect(llamadas.flat()).toEqual(uids(150));
    expect(r.size).toBe(150);
  });

  it("los uids repetidos se mandan una vez", async () => {
    const port = new FakeDesempenoPort();
    await obtenerUltimosMovimientos92Dias(port, ["a", "b", "a"]);
    expect(port.ultimosMovimientosCalls.map((c) => c.uids)).toEqual([["a", "b"]]);
  });

  it("si un trozo falla, falla todo", async () => {
    const port = new FakeDesempenoPort();
    port.throwOnNext.obtenerUltimosMovimientos = new Error("se cayó");
    await expect(obtenerUltimosMovimientos92Dias(port, uids(150))).rejects.toThrow("se cayó");
  });
});
