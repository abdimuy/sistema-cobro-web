import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/hooks/useGetZonasCliente", () => ({ default: vi.fn() }));
vi.mock("@/components/MapSimple", () => ({ default: () => null }));

import useGetZonasCliente from "@/hooks/useGetZonasCliente";
import { VentaV2 } from "@/services/api/ventaV2Types";
import VentaUbicacionTab from "./VentaUbicacionTab";

const mockUseGetZonasCliente = vi.mocked(useGetZonasCliente);

const ZONAS = [
  { ZONA_CLIENTE_ID: 1, ZONA_CLIENTE: "NORTE" },
  { ZONA_CLIENTE_ID: 2, ZONA_CLIENTE: "SUR" },
];

beforeEach(() => {
  mockUseGetZonasCliente.mockReset();
  mockUseGetZonasCliente.mockReturnValue({
    zonas: ZONAS,
    loading: false,
    error: null,
    getZonaById: (id: number) => ZONAS.find((z) => z.ZONA_CLIENTE_ID === id),
    refetch: vi.fn().mockResolvedValue(undefined),
  });
});

function makeVenta(zonaClienteId: number | null): VentaV2 {
  return {
    direccion: {
      calle: "Av. Reforma",
      numero_exterior: "123",
      colonia: "Centro",
      poblacion: "Tehuacán",
      ciudad: "Puebla",
      zona_cliente_id: zonaClienteId,
    },
    cliente: { referencia: "Casa azul" },
    gps: { latitud: 0, longitud: 0 },
  } as unknown as VentaV2;
}

describe("VentaUbicacionTab — campo Zona", () => {
  it("muestra el nombre de la zona resuelto por id", () => {
    render(<VentaUbicacionTab venta={makeVenta(1)} />);
    expect(screen.getByText("Zona")).toBeInTheDocument();
    expect(screen.getByText("NORTE")).toBeInTheDocument();
  });

  it("cae a 'Zona <id>' cuando el id no está en el catálogo", () => {
    render(<VentaUbicacionTab venta={makeVenta(99)} />);
    expect(screen.getByText("Zona 99")).toBeInTheDocument();
  });

  it("muestra '—' cuando la venta no tiene zona", () => {
    render(<VentaUbicacionTab venta={makeVenta(null)} />);
    expect(screen.getByText("Zona")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
