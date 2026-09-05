import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const raiz = path.resolve(__dirname, "../..");
const leer = (rel: string) => readFileSync(path.resolve(raiz, rel), "utf-8");
const versionDelPaquete = (JSON.parse(leer("package.json")) as { version: string }).version;

// LA VERSIÓN VIVE EN UN SOLO SITIO, Y LOS DEMÁS TIENEN QUE COINCIDIR.
//
// Vivía escrita a mano en CINCO lugares: package.json, tauri.conf.json,
// Cargo.toml, Cargo.lock y `.env.production`. Dos se quedaron atrás sin que
// nada avisara:
//
//   - `.env.production` marcaba 1.21.0 mientras se publicaban la 1.22.0 y la
//     1.23.0, así que la barra lateral decía "v1.21.0" con la 1.23.0 corriendo
//     — justo el número que alguien mira para saber si ya actualizó.
//   - Cargo.lock se había quedado en 1.19.0, dos releases atrás.
//
// Lo que la app MUESTRA ya no se escribe: sale de package.json vía
// vite.config.ts. Lo que Tauri empaqueta sí sigue en sus archivos, así que
// estas pruebas los cotejan.

describe("la versión no se escribe en cinco lugares", () => {
  it(".env.production ya no define VITE_APP_VERSION", () => {
    const activo = leer(".env.production")
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("#"))
      .some((l) => l.includes("VITE_APP_VERSION"));

    expect(activo).toBe(false);
  });

  it("vite.config.ts deriva la versión de package.json", () => {
    const config = leer("vite.config.ts");
    expect(config).toContain("package.json");
    expect(config).toContain("__VERSION_DEL_PAQUETE__");
  });

  it("tauri.conf.json coincide con package.json", () => {
    const tauri = JSON.parse(leer("src-tauri/tauri.conf.json")) as { version: string };
    expect(tauri.version).toBe(versionDelPaquete);
  });

  it("Cargo.toml coincide con package.json", () => {
    const m = /^version = "([^"]+)"/m.exec(leer("src-tauri/Cargo.toml"));
    expect(m?.[1]).toBe(versionDelPaquete);
  });

  // Cargo.lock se quedó dos releases atrás sin que nada lo notara.
  it("Cargo.lock coincide con package.json", () => {
    const lock = leer("src-tauri/Cargo.lock");
    const m = /name = "sistema-muebles-san-pablo"\nversion = "([^"]+)"/.exec(lock);
    expect(m?.[1]).toBe(versionDelPaquete);
  });
});
