import { describe, expect, it } from "vitest";
import { agruparConsecutivos } from "../agrupar";
import {
  makeActividadPago,
  makeActividadVisita,
} from "../../../application/__tests__/fakeDesempenoPort";

describe("agruparConsecutivos", () => {
  it("agrupa renglones contiguos por la clave elegida, sin sumar nada", () => {
    const items = [
      makeActividadPago({ id: "a", hora: "2026-10-14T16:00:00Z" }),
      makeActividadVisita({ id: "b", hora: "2026-10-14T15:00:00Z" }),
      makeActividadPago({ id: "c", hora: "2026-10-13T16:00:00Z" }),
    ];
    const grupos = agruparConsecutivos(items, "dia");
    expect(grupos.map((g) => g.clave)).toEqual(["miércoles 14 de octubre", "martes 13 de octubre"]);
    expect(grupos[0].items.map((a) => a.id)).toEqual(["a", "b"]);
    expect(Object.keys(grupos[0])).toEqual(["clave", "items"]);
  });

  it("el día es el de la oficina: 05:30Z todavía es el día anterior", () => {
    const grupos = agruparConsecutivos(
      [makeActividadPago({ id: "a", hora: "2026-10-15T05:30:00Z" })],
      "dia",
    );
    expect(grupos[0].clave).toBe("miércoles 14 de octubre");
  });

  it("por tipo usa la etiqueta en español", () => {
    const grupos = agruparConsecutivos([makeActividadVisita()], "tipo");
    expect(grupos[0].clave).toBe("Visita");
  });
});
