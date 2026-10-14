import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// D3: el Inicio viejo ("Pagos y visitas", servicio Node sin token) se retiró.
// Esta prueba barre src/ y falla si alguien lo vuelve a traer.
const RAIZ = join(__dirname, "../../..");
const ESTE_ARCHIVO = relative(RAIZ, __filename);

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /\.(ts|tsx)$/.test(n) ? [ruta] : [];
  });
}

function referenciasA(patron: RegExp): string[] {
  return archivos(RAIZ)
    .filter((f) => relative(RAIZ, f) !== ESTE_ARCHIVO)
    .filter((f) => patron.test(readFileSync(f, "utf8")))
    .map((f) => relative(RAIZ, f));
}

describe("sin el Inicio viejo", () => {
  it("control positivo: el barrido sí encuentra lo que busca", () => {
    expect(referenciasA(/modules\/inicio\/Inicio/)).toContain("App.tsx");
  });

  it("nadie importa modules/home ni getPagosAndVisitas", () => {
    expect(referenciasA(/modules\/home\b|getPagosAndVisitas/)).toEqual([]);
  });

  it("nadie llama a la ruta Node /visitas/pagos-visitas", () => {
    expect(referenciasA(/pagos-visitas/)).toEqual([]);
  });

  it("el mapa de puntos que usaba Home sigue vivo para Ventas", () => {
    expect(referenciasA(/components\/Map["']/)).toContain("modules/sales/Sales.tsx");
  });
});
