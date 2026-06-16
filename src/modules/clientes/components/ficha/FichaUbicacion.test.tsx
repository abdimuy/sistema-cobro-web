import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Suspense } from "react";
import type { UbicacionCliente } from "../../domain/entities";
import { FichaUbicacion } from "./FichaUbicacion";

// Mock @react-google-maps/api so tests don't hit the network or require an API key.
vi.mock("@react-google-maps/api", () => ({
  useLoadScript: vi.fn().mockReturnValue({ isLoaded: true, loadError: undefined }),
  GoogleMap: ({
    children,
    mapContainerStyle,
  }: {
    children?: React.ReactNode;
    mapContainerStyle?: React.CSSProperties;
  }) => (
    <div data-testid="google-map" style={mapContainerStyle}>
      {children}
    </div>
  ),
  Marker: ({ position }: { position: { lat: number; lng: number } }) => (
    <div data-testid="map-marker" data-lat={position.lat} data-lng={position.lng} />
  ),
}));

// Mock the lazy FichaMapEmbed to synchronous to avoid Suspense complexity in tests.
vi.mock("./FichaMapEmbed", () => ({
  FichaMapEmbed: ({ lat, lng }: { lat: number; lng: number }) => (
    <div data-testid="ficha-map-embed" data-lat={lat} data-lng={lng} />
  ),
}));

const WITH_LOCATION: UbicacionCliente = {
  lat: 19.4326,
  lng: -99.1332,
  disponible: true,
};

const WITHOUT_LOCATION: UbicacionCliente = {
  lat: 0,
  lng: 0,
  disponible: false,
};

function renderUbicacion(ubicacion: UbicacionCliente) {
  return render(
    <Suspense fallback={<div>cargando</div>}>
      <FichaUbicacion ubicacion={ubicacion} />
    </Suspense>,
  );
}

describe("FichaUbicacion", () => {
  it('renders section heading "Ubicación"', () => {
    renderUbicacion(WITH_LOCATION);
    expect(screen.getByText("Ubicación")).toBeInTheDocument();
  });

  it("renders map embed when disponible=true", () => {
    renderUbicacion(WITH_LOCATION);
    const embed = screen.getByTestId("ficha-map-embed");
    expect(embed).toBeInTheDocument();
    expect(embed).toHaveAttribute("data-lat", "19.4326");
    expect(embed).toHaveAttribute("data-lng", "-99.1332");
  });

  it('renders "Abrir en Google Maps" link when disponible=true', () => {
    renderUbicacion(WITH_LOCATION);
    const link = screen.getByRole("link", { name: /Abrir en Google Maps/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps?q=19.4326,-99.1332",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it('renders "Sin ubicación registrada" when disponible=false', () => {
    renderUbicacion(WITHOUT_LOCATION);
    expect(screen.getByText("Sin ubicación registrada")).toBeInTheDocument();
  });

  it('does not render map embed when disponible=false', () => {
    renderUbicacion(WITHOUT_LOCATION);
    expect(screen.queryByTestId("ficha-map-embed")).not.toBeInTheDocument();
  });

  it('does not render "Abrir en Google Maps" link when disponible=false', () => {
    renderUbicacion(WITHOUT_LOCATION);
    expect(
      screen.queryByRole("link", { name: /Abrir en Google Maps/i }),
    ).not.toBeInTheDocument();
  });
});

