import { describe, it, expect } from "vitest";
import { resolveCell, CELLS } from "./matrizAccion";

describe("resolveCell — pure function", () => {
  // ── Vender más (bajo riesgo + alta propensión) ───────────────────────────────

  it("returns 'vender' for BAJO + ALTA", () => {
    expect(resolveCell("BAJO", "ALTA")).toBe("vender");
  });

  it("returns 'vender' for MEDIO + ALTA", () => {
    expect(resolveCell("MEDIO", "ALTA")).toBe("vender");
  });

  // ── Reactivar (bajo riesgo + baja propensión) ────────────────────────────────

  it("returns 'reactivar' for BAJO + BAJA", () => {
    expect(resolveCell("BAJO", "BAJA")).toBe("reactivar");
  });

  it("returns 'reactivar' for BAJO + MEDIA", () => {
    expect(resolveCell("BAJO", "MEDIA")).toBe("reactivar");
  });

  it("returns 'reactivar' for MEDIO + MEDIA", () => {
    expect(resolveCell("MEDIO", "MEDIA")).toBe("reactivar");
  });

  it("returns 'reactivar' for MEDIO + BAJA", () => {
    expect(resolveCell("MEDIO", "BAJA")).toBe("reactivar");
  });

  // ── Enganche (alto riesgo + alta propensión) ─────────────────────────────────

  it("returns 'enganche' for ALTO + ALTA", () => {
    expect(resolveCell("ALTO", "ALTA")).toBe("enganche");
  });

  it("returns 'enganche' for CRITICO + ALTA", () => {
    expect(resolveCell("CRITICO", "ALTA")).toBe("enganche");
  });

  // ── No extender (alto riesgo + baja propensión) ───────────────────────────────

  it("returns 'noExtender' for ALTO + BAJA", () => {
    expect(resolveCell("ALTO", "BAJA")).toBe("noExtender");
  });

  it("returns 'noExtender' for ALTO + MEDIA", () => {
    expect(resolveCell("ALTO", "MEDIA")).toBe("noExtender");
  });

  it("returns 'noExtender' for CRITICO + BAJA", () => {
    expect(resolveCell("CRITICO", "BAJA")).toBe("noExtender");
  });

  it("returns 'noExtender' for CRITICO + MEDIA", () => {
    expect(resolveCell("CRITICO", "MEDIA")).toBe("noExtender");
  });

  // ── CELLS map completeness ───────────────────────────────────────────────────

  it("CELLS contains all four keys", () => {
    expect(Object.keys(CELLS)).toEqual(
      expect.arrayContaining(["vender", "reactivar", "enganche", "noExtender"]),
    );
  });

  it("each cell definition has label, sublabel and headline", () => {
    for (const cell of Object.values(CELLS)) {
      expect(typeof cell.label).toBe("string");
      expect(cell.label.length).toBeGreaterThan(0);
      expect(typeof cell.sublabel).toBe("string");
      expect(cell.sublabel.length).toBeGreaterThan(0);
      expect(typeof cell.headline).toBe("string");
      expect(cell.headline.length).toBeGreaterThan(0);
    }
  });
});
