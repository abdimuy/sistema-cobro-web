import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cargarGoogleMaps = vi.fn();
vi.mock("../cargadorGoogleMaps", () => ({
  cargarGoogleMaps: (...args: unknown[]) => cargarGoogleMaps(...args),
  LLAVE_GOOGLE_MAPS: "llave-de-prueba",
}));
const registrar = vi.fn();
vi.mock("@/lib/bitacora", () => ({
  registrar: (...args: unknown[]) => registrar(...args),
}));

import { MapaConCarga } from "../MapaConCarga";

function diferida() {
  let resolver!: () => void;
  let rechazar!: (e: Error) => void;
  const promesa = new Promise<void>((res, rej) => {
    resolver = res;
    rechazar = rej;
  });
  return { promesa, resolver, rechazar };
}

describe("MapaConCarga", () => {
  beforeEach(() => {
    cargarGoogleMaps.mockReset();
    registrar.mockReset();
  });

  it("muestra 'Cargando mapa…' mientras Maps carga, y no el mapa", () => {
    cargarGoogleMaps.mockReturnValue(new Promise(() => {}));
    render(
      <MapaConCarga>
        <p>el mapa</p>
      </MapaConCarga>,
    );
    expect(screen.getByText("Cargando mapa…")).toBeInTheDocument();
    expect(screen.queryByText("el mapa")).not.toBeInTheDocument();
    expect(cargarGoogleMaps).toHaveBeenCalledWith("llave-de-prueba");
  });

  it("muestra el mapa cuando Maps termina de cargar", async () => {
    cargarGoogleMaps.mockResolvedValue(undefined);
    render(
      <MapaConCarga>
        <p>el mapa</p>
      </MapaConCarga>,
    );
    expect(await screen.findByText("el mapa")).toBeInTheDocument();
  });

  it("si falla avisa en español, lo registra, y Reintentar vuelve a cargar", async () => {
    const primera = diferida();
    const segunda = diferida();
    cargarGoogleMaps
      .mockReturnValueOnce(primera.promesa)
      .mockReturnValueOnce(segunda.promesa);

    render(
      <MapaConCarga>
        <p>el mapa</p>
      </MapaConCarga>,
    );
    primera.rechazar(new Error("red caída"));
    expect(await screen.findByText("No se pudo cargar el mapa")).toBeInTheDocument();
    expect(registrar).toHaveBeenCalledWith("warn", expect.stringContaining("red caída"));

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(cargarGoogleMaps).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Cargando mapa…")).toBeInTheDocument();

    segunda.resolver();
    expect(await screen.findByText("el mapa")).toBeInTheDocument();
  });
});
