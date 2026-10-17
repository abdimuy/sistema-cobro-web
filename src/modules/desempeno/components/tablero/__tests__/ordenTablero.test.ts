import { describe, expect, it } from "vitest";
import { filtrarUsuarios, ordenarUsuarios, siguienteOrden } from "../ordenTablero";
import { makeUsuarioTablero } from "../../../application/__tests__/fakeDesempenoPort";

const juan = makeUsuarioTablero();
const rosa = makeUsuarioTablero({
  uid: "uid-rosa",
  nombre: "Rosa Isela Pacheco",
  email: "rosa.pacheco@muebleriamsp.mx",
  zonaNombre: "RUTA 22",
  pagos: { n: 24, importe: "5100.00" },
  estadoAhora: "sin_actividad",
  cobro: { cobrado: "5100.00", esperado: "11800.00", falta: "6700.00", pct: null },
});

describe("ordenTablero", () => {
  it("ordena por zona por defecto y por pagos (importe del API) cuando se pide", () => {
    expect(ordenarUsuarios([rosa, juan], { clave: "zona", dir: 1 }, "hoy").map((u) => u.uid)).toEqual(["uid-juan", "uid-rosa"]);
    expect(ordenarUsuarios([rosa, juan], { clave: "pagos", dir: -1 }, "hoy").map((u) => u.uid)).toEqual(["uid-juan", "uid-rosa"]);
    expect(ordenarUsuarios([juan, rosa], { clave: "pagos", dir: 1 }, "hoy").map((u) => u.uid)).toEqual(["uid-rosa", "uid-juan"]);
  });

  it("estado ahora: activo antes que sin actividad; % nulo al final", () => {
    expect(ordenarUsuarios([rosa, juan], { clave: "ahora", dir: 1 }, "hoy")[0].uid).toBe("uid-juan");
    expect(ordenarUsuarios([rosa, juan], { clave: "cobro", dir: -1 }, "hoy")[1].uid).toBe("uid-rosa");
  });

  it("% nulo va al final en los dos sentidos", () => {
    const ana = makeUsuarioTablero({ uid: "uid-ana", cobro: { cobrado: "1.00", esperado: "100.00", falta: "99.00", pct: "1.00" } });
    expect(ordenarUsuarios([rosa, juan, ana], { clave: "cobro", dir: 1 }, "hoy").map((u) => u.uid)).toEqual([
      "uid-ana",
      "uid-juan",
      "uid-rosa",
    ]);
    expect(ordenarUsuarios([rosa, ana, juan], { clave: "cobro", dir: -1 }, "hoy").map((u) => u.uid)).toEqual([
      "uid-juan",
      "uid-ana",
      "uid-rosa",
    ]);
  });

  it("buscar no distingue acentos ni mayúsculas y mira nombre y zona", () => {
    expect(filtrarUsuarios([juan, rosa], "mendez").map((u) => u.uid)).toEqual(["uid-juan"]);
    expect(filtrarUsuarios([juan, rosa], "ruta 22").map((u) => u.uid)).toEqual(["uid-rosa"]);
    expect(filtrarUsuarios([juan, rosa], "  ")).toHaveLength(2);
  });

  it("clic en la misma columna invierte; en otra, empieza en su sentido natural", () => {
    expect(siguienteOrden({ clave: "pagos", dir: -1 }, "pagos")).toEqual({ clave: "pagos", dir: 1 });
    expect(siguienteOrden({ clave: "zona", dir: 1 }, "pagos")).toEqual({ clave: "pagos", dir: -1 });
    expect(siguienteOrden({ clave: "pagos", dir: -1 }, "nombre")).toEqual({ clave: "nombre", dir: 1 });
  });

  describe("en Semana ordena por el promedio diario del servidor (T19)", () => {
    const prom = (minutosActivos: number, pagosImporte: string, visitas: number, dias = 3) => ({
      dias,
      minutosActivos,
      pagosImporte,
      visitas,
    });
    // 6 días y $6,000 de total ($1,000/día) vs 2 días y $3,000 ($1,500/día).
    const largo = makeUsuarioTablero({
      uid: "uid-largo",
      pagos: { n: 60, importe: "6000.00" },
      minutosActivos: 2000,
      visitas: 60,
      promedioDiario: prom(100, "1000.00", 10, 6),
    });
    const corto = makeUsuarioTablero({
      uid: "uid-corto",
      pagos: { n: 30, importe: "3000.00" },
      minutosActivos: 600,
      visitas: 20,
      promedioDiario: prom(300, "1500.00", 15, 2),
    });
    const sinPromedio = makeUsuarioTablero({ uid: "uid-nulo", pagos: { n: 99, importe: "99999.00" }, promedioDiario: null });

    it.each(["pagos", "horas", "visitas"] as const)("%s: el de mejor promedio primero, aunque su total sea menor", (clave) => {
      expect(ordenarUsuarios([largo, corto], { clave, dir: -1 }, "semana").map((u) => u.uid)).toEqual([
        "uid-corto",
        "uid-largo",
      ]);
    });

    it("en Hoy ordena por el total del día, no por el promedio", () => {
      expect(ordenarUsuarios([corto, largo], { clave: "pagos", dir: -1 }, "hoy").map((u) => u.uid)).toEqual([
        "uid-largo",
        "uid-corto",
      ]);
    });

    it("promedio nulo va al final en los dos sentidos", () => {
      expect(ordenarUsuarios([sinPromedio, largo, corto], { clave: "pagos", dir: -1 }, "semana").map((u) => u.uid)).toEqual([
        "uid-corto",
        "uid-largo",
        "uid-nulo",
      ]);
      expect(ordenarUsuarios([sinPromedio, largo, corto], { clave: "pagos", dir: 1 }, "semana").map((u) => u.uid)).toEqual([
        "uid-largo",
        "uid-corto",
        "uid-nulo",
      ]);
    });
  });
});
