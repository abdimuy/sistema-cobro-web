import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the hook so tests don't hit the network.
vi.mock("@/hooks/useGetZonasCliente", () => ({
  default: vi.fn(),
}));

import useGetZonasCliente from "@/hooks/useGetZonasCliente";
import ZonaMismatchBanner from "./ZonaMismatchBanner";

const mockUseGetZonasCliente = vi.mocked(useGetZonasCliente);

const ZONAS = [
  { ZONA_CLIENTE_ID: 1, ZONA_CLIENTE: "NORTE" },
  { ZONA_CLIENTE_ID: 2, ZONA_CLIENTE: "SUR" },
];

function makeGetZonaById(zonas: typeof ZONAS) {
  return (id: number) => zonas.find((z) => z.ZONA_CLIENTE_ID === id);
}

beforeEach(() => {
  mockUseGetZonasCliente.mockReset();
  mockUseGetZonasCliente.mockReturnValue({
    zonas: ZONAS,
    loading: false,
    error: null,
    getZonaById: makeGetZonaById(ZONAS),
    refetch: vi.fn().mockResolvedValue(undefined),
  });
});

describe("ZonaMismatchBanner", () => {
  it("shows the warning label", () => {
    render(<ZonaMismatchBanner ventaZonaId={1} microsipZonaId={2} />);
    expect(screen.getByText(/zona no coincide/i)).toBeInTheDocument();
  });

  it("resolves zona names from the hook", () => {
    render(<ZonaMismatchBanner ventaZonaId={1} microsipZonaId={2} />);
    expect(screen.getByText("NORTE")).toBeInTheDocument();
    expect(screen.getByText("SUR")).toBeInTheDocument();
  });

  it("falls back to 'Zona {id}' when zona not found in list", () => {
    render(<ZonaMismatchBanner ventaZonaId={99} microsipZonaId={88} />);
    expect(screen.getByText("Zona 99")).toBeInTheDocument();
    expect(screen.getByText("Zona 88")).toBeInTheDocument();
  });

  it("shows 'Sin zona' for null ids", () => {
    render(<ZonaMismatchBanner ventaZonaId={null} microsipZonaId={null} />);
    expect(screen.getAllByText("Sin zona").length).toBe(2);
  });

  it("shows 'Sin zona' for undefined ids", () => {
    render(<ZonaMismatchBanner ventaZonaId={undefined} microsipZonaId={undefined} />);
    expect(screen.getAllByText("Sin zona").length).toBe(2);
  });
});
