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
    expect(grupos.map((g) => g.etiqueta)).toEqual([
      "miércoles 14 de octubre",
      "martes 13 de octubre",
    ]);
    expect(grupos.map((g) => g.clave)).toEqual(["2026-10-14", "2026-10-13"]);
    expect(grupos[0].items.map((a) => a.id)).toEqual(["a", "b"]);
    expect(Object.keys(grupos[0])).toEqual(["clave", "etiqueta", "items"]);
  });

  it("el día es el de la oficina: 05:30Z todavía es el día anterior", () => {
    const grupos = agruparConsecutivos(
      [makeActividadPago({ id: "a", hora: "2026-10-15T05:30:00Z" })],
      "dia",
    );
    expect(grupos[0].etiqueta).toBe("miércoles 14 de octubre");
  });

  it("por tipo usa la etiqueta en español", () => {
    const grupos = agruparConsecutivos([makeActividadVisita()], "tipo");
    expect(grupos[0].etiqueta).toBe("Visita");
  });

  it("por cliente agrupa por cliente_id: dos homónimos seguidos son dos grupos", () => {
    const grupos = agruparConsecutivos(
      [
        makeActividadPago({ id: "a", clienteId: 1, clienteNombre: "JOSÉ LUIS PÉREZ" }),
        makeActividadPago({ id: "b", clienteId: 2, clienteNombre: "JOSÉ LUIS PÉREZ" }),
      ],
      "cliente",
    );
    expect(grupos.map((g) => g.items.map((a) => a.id))).toEqual([["a"], ["b"]]);
    expect(grupos.map((g) => g.etiqueta)).toEqual(["JOSÉ LUIS PÉREZ", "JOSÉ LUIS PÉREZ"]);
  });

  it("por venta: dentro del bloque de un cliente junta por venta_id aunque vengan intercaladas", () => {
    const grupos = agruparConsecutivos(
      [
        makeActividadPago({ id: "a", clienteId: 1, ventaId: 10, folio: "Z10" }),
        makeActividadPago({ id: "b", clienteId: 1, ventaId: 11, folio: "Z11" }),
        makeActividadPago({ id: "c", clienteId: 1, ventaId: 10, folio: "Z10" }),
        makeActividadPago({ id: "d", clienteId: 2, ventaId: 10, folio: "Z10" }),
      ],
      "venta",
    );
    expect(grupos.map((g) => g.items.map((a) => a.id))).toEqual([["a", "c"], ["b"], ["d"]]);
    expect(grupos[0].etiqueta).toBe("Z10 · JUANA ANDRADE LECHUGA");
  });

  it("por venta: sin venta_id se agrupa por cliente, con etiqueta 'Sin venta'", () => {
    const grupos = agruparConsecutivos(
      [
        makeActividadVisita({ id: "a", clienteId: 1, ventaId: null, folio: null }),
        makeActividadVisita({ id: "b", clienteId: 2, ventaId: null, folio: null }),
      ],
      "venta",
    );
    expect(grupos).toHaveLength(2);
    expect(grupos[0].etiqueta).toMatch(/^Sin venta · /);
  });
});
