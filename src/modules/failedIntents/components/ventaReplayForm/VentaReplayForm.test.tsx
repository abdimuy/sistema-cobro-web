import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock catalog hooks so the form doesn't try to hit Firebase / the API.
vi.mock("@/hooks/useGetAlmacenes", () => ({
  __esModule: true,
  default: () => ({
    almacenes: [
      { ALMACEN_ID: 1, ALMACEN: "MATRIZ", EXISTENCIAS: 0 },
      { ALMACEN_ID: 2, ALMACEN: "BODEGA", EXISTENCIAS: 0 },
    ],
    getAlmacenById: () => undefined,
    loading: false,
    error: null,
    refetch: async () => {},
  }),
}));

vi.mock("@/hooks/useGetZonasCliente", () => ({
  __esModule: true,
  default: () => ({
    zonas: [{ ZONA_CLIENTE_ID: 4, ZONA_CLIENTE: "CENTRO" }],
    loading: false,
    error: null,
    getZonaById: () => undefined,
    refetch: async () => {},
  }),
}));

vi.mock("@/hooks/useGetCiudades", () => ({
  __esModule: true,
  default: () => ({
    ciudades: [
      { ciudadId: 1, ciudad: "AGUASCALIENTES", estadoId: 1, estado: "AGUASCALIENTES" },
    ],
    loading: false,
    error: null,
    refetch: async () => {},
  }),
}));

vi.mock("@/hooks/useGetVendedores", () => ({
  __esModule: true,
  default: () => ({
    vendedores: [],
    loading: false,
    error: null,
  }),
}));

import { VentaReplayForm } from "./VentaReplayForm";

// clienteId parametriza la ÚNICA variable que decide si el campo Nombre es
// editable: la venta ligada a un cliente Microsip (número) o suelta (null).
function makeValidBody(clienteId: number | null = 7): Record<string, unknown> {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    cliente: {
      cliente_id: clienteId,
      nombre: "CARLOS MENDEZ",
      telefono: "+524491234567",
      aval: null,
      referencia: null,
    },
    direccion: {
      calle: "AV AGUASCALIENTES",
      numero_exterior: "123",
      colonia: "CENTRO",
      poblacion: "AGUASCALIENTES",
      ciudad: "AGUASCALIENTES",
      zona_cliente_id: 4,
    },
    gps: { latitud: 21.88, longitud: -102.29 },
    fecha_venta: "2026-06-06T10:00:00Z",
    tipo_venta: "CONTADO",
    montos: { anual: "1000.00", corto_plazo: "1000.00", contado: "1000.00" },
    combos: [],
    productos: [
      {
        id: "22222222-2222-2222-2222-222222222222",
        articulo_id: 100,
        articulo: "SILLA",
        cantidad: "1",
        precio_anual: "1000.00",
        precio_corto: "1000.00",
        precio_contado: "1000.00",
        combo_id: null,
        almacen_origen_id: 1,
        almacen_destino_id: 2,
      },
    ],
    vendedores: [
      {
        id: "33333333-3333-3333-3333-333333333333",
        usuario_id: "44444444-4444-4444-4444-444444444444",
        email: "v@muebleriamsp.mx",
        nombre: "JUAN",
      },
    ],
  };
}

describe("VentaReplayForm", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders the form tabs and the read-only hero with the venta id when the body is venta-shaped", () => {
    render(<VentaReplayForm initialBody={makeValidBody()} onChange={() => {}} />);
    expect(screen.getByTestId("venta-replay-form")).toBeInTheDocument();
    expect(screen.getByTestId("venta-replay-form-hero")).toHaveTextContent(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByRole("tab", { name: /cliente/i })).toBeInTheDocument();
  });

  it("starts in JSON view when the body is not venta-shaped", () => {
    render(<VentaReplayForm initialBody={{ foo: "bar" }} onChange={() => {}} />);
    expect(screen.getByTestId("venta-replay-form-json-textarea")).toBeInTheDocument();
    // Toggle to form must be disabled.
    expect(screen.getByTestId("venta-replay-form-toggle-form")).toBeDisabled();
  });

  it("toggles between form and JSON view", async () => {
    const user = userEvent.setup();
    render(<VentaReplayForm initialBody={makeValidBody()} onChange={() => {}} />);

    expect(screen.queryByTestId("venta-replay-form-json-textarea")).toBeNull();
    await user.click(screen.getByTestId("venta-replay-form-toggle-json"));
    expect(screen.getByTestId("venta-replay-form-json-textarea")).toBeInTheDocument();

    await user.click(screen.getByTestId("venta-replay-form-toggle-form"));
    expect(screen.queryByTestId("venta-replay-form-json-textarea")).toBeNull();
  });

  // El nombre y el cliente_id llegaron a derivar entre sí sin que nada avisara:
  // se tecleaba sobre el nombre de una venta ya ligada y la venta terminaba
  // aplicada a otra persona. La regla adoptada es que con cliente_id vinculado
  // el nombre es de SÓLO LECTURA. Las dos ramas se prueban aquí porque el
  // replay-with monta el mismo ClienteTab que el editor de ventas locales.

  it("con cliente_id vinculado, el nombre del cliente es de sólo lectura y la UI lo comunica", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VentaReplayForm initialBody={makeValidBody(7)} onChange={onChange} />);

    await user.click(screen.getByRole("tab", { name: /cliente/i }));
    const nombreInput = await screen.findByDisplayValue("CARLOS MENDEZ");

    // La UI no se limita a ignorar las teclas: el campo queda inerte y dice
    // por qué, para que el operador sepa dónde se cambia de verdad.
    expect(nombreInput).toBeDisabled();
    expect(nombreInput).toHaveAttribute("title", "Se edita en Microsip");

    // Y teclear encima no mueve el valor ni se filtra a ningún body emitido.
    await user.click(nombreInput);
    await user.keyboard(" X");
    expect(nombreInput).toHaveValue("CARLOS MENDEZ");

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    for (const [body] of onChange.mock.calls) {
      expect((body as { cliente: { nombre: string } }).cliente.nombre).toBe("CARLOS MENDEZ");
    }
  });

  it("sin cliente_id, el operador sí edita el nombre y onChange emite el body actualizado", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VentaReplayForm initialBody={makeValidBody(null)} onChange={onChange} />);

    // Switch to the Cliente tab so the input is mounted.
    await user.click(screen.getByRole("tab", { name: /cliente/i }));
    const nombreInput = await screen.findByDisplayValue("CARLOS MENDEZ");
    expect(nombreInput).toBeEnabled();

    await user.click(nombreInput);
    await user.keyboard(" X");

    await waitFor(() => {
      const calls = onChange.mock.calls;
      const lastBody = calls[calls.length - 1]?.[0] as { cliente: { nombre: string } };
      expect(lastBody.cliente.nombre).toBe("CARLOS MENDEZ X");
    });
  });

  it("emits onChange with parsed body when the operator edits raw JSON", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VentaReplayForm initialBody={makeValidBody()} onChange={onChange} />);

    await user.click(screen.getByTestId("venta-replay-form-toggle-json"));
    const ta = screen.getByTestId("venta-replay-form-json-textarea") as HTMLTextAreaElement;
    const next = JSON.parse(ta.value);
    next.cliente.nombre = "EDITADO EN JSON";
    await user.clear(ta);
    await user.click(ta);
    await user.paste(JSON.stringify(next));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const calls = onChange.mock.calls;
    const lastBody = calls[calls.length - 1]?.[0] as { cliente: { nombre: string } };
    expect(lastBody.cliente.nombre).toBe("EDITADO EN JSON");
  });

  it("disables the toggle to form when raw JSON is invalid", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VentaReplayForm initialBody={makeValidBody()} onChange={onChange} />);

    await user.click(screen.getByTestId("venta-replay-form-toggle-json"));
    const ta = screen.getByTestId("venta-replay-form-json-textarea") as HTMLTextAreaElement;
    await user.clear(ta);
    await user.click(ta);
    await user.paste("{ not json");

    await waitFor(() =>
      expect(screen.getByTestId("venta-replay-form-toggle-form")).toBeDisabled(),
    );
  });
});
