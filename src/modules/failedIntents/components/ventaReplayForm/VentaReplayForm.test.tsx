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

vi.mock("@/hooks/useGetVendedores", () => ({
  __esModule: true,
  default: () => ({
    vendedores: [],
    loading: false,
    error: null,
  }),
}));

import { VentaReplayForm } from "./VentaReplayForm";

function makeValidBody(): Record<string, unknown> {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    cliente: {
      cliente_id: 7,
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

  it("emits onChange with the updated body when the operator edits the cliente nombre", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VentaReplayForm initialBody={makeValidBody()} onChange={onChange} />);

    // Switch to the Cliente tab so the input is mounted.
    await user.click(screen.getByRole("tab", { name: /cliente/i }));
    const nombreInput = await screen.findByDisplayValue("CARLOS MENDEZ");
    await user.click(nombreInput);
    await user.keyboard(" X");

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const calls = onChange.mock.calls;
    const lastBody = calls[calls.length - 1]?.[0] as { cliente: { nombre: string } };
    expect(lastBody.cliente.nombre).toBe("CARLOS MENDEZ X");
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
