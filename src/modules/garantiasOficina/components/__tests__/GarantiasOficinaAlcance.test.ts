import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Alcance de Garantías Oficina", () => {
  it("no incorpora la entrega con firma de campo", () => {
    const ruta = resolve(
      process.cwd(),
      "src/modules/garantiasOficina/components/GarantiasOficinaScreen.tsx",
    );

    const pantalla = readFileSync(ruta, "utf8");

    expect(pantalla).not.toMatch(/<EntregaGarantiaForm\b/);
    expect(pantalla).not.toMatch(
      /import\s*\{\s*EntregaGarantiaForm\s*\}/,
    );
  });
});
