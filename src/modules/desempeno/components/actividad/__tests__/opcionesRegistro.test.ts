import { describe, expect, it } from "vitest";
import {
  makeActividadPago,
  makeRegistradoPor,
} from "../../../application/__tests__/fakeDesempenoPort";
import { opcionesRegistro, recordarNombres, valorRegistro } from "../opcionesRegistro";

const ana = makeRegistradoPor({ usuarioUid: "u-ana", nombre: "ANA" });
const beto = makeRegistradoPor({ usuarioUid: "u-beto", nombre: "BETO" });
const oficina = makeRegistradoPor({ usuarioUid: null, cobradorId: null, nombre: "Oficina", origen: "oficina" });
const act = (registradoPor: ReturnType<typeof makeRegistradoPor>) => makeActividadPago({ registradoPor });

describe("opcionesRegistro", () => {
  it("sin duplicados y alfabético por nombre, sin importar el orden de llegada", () => {
    expect(opcionesRegistro([act(beto), act(ana), act(beto)], [])).toEqual([
      { valor: "u-ana", etiqueta: "ANA" },
      { valor: "u-beto", etiqueta: "BETO" },
    ]);
  });
  it("Oficina solo si hay movimientos de oficina, y al final", () => {
    expect(opcionesRegistro([act(ana)], [])).toEqual([{ valor: "u-ana", etiqueta: "ANA" }]);
    expect(opcionesRegistro([act(oficina), act(ana)], []).map((o) => o.valor)).toEqual(["u-ana", "oficina"]);
  });
  it("lo seleccionado se conserva aunque no aparezca, con el nombre recordado", () => {
    expect(opcionesRegistro([act(ana)], ["u-beto"], { "u-beto": "BETO" })).toEqual([
      { valor: "u-ana", etiqueta: "ANA" },
      { valor: "u-beto", etiqueta: "BETO" },
    ]);
    expect(opcionesRegistro([], ["u-x"])).toEqual([{ valor: "u-x", etiqueta: "Otra persona" }]);
    expect(opcionesRegistro([], ["oficina"])).toEqual([{ valor: "oficina", etiqueta: "Oficina" }]);
  });
  it("un movimiento de la app sin uid no se puede filtrar y no genera opción", () => {
    const sinUid = makeRegistradoPor({ usuarioUid: null, nombre: "SIN UID" });
    expect(valorRegistro(act(sinUid))).toBeNull();
    expect(opcionesRegistro([act(sinUid)], [])).toEqual([]);
  });
  it("recordarNombres no cambia la referencia si nada cambió", () => {
    const n = recordarNombres({}, [act(ana)]);
    expect(n).toEqual({ "u-ana": "ANA" });
    expect(recordarNombres(n, [act(ana)])).toBe(n);
  });
});
