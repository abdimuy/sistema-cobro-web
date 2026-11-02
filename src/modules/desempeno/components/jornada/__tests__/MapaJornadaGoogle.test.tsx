import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ESTILOS_CLAROS } from "@/components/maps/estilosDeMapa";
import { LLAVE_GOOGLE_MAPS } from "@/components/maps/cargadorGoogleMaps";
import { MapaJornadaGoogle } from "../MapaJornadaGoogle";

const cargarGoogleMaps = vi.fn();
vi.mock("@/components/maps/cargadorGoogleMaps", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/maps/cargadorGoogleMaps")>()),
  cargarGoogleMaps: (...args: unknown[]) => cargarGoogleMaps(...args),
}));
vi.mock("@/context/ThemeContext", () => ({ useTheme: () => ({ theme: "light" }) }));
vi.mock("@/lib/bitacora", () => ({ registrar: vi.fn() }));
vi.mock("@react-google-maps/api", () => ({
  GoogleMap: ({ children, options }: { children?: React.ReactNode; options?: unknown }) => (
    <div data-testid="google-map" data-options={JSON.stringify(options)}>{children}</div>
  ),
  PolylineF: () => <div data-testid="recorrido" />,
  MarkerF: ({ label }: { label: { text: string } }) => <div data-testid="punto">{label.text}</div>,
}));

const puntos = [
  { id: "a", n: 1, lat: 18.46, lng: -97.39 },
  { id: "b", n: 3, lat: 18.47, lng: -97.4 },
];

describe("MapaJornadaGoogle", () => {
  beforeEach(() => {
    cargarGoogleMaps.mockReset();
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("con la variable de Maps vacía pinta el recorrido con la llave de cargadorGoogleMaps", async () => {
    cargarGoogleMaps.mockResolvedValue(undefined);
    render(<MapaJornadaGoogle puntos={puntos} onSeleccionar={vi.fn()} />);
    expect(await screen.findByTestId("google-map")).toBeInTheDocument();
    expect(screen.getAllByTestId("punto").map((p) => p.textContent)).toEqual(["1", "3"]);
    expect(cargarGoogleMaps).toHaveBeenCalledWith(LLAVE_GOOGLE_MAPS);
    expect(screen.queryByText("Mapa no disponible")).not.toBeInTheDocument();
  });

  it("pasa los estilos del hook y apaga clickableIcons", async () => {
    cargarGoogleMaps.mockResolvedValue(undefined);
    render(<MapaJornadaGoogle puntos={puntos} onSeleccionar={vi.fn()} />);
    const opciones = JSON.parse((await screen.findByTestId("google-map")).dataset.options ?? "{}");
    expect(opciones.styles).toEqual(JSON.parse(JSON.stringify(ESTILOS_CLAROS)));
    expect(opciones.clickableIcons).toBe(false);
  });

  it("si el script falla dice que no cargó y ofrece Reintentar", async () => {
    cargarGoogleMaps.mockRejectedValue(new Error("sin red"));
    render(<MapaJornadaGoogle puntos={puntos} onSeleccionar={vi.fn()} />);
    expect(await screen.findByText("No se pudo cargar el mapa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});
