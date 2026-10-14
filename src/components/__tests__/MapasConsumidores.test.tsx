// Los dos componentes de mapa que usan las pantallas (Map: Inicio y Ventas;
// MapSimple: pestaña Ubicación del detalle de venta local) ya no dependen de
// un <LoadScript> en la raíz: cada uno pide Maps por su cuenta, con texto de
// carga en español y reintento si falla.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cargarGoogleMaps = vi.fn();
vi.mock("@/components/maps/cargadorGoogleMaps", () => ({
  cargarGoogleMaps: (...args: unknown[]) => cargarGoogleMaps(...args),
  LLAVE_GOOGLE_MAPS: "llave",
}));
vi.mock("@/lib/bitacora", () => ({ registrar: vi.fn() }));
vi.mock("@react-google-maps/api", () => ({
  GoogleMap: (props: { center: { lat: number; lng: number } }) => (
    <div data-testid="google-map">
      {props.center.lat},{props.center.lng}
    </div>
  ),
}));
vi.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" }),
}));

import MapaPuntos from "../Map";
import MapSimple from "../MapSimple";

const punto = { lat: 18.46, lng: -97.39 };

describe.each([
  ["Map", () => <MapaPuntos points={[punto]} />],
  ["MapSimple", () => <MapSimple point={punto} />],
])("%s", (_nombre, crear) => {
  // Una carga pendiente se libera al terminar cada prueba: dejar una promesa
  // que nunca se resuelve colgaba al runner al pasar a la siguiente prueba.
  let liberar = () => {};
  beforeEach(() => cargarGoogleMaps.mockReset());
  afterEach(() => liberar());

  it("muestra 'Cargando mapa…' y no el mapa mientras Maps carga", () => {
    cargarGoogleMaps.mockReturnValue(new Promise<void>((r) => (liberar = r)));
    render(crear());
    expect(screen.getByText("Cargando mapa…")).toBeInTheDocument();
    expect(screen.queryByTestId("google-map")).not.toBeInTheDocument();
  });

  it("pinta el mapa centrado en el punto cuando Maps carga", async () => {
    cargarGoogleMaps.mockResolvedValue(undefined);
    render(crear());
    expect(await screen.findByTestId("google-map")).toHaveTextContent("18.46,-97.39");
  });

  it("si Maps falla ofrece Reintentar y al reintentar pinta el mapa", async () => {
    cargarGoogleMaps
      .mockRejectedValueOnce(new Error("sin red"))
      .mockResolvedValueOnce(undefined);
    render(crear());
    await userEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByTestId("google-map")).toBeInTheDocument();
  });
});

describe("Map sin puntos", () => {
  it("no pinta nada ni pide Maps", () => {
    cargarGoogleMaps.mockReset();
    const { container } = render(<MapaPuntos points={[]} />);
    expect(container).toBeEmptyDOMElement();
    expect(cargarGoogleMaps).not.toHaveBeenCalled();
  });
});
