import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { ESTILOS_CLAROS } from "@/components/maps/estilosDeMapa";
import { LLAVE_GOOGLE_MAPS } from "@/components/maps/cargadorGoogleMaps";
import { MapaJornadaGoogle, type PuntoMapa } from "../MapaJornadaGoogle";

const cargarGoogleMaps = vi.fn();
const fitBounds = vi.fn();
vi.mock("@/components/maps/cargadorGoogleMaps", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/maps/cargadorGoogleMaps")>()),
  cargarGoogleMaps: (...args: unknown[]) => cargarGoogleMaps(...args),
}));
vi.mock("@/context/ThemeContext", () => ({ useTheme: () => ({ theme: "light" }) }));
vi.mock("@/lib/bitacora", () => ({ registrar: vi.fn() }));
vi.mock("@react-google-maps/api", () => ({
  GoogleMap: ({
    children,
    options,
    onLoad,
  }: {
    children?: React.ReactNode;
    options?: unknown;
    onLoad?: (m: unknown) => void;
  }) => {
    useEffect(() => onLoad?.({ fitBounds }), [onLoad]);
    return (
      <div data-testid="google-map" data-options={JSON.stringify(options)}>
        {children}
      </div>
    );
  },
  PolylineF: ({ options }: { options: { strokeOpacity: number } }) => (
    <div data-testid="segmento" data-opacidad={options.strokeOpacity} />
  ),
  MarkerF: ({
    title,
    icon,
    label,
    onMouseOver,
    onMouseOut,
  }: {
    title?: string;
    icon: { scale: number; fillColor: string };
    label?: { text: string };
    onMouseOver?: () => void;
    onMouseOut?: () => void;
  }) => (
    <div
      data-testid={label ? "extremo" : "punto"}
      title={title}
      data-color={icon.fillColor}
      data-escala={icon.scale}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
    >
      {label?.text}
    </div>
  ),
}));

const base = { tipo: "Pago", cliente: "Ana Pérez" };
const puntos: PuntoMapa[] = [
  { ...base, id: "a", n: 1, lat: 18.46, lng: -97.39, categoria: "pago", hora: "08:10" },
  { ...base, id: "b", n: 2, lat: 18.47, lng: -97.4, categoria: "visita", hora: "09:00" },
  { ...base, id: "c", n: 3, lat: 18.48, lng: -97.41, categoria: "no_pago", hora: "17:45" },
];

describe("MapaJornadaGoogle", () => {
  beforeEach(() => {
    cargarGoogleMaps.mockReset();
    fitBounds.mockReset();
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "");
    const raiz = document.documentElement.style;
    raiz.setProperty("--dsm-ok", "150 66% 27%");
    raiz.setProperty("--dsm-ambar", "35 100% 30%");
    raiz.setProperty("--dsm-rojo", "343 80% 35%");
    vi.stubGlobal("google", {
      maps: { LatLngBounds: class { extend() {} } },
    });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("con la variable de Maps vacía pinta el recorrido con la llave de cargadorGoogleMaps", async () => {
    cargarGoogleMaps.mockResolvedValue(undefined);
    render(<MapaJornadaGoogle puntos={puntos} onSeleccionar={vi.fn()} />);
    expect(await screen.findByTestId("google-map")).toBeInTheDocument();
    expect(screen.getAllByTestId("punto")).toHaveLength(3);
    expect(cargarGoogleMaps).toHaveBeenCalledWith(LLAVE_GOOGLE_MAPS);
    expect(screen.queryByText("Mapa no disponible")).not.toBeInTheDocument();
  });

  it("pinta cada punto con el color de su categoría (tokens del tema)", async () => {
    cargarGoogleMaps.mockResolvedValue(undefined);
    render(<MapaJornadaGoogle puntos={puntos} onSeleccionar={vi.fn()} />);
    const circulos = await screen.findAllByTestId("punto");
    expect(circulos.map((c) => c.dataset.color)).toEqual([
      "hsl(150, 66%, 27%)",
      "hsl(35, 100%, 30%)",
      "hsl(343, 80%, 35%)",
    ]);
  });

  it("sólo Inicio y Fin llevan etiqueta con su hora, y no hay números fijos", async () => {
    cargarGoogleMaps.mockResolvedValue(undefined);
    render(<MapaJornadaGoogle puntos={puntos} onSeleccionar={vi.fn()} />);
    const extremos = await screen.findAllByTestId("extremo");
    expect(extremos.map((e) => e.textContent)).toEqual(["Inicio 08:10", "Fin 17:45"]);
    for (const c of screen.getAllByTestId("punto")) expect(c.textContent).toBe("");
    // El número sólo vive en el tooltip.
    expect(screen.getAllByTestId("punto")[1]).toHaveAttribute("title", "2 · 09:00 · Pago · Ana Pérez");
  });

  it("une los puntos en orden con opacidad creciente", async () => {
    cargarGoogleMaps.mockResolvedValue(undefined);
    render(<MapaJornadaGoogle puntos={puntos} onSeleccionar={vi.fn()} />);
    const ops = (await screen.findAllByTestId("segmento")).map((s) => Number(s.dataset.opacidad));
    expect(ops).toHaveLength(2);
    expect(ops[0]).toBeLessThan(ops[1]);
  });

  it("el punto enfocado se agranda y el hover del punto avisa al padre", async () => {
    cargarGoogleMaps.mockResolvedValue(undefined);
    const onEnfocar = vi.fn();
    render(<MapaJornadaGoogle puntos={puntos} onSeleccionar={vi.fn()} enfocada="b" onEnfocar={onEnfocar} />);
    const circulos = await screen.findAllByTestId("punto");
    expect(circulos.map((c) => c.dataset.escala)).toEqual(["5", "9", "5"]);
    fireEvent.mouseOver(circulos[2]);
    expect(onEnfocar).toHaveBeenCalledWith("c");
    fireEvent.mouseOut(circulos[2]);
    expect(onEnfocar).toHaveBeenLastCalledWith(null);
  });

  it("ajusta el encuadre (fitBounds con padding) al cargar", async () => {
    cargarGoogleMaps.mockResolvedValue(undefined);
    render(<MapaJornadaGoogle puntos={puntos} onSeleccionar={vi.fn()} />);
    await screen.findByTestId("google-map");
    expect(fitBounds).toHaveBeenCalledWith(expect.anything(), 48);
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
