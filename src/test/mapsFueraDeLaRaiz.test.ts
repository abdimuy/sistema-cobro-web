// Antes, <LoadScript> de Google Maps envolvía toda la app en App.tsx: hasta
// que Maps cargaba, la ventana entera mostraba sólo "Loading...", y si fallaba
// (sin red tras el reposo, recarga del WebView) se quedaba así, sin reintento.
// Ahora cada mapa carga Maps por su cuenta (src/components/maps/MapaConCarga).
// Esta prueba impide que un cargador de Maps vuelva a la raíz.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CARGADORES = /\b(LoadScript|LoadScriptNext|useJsApiLoader|useLoadScript)\b/;

describe("Google Maps fuera de la raíz", () => {
  it.each(["App.tsx", "main.tsx"])("%s no carga Google Maps", (archivo) => {
    const fuente = readFileSync(join(__dirname, "..", archivo), "utf8");
    expect(fuente).not.toMatch(CARGADORES);
  });

  it("control positivo: el patrón reconoce el <LoadScript> de antes", () => {
    expect('<LoadScript googleMapsApiKey="x">').toMatch(CARGADORES);
  });
});
