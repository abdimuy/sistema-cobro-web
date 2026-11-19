import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PALETA_COINCIDENCIA, contraste } from "./paleta";

const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

describe("paleta de coincidencia", () => {
  it("cada par texto/fondo cumple contraste >= 4.5 en claro y oscuro", () => {
    for (const modo of ["claro", "oscuro"] as const) {
      const p = PALETA_COINCIDENCIA[modo];
      expect(contraste(p.exacta.fg, p.exacta.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(p.aprox.fg, p.card)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(p.aprox.linea, p.card)).toBeGreaterThanOrEqual(3);
      expect(contraste(p.chip.fg, p.card)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("la paleta clara es la del spec", () => {
    const c = PALETA_COINCIDENCIA.claro;
    expect([
      c.exacta.bg,
      c.exacta.fg,
      c.aprox.fg,
      c.aprox.linea,
      c.chip.borde,
      c.chip.fg,
    ]).toEqual([
      "#dbeafe",
      "#1e3a8a",
      "#1e40af",
      "#2563eb",
      "#93c5fd",
      "#1e40af",
    ]);
  });

  it("index.css declara los mismos hex y no usa amarillo", () => {
    const todos = Object.values(PALETA_COINCIDENCIA).flatMap((p) => [
      p.exacta.bg,
      p.exacta.fg,
      p.aprox.fg,
      p.aprox.linea,
      p.chip.borde,
      p.chip.fg,
    ]);
    for (const hex of todos) expect(css.toLowerCase()).toContain(hex);
    expect(css).not.toContain("#fde");
    expect(css.toLowerCase()).not.toContain("yellow");
  });

  it("index.css anula las animaciones de coincidencia bajo prefers-reduced-motion", () => {
    const bloques = css
      .split(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
      .slice(1);
    const propio = bloques.find(
      (b) => b.includes(".coincide") && b.includes(".fila-aparece"),
    );
    expect(propio).toBeDefined();
    expect(propio).toMatch(/animation:\s*none/);
  });
});
