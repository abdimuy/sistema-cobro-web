import { describe, expect, it } from "vitest";
import { rowBackground } from "../rowBackground";

describe("rowBackground", () => {
  it("la app conserva sus tres estados", () => {
    expect(rowBackground(false, false)).toBe("hsl(var(--card))");
    expect(rowBackground(true, false)).toBe("hsl(var(--muted))");
    expect(rowBackground(false, true)).toBe("hsl(var(--accent))");
  });

  it("Archivo tiene tono propio y conserva el hover de la app", () => {
    expect(rowBackground(false, false, true)).toBe("hsl(var(--fila-archivo))");
    expect(rowBackground(true, false, true)).toBe("hsl(var(--fila-archivo))");
    expect(rowBackground(false, true, true)).toBe("hsl(var(--accent))");
    expect(rowBackground(false, false, true)).not.toBe(rowBackground(false, false));
  });
});
