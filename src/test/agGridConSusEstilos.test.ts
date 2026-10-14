// Guarda: toda pantalla que pinta una cuadrícula de ag-grid importa SU CSS.
//
// Las hojas de ag-grid se cargaban por casualidad desde el Inicio viejo
// (Home.tsx), que App importaba siempre. Al retirarlo, Ventas quedó con la
// cuadrícula sin estilos (0 reglas `.ag-root-wrapper` en el CSS compilado).
// Cada archivo con `AgGridReact` o una clase `ag-theme-*` trae los dos imports.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = join(__dirname, "..");
const HOJAS = ["ag-grid-community/styles/ag-grid.css", "ag-grid-community/styles/ag-theme-quartz.css"];

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n) ? [ruta] : [];
  });
}

const conCuadricula = archivos(RAIZ)
  .map((f) => ({ archivo: relative(RAIZ, f), texto: readFileSync(f, "utf8") }))
  .filter(({ texto }) => /AgGridReact|ag-theme-/.test(texto));

describe("ag-grid con sus estilos", () => {
  it("control positivo: encuentra la cuadrícula de Ventas", () => {
    expect(conCuadricula.map((c) => c.archivo)).toContain("modules/sales/Sales.tsx");
  });

  it.each(conCuadricula.map((c) => [c.archivo, c.texto]))("%s importa ag-grid.css y ag-theme-quartz.css", (_a, texto) => {
    for (const hoja of HOJAS) expect(texto).toContain(`import "${hoja}"`);
  });
});
