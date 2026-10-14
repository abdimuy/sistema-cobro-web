// Guarda de fronteras entre módulos: un módulo sólo entra a Ventas Locales o
// a Clientes por su índice público (`@/modules/ventasLocales`,
// `@/modules/clientes`), nunca a sus archivos internos. Así cada módulo puede
// reorganizar sus capas sin romper a los demás.
//
// Alcance: código de producción bajo src/modules/*. Las pruebas quedan fuera
// a propósito: `vi.mock` necesita la ruta exacta del archivo que sustituye, y
// los fakes de prueba (fakeClientesPort) no pertenecen al índice público.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");
const MODULOS = join(SRC, "modules");
const PROTEGIDOS = ["ventasLocales", "clientes"];

function esPrueba(ruta: string): boolean {
  return /\.test\.tsx?$/.test(ruta) || ruta.split(sep).includes("__tests__");
}

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /\.tsx?$/.test(nombre) && !esPrueba(ruta) ? [ruta] : [];
  });
}

// Especificadores de `import ... from`, `export ... from`, `import "x"` e
// `import("x")`. El cuerpo entre `import` y `from` puede ocupar varias líneas.
const ESPECIFICADOR =
  /\b(?:import|export)\s[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|\bimport\s+['"]([^'"]+)['"]/g;

function especificadores(fuente: string): string[] {
  return [...fuente.matchAll(ESPECIFICADOR)].map((m) => m[1] ?? m[2] ?? m[3]);
}

function moduloDe(rutaAbsoluta: string): string[] {
  const rel = relative(MODULOS, rutaAbsoluta);
  if (rel.startsWith("..")) return [];
  return rel.split(sep);
}

// Devuelve los especificadores de `fuente` (escrita en `archivo`, ruta
// absoluta) que entran a un archivo interno de un módulo protegido ajeno.
function violaciones(archivo: string, fuente: string): string[] {
  const [propio] = moduloDe(archivo);
  return especificadores(fuente).filter((spec) => {
    let destino: string;
    if (spec.startsWith("@/")) destino = join(SRC, spec.slice(2));
    else if (spec.startsWith(".")) destino = resolve(dirname(archivo), spec);
    else return false;
    const partes = moduloDe(destino);
    const [modulo, ...resto] = partes;
    if (!modulo || !PROTEGIDOS.includes(modulo) || modulo === propio) return false;
    const esIndice = resto.length === 0 || (resto.length === 1 && /^index(\.tsx?)?$/.test(resto[0]));
    return !esIndice;
  });
}

function barrido(): string[] {
  return archivos(MODULOS).flatMap((f) =>
    violaciones(f, readFileSync(f, "utf8")).map((spec) => `${relative(SRC, f)} -> ${spec}`),
  );
}

describe("fronteras entre módulos", () => {
  const enDesempeno = join(MODULOS, "desempeno", "components", "X.tsx");

  it("control positivo: reconoce rutas internas con alias, relativas y en varias líneas", () => {
    const fuente = [
      'import AuthenticatedImage from "@/modules/ventasLocales/components/detalle/AuthenticatedImage";',
      'import type {\n  Cliente,\n} from "../../clientes/domain/entities";',
      'export { Panel } from "@/modules/clientes/components/ficha/lib/Panel";',
      'const L = lazy(() => import("@/modules/ventasLocales/VentasLocales"));',
    ].join("\n");
    expect(violaciones(enDesempeno, fuente)).toEqual([
      "@/modules/ventasLocales/components/detalle/AuthenticatedImage",
      "../../clientes/domain/entities",
      "@/modules/clientes/components/ficha/lib/Panel",
      "@/modules/ventasLocales/VentasLocales",
    ]);
  });

  it("control negativo: el índice público y las rutas del propio módulo se permiten", () => {
    const fuente = [
      'import { AuthenticatedImage } from "@/modules/ventasLocales";',
      'import { ClienteFicha } from "@/modules/clientes/index";',
      'import { algo } from "../domain/algo";',
    ].join("\n");
    expect(violaciones(enDesempeno, fuente)).toEqual([]);
    const enClientes = join(MODULOS, "clientes", "components", "detalle", "PagoFotos.tsx");
    expect(violaciones(enClientes, 'import { x } from "@/modules/clientes/domain/entities";')).toEqual([]);
  });

  it("control positivo sobre el árbol real: el barrido lee los imports de verdad", () => {
    const usanIndiceDeClientes = archivos(MODULOS).filter((f) =>
      especificadores(readFileSync(f, "utf8")).includes("@/modules/clientes"),
    );
    expect(usanIndiceDeClientes.map((f) => relative(SRC, f))).toContain(
      join("modules", "desempeno", "Desempeno.tsx"),
    );
  });

  it("ningún módulo entra a archivos internos de ventasLocales o clientes", () => {
    expect(barrido()).toEqual([]);
  });
});
