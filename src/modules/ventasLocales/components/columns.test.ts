import { beforeEach, describe, expect, it } from "vitest";

import {
  COLUMNS,
  DEFAULT_COLUMN_WIDTHS,
  DEFAULT_PINNED_COLUMNS,
  DEFAULT_VISIBLE_COLUMNS,
  MAX_PINNED,
  loadPinnedColumns,
  loadVisibleColumns,
  type ColumnId,
} from "./columns";

beforeEach(() => {
  localStorage.clear();
});

describe("catálogo de columnas — la vista por omisión", () => {
  it("es exactamente el orden aprobado", () => {
    expect(DEFAULT_VISIBLE_COLUMNS).toEqual([
      "fase",
      "cliente",
      "fecha",
      "ciudad",
      "zona",
      "vendedor",
      "telefono",
      "tipo",
      "total",
      "situacion",
      "microsipFolio",
    ]);
  });

  it("sale de las banderas del arreglo COLUMNS, no de una lista aparte", () => {
    const porBandera = COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id);

    expect(porBandera).toEqual(DEFAULT_VISIBLE_COLUMNS);
  });

  it("la fase va antes que el cliente", () => {
    expect(DEFAULT_VISIBLE_COLUMNS.indexOf("fase")).toBeLessThan(
      DEFAULT_VISIBLE_COLUMNS.indexOf("cliente")
    );
  });

  it("sincronizacion ya no viene por omisión: el cuarto arco es esa columna", () => {
    expect(DEFAULT_VISIBLE_COLUMNS).not.toContain("sincronizacion");
  });

  it("situacion se queda", () => {
    expect(DEFAULT_VISIBLE_COLUMNS).toContain("situacion");
  });

  it("salen ID, corto plazo y frecuencia; entra vendedor", () => {
    for (const id of ["id", "montoCorto", "frecuencia"] as ColumnId[]) {
      expect(DEFAULT_VISIBLE_COLUMNS).not.toContain(id);
    }
    expect(DEFAULT_VISIBLE_COLUMNS).toContain("vendedor");
  });

  it("lo que salió de la vista sigue disponible en el selector", () => {
    const catalogo = COLUMNS.map((c) => c.id);

    for (const id of ["id", "montoCorto", "frecuencia", "sincronizacion"] as ColumnId[]) {
      expect(catalogo).toContain(id);
    }
  });

  it("loadVisibleColumns devuelve el orden por omisión sin nada guardado", () => {
    expect(loadVisibleColumns()).toEqual(DEFAULT_VISIBLE_COLUMNS);
  });
});

describe("catálogo de columnas — la fase anclada", () => {
  it("la fase se ancla y va antes de cliente entre las fijas", () => {
    expect(DEFAULT_PINNED_COLUMNS).toEqual(["fase", "cliente"]);
    expect(DEFAULT_PINNED_COLUMNS.length).toBeLessThanOrEqual(MAX_PINNED);
  });

  it("loadPinnedColumns ancla fase y cliente sin preferencia guardada", () => {
    expect(loadPinnedColumns()).toEqual(["fase", "cliente"]);
  });

  it("respeta lo que el usuario ya haya anclado", () => {
    localStorage.setItem("ventas-pinned-columns-v2", JSON.stringify(["cliente"]));

    expect(loadPinnedColumns()).toEqual(["cliente"]);
  });
});

describe("catálogo de columnas — la definición de fase", () => {
  it("existe, se llama Fase y vive en el grupo Estado", () => {
    const fase = COLUMNS.find((c) => c.id === "fase");

    expect(fase).toBeDefined();
    expect(fase?.label).toBe("Fase");
    expect(fase?.group).toBe("Estado");
  });

  it("tiene ancho por omisión: la celda lleva anillo y dos renglones", () => {
    expect(DEFAULT_COLUMN_WIDTHS.fase).toBeGreaterThanOrEqual(160);
  });

  it("no es ordenable: la fase se deriva, no viene del backend", () => {
    expect(COLUMNS.find((c) => c.id === "fase")?.sortable).toBeUndefined();
  });
});
