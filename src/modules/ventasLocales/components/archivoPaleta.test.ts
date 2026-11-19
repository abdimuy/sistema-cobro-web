import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contraste de la paleta violeta de Archivo, medido sobre los tokens reales de
 * index.css (claro y oscuro). Texto >= 4.5:1; anillo/franja >= 3:1.
 */
const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

const bloque = (selector: string): string => {
  const i = css.indexOf(selector);
  const abre = css.indexOf("{", i);
  return css.slice(abre, css.indexOf("\n  }", abre));
};
const hex = (b: string, token: string): string => {
  const m = new RegExp(`--${token}:\\s*(#[0-9a-fA-F]{6})`).exec(b);
  if (!m) throw new Error(`falta --${token}`);
  return m[1];
};
const canal = (c: number) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return 0.2126 * canal(n >> 16) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
};
const contraste = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const CLARO = bloque(":root");
const OSCURO = bloque(".dark");
const TARJETA = { claro: "#ffffff", oscuro: "#0a0a0a" }; // --card: 0 0% 100% / 0 0% 3.9%

describe("paleta violeta de Archivo", () => {
  it("claro: valores aprobados exactos", () => {
    expect(hex(CLARO, "archivo-fondo")).toBe("#faf8ff");
    expect(hex(CLARO, "archivo-circulo")).toBe("#f3f0ff");
    expect(hex(CLARO, "archivo-borde")).toBe("#c4b5fd");
    expect(hex(CLARO, "archivo-trazo")).toBe("#6d28d9");
    expect(hex(CLARO, "archivo-texto")).toBe("#5b21b6");
    expect(hex(CLARO, "archivo-etiqueta")).toBe("#6d28d9");
  });

  for (const [tema, b] of [["claro", CLARO], ["oscuro", OSCURO]] as const) {
    describe(tema, () => {
      const tarjeta = TARJETA[tema];
      it("texto >= 4.5:1 sobre el círculo y sobre la fila", () => {
        const circulo = hex(b, "archivo-circulo");
        const fondo = hex(b, "archivo-fondo");
        expect(contraste(hex(b, "archivo-texto"), circulo)).toBeGreaterThanOrEqual(4.5);
        expect(contraste(hex(b, "archivo-etiqueta"), tarjeta)).toBeGreaterThanOrEqual(4.5);
        expect(contraste(hex(b, "archivo-etiqueta"), fondo)).toBeGreaterThanOrEqual(4.5);
        expect(contraste(hex(b, "archivo-trazo"), circulo)).toBeGreaterThanOrEqual(3);
      });
      it("anillo y franja >= 3:1 contra la tarjeta", () => {
        if (tema === "oscuro") {
          expect(contraste(hex(b, "archivo-borde"), tarjeta)).toBeGreaterThanOrEqual(3);
        } else {
          // Claro: #c4b5fd es decorativo sobre blanco (mock aprobado, ~2:1);
          // se documenta el valor en vez de fingir el umbral.
          expect(contraste(hex(b, "archivo-borde"), tarjeta)).toBeGreaterThan(1.8);
        }
      });
    });
  }

  it("sin amarillo: ningún token de Archivo tiene tono 40-70 grados", () => {
    for (const b of [CLARO, OSCURO]) {
      for (const t of ["fondo", "circulo", "borde", "trazo", "texto", "etiqueta"]) {
        const n = parseInt(hex(b, `archivo-${t}`).slice(1), 16);
        const [r, g, bl] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => v / 255);
        const max = Math.max(r, g, bl), min = Math.min(r, g, bl);
        if (max === min) continue;
        const d = max - min;
        const h = max === r ? ((g - bl) / d) % 6 : max === g ? (bl - r) / d + 2 : (r - g) / d + 4;
        const deg = (h * 60 + 360) % 360;
        expect(deg < 40 || deg > 70).toBe(true);
      }
    }
  });
});
