import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Catálogos remotos usados por ClienteTab (zonas/ciudades) — no son el objeto
// bajo prueba, se mockean en vacío para que el componente no dispare fetches.
vi.mock("@/hooks/useGetZonasCliente", () => ({
  default: () => ({ zonas: [], loading: false, error: null, getZonaById: () => undefined, refetch: vi.fn() }),
}));
vi.mock("@/hooks/useGetCiudades", () => ({
  default: () => ({ ciudades: [], loading: false, error: null, refetch: vi.fn() }),
}));

// El buscador de cliente Microsip usa este hook para la búsqueda async; se
// mockea igual que en SeleccionarClienteMicrosipCombobox.test.tsx.
vi.mock("../piezas/useBuscarClientesMicrosip", () => ({
  useBuscarClientesMicrosip: vi.fn(),
}));

import { useBuscarClientesMicrosip } from "../piezas/useBuscarClientesMicrosip";
import { makeFakeCliente } from "@/modules/clientes/application/__tests__/fakeClientesPort";
import { ClienteTab } from "./ClienteTab";
import type { ClienteFormData, GPSFormData } from "../../../presentation/hooks/useVentaEditState";

const mockUseBuscarClientesMicrosip = vi.mocked(useBuscarClientesMicrosip);

const baseGps: GPSFormData = { latitud: 0, longitud: 0 };

function baseCliente(overrides: Partial<ClienteFormData> = {}): ClienteFormData {
  return {
    nombreCliente: "MARIA GONZALEZ LOPEZ",
    telefono: "",
    aval: "",
    referencia: "",
    clienteID: null,
    calle: "AV SIEMPRE VIVA",
    numeroExterior: "123",
    colonia: "CENTRO",
    poblacion: "AGUASCALIENTES",
    ciudad: "AGUASCALIENTES",
    zonaClienteId: null,
    ...overrides,
  };
}

beforeEach(() => {
  mockUseBuscarClientesMicrosip.mockReset();
  mockUseBuscarClientesMicrosip.mockReturnValue({ items: [], isLoading: false, error: null });
});

describe("ClienteTab", () => {
  it("sin clienteID: el campo Nombre es editable", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <ClienteTab
        data={baseCliente()}
        gps={baseGps}
        errors={[]}
        onUpdate={onUpdate}
        onUpdateGps={vi.fn()}
      />,
    );

    const input = screen.getByDisplayValue("MARIA GONZALEZ LOPEZ");
    expect(input).not.toBeDisabled();

    await user.type(input, "X");
    expect(onUpdate).toHaveBeenCalledWith("nombreCliente", expect.any(String));
  });

  it("con clienteID y nombre_cliente_microsip: sólo lectura mostrando el nombre de Microsip", () => {
    render(
      <ClienteTab
        data={baseCliente({ clienteID: 2655626, nombreCliente: "NOMBRE VIEJO EN LA VENTA" })}
        gps={baseGps}
        errors={[]}
        onUpdate={vi.fn()}
        onUpdateGps={vi.fn()}
        nombreClienteMicrosip="JUAN PEREZ GARCIA"
      />,
    );

    const input = screen.getByDisplayValue("JUAN PEREZ GARCIA");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("title", "Se edita en Microsip");
    // El nombre viejo que traía la venta nunca debe pintarse: Microsip manda.
    expect(screen.queryByDisplayValue("NOMBRE VIEJO EN LA VENTA")).not.toBeInTheDocument();
  });

  it("con clienteID sin nombre_cliente_microsip: sigue sólo lectura, mostrando el nombre que ya tenía la venta", () => {
    render(
      <ClienteTab
        data={baseCliente({ clienteID: 2655626, nombreCliente: "NOMBRE YA GUARDADO" })}
        gps={baseGps}
        errors={[]}
        onUpdate={vi.fn()}
        onUpdateGps={vi.fn()}
      />,
    );

    const input = screen.getByDisplayValue("NOMBRE YA GUARDADO");
    expect(input).toBeDisabled();
  });

  it("elegir un cliente en el buscador rellena el nombre y liga el id en un solo gesto", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    mockUseBuscarClientesMicrosip.mockReturnValue({
      items: [makeFakeCliente({ clienteId: 24037, nombre: "MINERVA LOPEZ HERNANDEZ" })],
      isLoading: false,
      error: null,
    });

    render(
      <ClienteTab
        data={baseCliente()}
        gps={baseGps}
        errors={[]}
        onUpdate={onUpdate}
        onUpdateGps={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Vincular cliente Microsip" }));
    await user.type(screen.getByPlaceholderText("Buscar por nombre o ID…"), "minerva");
    await user.click(screen.getByText("MINERVA LOPEZ HERNANDEZ"));

    expect(onUpdate).toHaveBeenCalledWith("clienteID", 24037);
    expect(onUpdate).toHaveBeenCalledWith("nombreCliente", "MINERVA LOPEZ HERNANDEZ");
  });
});
