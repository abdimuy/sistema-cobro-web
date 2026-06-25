import { describe, expect, it } from "vitest";
import {
  semaphoreLevel,
  semaphoreConfig,
  aporteFillRatio,
  catchUpMarker,
  pctBarWidth,
  pctOverflowMarker,
  formatVentanaDesde,
  formatVentanaDias,
} from "../desgloseUx";
import { makeFakeVentaCobranza } from "../../../application/__tests__/fakeRutasPort";

describe("semaphoreLevel", () => {
  it("green cuando aporte >= 1 y aplica", () => {
    const v = makeFakeVentaCobranza({ aporte: "1.00", aplicaPonderado: true });
    expect(semaphoreLevel(v)).toBe("green");
  });

  it("green cuando aporte > 1 (catch-up)", () => {
    const v = makeFakeVentaCobranza({ aporte: "2.50", aplicaPonderado: true });
    expect(semaphoreLevel(v)).toBe("green");
  });

  it("amber cuando 0 < aporte < 1 y aplica", () => {
    const v = makeFakeVentaCobranza({ aporte: "0.50", aplicaPonderado: true });
    expect(semaphoreLevel(v)).toBe("amber");
  });

  it("red cuando aporte == 0 y aplica", () => {
    const v = makeFakeVentaCobranza({ aporte: "0", aplicaPonderado: true });
    expect(semaphoreLevel(v)).toBe("red");
  });

  it("neutral cuando no aplica (sin importar aporte)", () => {
    const v = makeFakeVentaCobranza({ aporte: "1.00", aplicaPonderado: false });
    expect(semaphoreLevel(v)).toBe("neutral");
  });
});

describe("semaphoreConfig", () => {
  it("expone clases emerald para green", () => {
    const v = makeFakeVentaCobranza({ aporte: "1.00", aplicaPonderado: true });
    const cfg = semaphoreConfig(v);
    expect(cfg.level).toBe("green");
    expect(cfg.text).toContain("emerald");
    expect(cfg.label).toBe("Cubrió");
  });

  it("expone clases amber para parcial", () => {
    const v = makeFakeVentaCobranza({ aporte: "0.30", aplicaPonderado: true });
    const cfg = semaphoreConfig(v);
    expect(cfg.text).toContain("amber");
    expect(cfg.label).toBe("Parcial");
  });

  it("expone clases red para sin pago", () => {
    const v = makeFakeVentaCobranza({ aporte: "0", aplicaPonderado: true });
    const cfg = semaphoreConfig(v);
    expect(cfg.text).toContain("red");
    expect(cfg.label).toBe("Sin pago");
  });

  it("expone label No aplica para neutral", () => {
    const v = makeFakeVentaCobranza({ aplicaPonderado: false });
    const cfg = semaphoreConfig(v);
    expect(cfg.level).toBe("neutral");
    expect(cfg.label).toBe("No aplica");
  });
});

describe("aporteFillRatio", () => {
  it("clamp a [0,1]", () => {
    expect(aporteFillRatio("0")).toBe(0);
    expect(aporteFillRatio("0.5")).toBe(0.5);
    expect(aporteFillRatio("1")).toBe(1);
    expect(aporteFillRatio("3.2")).toBe(1);
  });

  it("valor inválido → 0", () => {
    expect(aporteFillRatio("abc")).toBe(0);
  });
});

describe("catchUpMarker", () => {
  it("null cuando aporte <= 1", () => {
    expect(catchUpMarker("1")).toBeNull();
    expect(catchUpMarker("0.5")).toBeNull();
  });

  it("×N cuando aporte > 1", () => {
    expect(catchUpMarker("2")).toBe("×2");
    expect(catchUpMarker("2.5")).toBe("×2.5");
  });
});

describe("pctBarWidth", () => {
  it("clamp a 100 y null → 0", () => {
    expect(pctBarWidth(null)).toBe(0);
    expect(pctBarWidth("50")).toBe(50);
    expect(pctBarWidth("120")).toBe(100);
  });
});

describe("pctOverflowMarker", () => {
  it("null cuando pct <= 100", () => {
    expect(pctOverflowMarker(null)).toBeNull();
    expect(pctOverflowMarker("100")).toBeNull();
    expect(pctOverflowMarker("89.5")).toBeNull();
  });

  it("+X% cuando pct > 100", () => {
    expect(pctOverflowMarker("130")).toBe("+30%");
  });
});

describe("formatVentana", () => {
  it("desde DD-mmm", () => {
    expect(formatVentanaDesde("2026-06-16T00:00:00Z")).toMatch(/^desde \d{2}-/);
  });

  it("hace N d", () => {
    const out = formatVentanaDias(
      "2026-06-16T00:00:00Z",
      new Date("2026-06-22T00:00:00Z"),
    );
    expect(out).toBe("hace 6 d");
  });

  it("entrada inválida no rompe", () => {
    expect(formatVentanaDias("no-es-fecha")).toBe("");
  });
});
