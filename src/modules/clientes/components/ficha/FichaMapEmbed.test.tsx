import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ESTILOS_CLAROS } from "@/components/maps/estilosDeMapa";
import { LLAVE_GOOGLE_MAPS } from "@/components/maps/cargadorGoogleMaps";
import { FichaMapEmbed } from "./FichaMapEmbed";

// Sólo se sustituye la descarga del script; obtenerLlaveGoogleMaps es la real,
// para comprobar qué llave recibe el cargador con la variable vacía.
const cargarGoogleMaps = vi.fn();
vi.mock("@/components/maps/cargadorGoogleMaps", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/maps/cargadorGoogleMaps")>()),
  cargarGoogleMaps: (...args: unknown[]) => cargarGoogleMaps(...args),
}));
vi.mock("@/context/ThemeContext", () => ({ useTheme: () => ({ theme: "light" }) }));
vi.mock("@/lib/bitacora", () => ({ registrar: vi.fn() }));
vi.mock("@react-google-maps/api", () => ({
  GoogleMap: ({
    children,
    mapContainerStyle,
    options,
  }: {
    options?: unknown;
    children?: React.ReactNode;
    mapContainerStyle?: React.CSSProperties;
  }) => (
    <div data-testid="google-map" style={mapContainerStyle} data-options={JSON.stringify(options)}>
      {children}
    </div>
  ),
  Marker: ({ position }: { position: { lat: number; lng: number } }) => (
    <div data-testid="map-marker" data-lat={position.lat} data-lng={position.lng} />
  ),
}));

describe("FichaMapEmbed", () => {
  beforeEach(() => {
    cargarGoogleMaps.mockReset();
    // Como en .env.production / .env.development: la variable viene vacía.
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("con la variable vacía pide Maps con la llave de cargadorGoogleMaps y pinta el mapa", async () => {
    cargarGoogleMaps.mockResolvedValue(undefined);
    render(<FichaMapEmbed lat={19.4326} lng={-99.1332} />);
    expect(await screen.findByTestId("google-map")).toBeInTheDocument();
    expect(screen.getByTestId("map-marker")).toHaveAttribute("data-lat", "19.4326");
    expect(cargarGoogleMaps).toHaveBeenCalledWith(LLAVE_GOOGLE_MAPS);
    expect(screen.queryByText("Mapa no disponible")).not.toBeInTheDocument();
  });

  it("muestra 'Cargando mapa…' mientras el script carga", () => {
    cargarGoogleMaps.mockReturnValue(new Promise<void>(() => {}));
    render(<FichaMapEmbed lat={19.4326} lng={-99.1332} />);
    expect(screen.getByText("Cargando mapa…")).toBeInTheDocument();
    expect(screen.queryByTestId("google-map")).not.toBeInTheDocument();
  });

  it("si el script falla ofrece Reintentar y al reintentar pinta el mapa", async () => {
    cargarGoogleMaps.mockRejectedValueOnce(new Error("sin red")).mockResolvedValueOnce(undefined);
    render(<FichaMapEmbed lat={19.4326} lng={-99.1332} />);
    await userEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByTestId("google-map")).toBeInTheDocument();
  });

  it("pasa los estilos del hook y apaga clickableIcons", async () => {
    cargarGoogleMaps.mockResolvedValue(undefined);
    render(<FichaMapEmbed lat={19.4326} lng={-99.1332} />);
    const opciones = JSON.parse((await screen.findByTestId("google-map")).dataset.options ?? "{}");
    expect(opciones.styles).toEqual(JSON.parse(JSON.stringify(ESTILOS_CLAROS)));
    expect(opciones.clickableIcons).toBe(false);
  });
});
