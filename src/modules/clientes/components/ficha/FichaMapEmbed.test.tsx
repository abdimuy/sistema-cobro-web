import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaMapEmbed } from "./FichaMapEmbed";

// Mock @react-google-maps/api to avoid real network calls and SDK loading.
// We control isLoaded/loadError via the mock factory return value.
const mockUseLoadScript = vi.fn();
vi.mock("@react-google-maps/api", () => ({
  useLoadScript: (...args: unknown[]) => mockUseLoadScript(...args),
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
    <div
      data-testid="map-marker"
      data-lat={position.lat}
      data-lng={position.lng}
    />
  ),
}));

describe("FichaMapEmbed", () => {
  beforeEach(() => {
    mockUseLoadScript.mockReturnValue({ isLoaded: true, loadError: undefined });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders map and marker when script is loaded and key is present", () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "fake-key-123");
    render(<FichaMapEmbed lat={19.4326} lng={-99.1332} />);
    expect(screen.getByTestId("google-map")).toBeInTheDocument();
    expect(screen.getByTestId("map-marker")).toBeInTheDocument();
  });

  it("renders graceful fallback when API key is missing", () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "");
    render(<FichaMapEmbed lat={19.4326} lng={-99.1332} />);
    expect(screen.getByTestId("mapa-no-disponible")).toBeInTheDocument();
    expect(screen.getByText("Mapa no disponible")).toBeInTheDocument();
  });

  it("renders graceful fallback when loadError is set", () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "fake-key-123");
    mockUseLoadScript.mockReturnValue({
      isLoaded: false,
      loadError: new Error("network failure"),
    });
    render(<FichaMapEmbed lat={19.4326} lng={-99.1332} />);
    expect(screen.getByTestId("mapa-no-disponible")).toBeInTheDocument();
  });

  it("renders loading state when script not yet loaded", () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "fake-key-123");
    mockUseLoadScript.mockReturnValue({ isLoaded: false, loadError: undefined });
    render(<FichaMapEmbed lat={19.4326} lng={-99.1332} />);
    expect(screen.getByText("Cargando mapa…")).toBeInTheDocument();
  });
});
