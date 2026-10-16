import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cargarGoogleMaps,
  LLAVE_GOOGLE_MAPS,
  NOMBRE_CALLBACK_MAPS,
  obtenerLlaveGoogleMaps,
  reiniciarCargadorGoogleMaps,
} from "../cargadorGoogleMaps";

type VentanaConMaps = Window & {
  google?: unknown;
  [NOMBRE_CALLBACK_MAPS]?: () => void;
};
const ventana = window as VentanaConMaps;

function scriptsDeMaps(): HTMLScriptElement[] {
  return Array.from(
    document.querySelectorAll<HTMLScriptElement>("script[data-msp-google-maps]"),
  );
}

describe("cargarGoogleMaps", () => {
  beforeEach(() => {
    reiniciarCargadorGoogleMaps();
    delete ventana.google;
  });
  afterEach(() => {
    reiniciarCargadorGoogleMaps();
    delete ventana.google;
  });

  it("inyecta un único script de Maps con la llave y resuelve cuando Google llama al callback", async () => {
    const promesa = cargarGoogleMaps("llave-123");
    const scripts = scriptsDeMaps();
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toContain("https://maps.googleapis.com/maps/api/js?");
    expect(scripts[0].src).toContain("key=llave-123");
    expect(scripts[0].src).toContain(`callback=${NOMBRE_CALLBACK_MAPS}`);

    ventana.google = { maps: {} };
    ventana[NOMBRE_CALLBACK_MAPS]!();
    await expect(promesa).resolves.toBeUndefined();
  });

  it("llamadas simultáneas comparten la misma carga", () => {
    const a = cargarGoogleMaps("k");
    const b = cargarGoogleMaps("k");
    expect(a).toBe(b);
    expect(scriptsDeMaps()).toHaveLength(1);
  });

  it("si Maps ya está en la ventana no inyecta nada", async () => {
    ventana.google = { maps: {} };
    await expect(cargarGoogleMaps("k")).resolves.toBeUndefined();
    expect(scriptsDeMaps()).toHaveLength(0);
  });

  it("si el script falla rechaza, lo retira, y la siguiente llamada vuelve a intentar", async () => {
    const primera = cargarGoogleMaps("k");
    scriptsDeMaps()[0].dispatchEvent(new Event("error"));
    await expect(primera).rejects.toThrow();
    expect(scriptsDeMaps()).toHaveLength(0);

    const segunda = cargarGoogleMaps("k");
    expect(segunda).not.toBe(primera);
    expect(scriptsDeMaps()).toHaveLength(1);
    ventana.google = { maps: {} };
    ventana[NOMBRE_CALLBACK_MAPS]!();
    await expect(segunda).resolves.toBeUndefined();
  });
});

describe("obtenerLlaveGoogleMaps", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("con la variable de entorno vacía (como en .env.production) devuelve la constante", () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "");
    expect(LLAVE_GOOGLE_MAPS.length).toBeGreaterThan(0);
    expect(obtenerLlaveGoogleMaps()).toBe(LLAVE_GOOGLE_MAPS);
  });

  it("con la variable sólo con espacios devuelve la constante", () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "   ");
    expect(obtenerLlaveGoogleMaps()).toBe(LLAVE_GOOGLE_MAPS);
  });

  it("con la variable con valor, gana la variable", () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", " llave-de-entorno ");
    expect(obtenerLlaveGoogleMaps()).toBe("llave-de-entorno");
  });
});
