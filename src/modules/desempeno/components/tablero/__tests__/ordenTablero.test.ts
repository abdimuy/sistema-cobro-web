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
    expect(ordenarUsuarios([rosa, juan], { clave: "zona", dir: 1 }).map((u) => u.uid)).toEqual(["uid-juan", "uid-rosa"]);
    expect(ordenarUsuarios([rosa, juan], { clave: "pagos", dir: -1 }).map((u) => u.uid)).toEqual(["uid-juan", "uid-rosa"]);
    expect(ordenarUsuarios([juan, rosa], { clave: "pagos", dir: 1 }).map((u) => u.uid)).toEqual(["uid-rosa", "uid-juan"]);
  });

  it("estado ahora: activo antes que sin actividad; % nulo al final", () => {
    expect(ordenarUsuarios([rosa, juan], { clave: "ahora", dir: 1 })[0].uid).toBe("uid-juan");
    expect(ordenarUsuarios([rosa, juan], { clave: "cobro", dir: -1 })[1].uid).toBe("uid-rosa");
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
});
