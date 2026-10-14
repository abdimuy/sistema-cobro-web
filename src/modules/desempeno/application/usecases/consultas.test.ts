import { describe, expect, it } from "vitest";
import {
  descargarImagen,
  listarActividad,
  listarImagenes,
  obtenerCatalogos,
  obtenerCuentas,
  obtenerJornada,
  obtenerTablero,
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
    const consulta = { segmento: "sin_nada" as const, q: "", orden: "atrasos" as const, dir: "desc" as const };
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
