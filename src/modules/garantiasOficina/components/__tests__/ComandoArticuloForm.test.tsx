import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ComandoArticuloForm } from "../ComandoArticuloForm";
import type { ArticuloGarantia } from "../../domain/garantia";

const mocks = vi.hoisted(() => ({
  ejecutar: vi.fn(),
}));

vi.mock("../../presentation/composition/crearGarantiasPort", () => ({
  crearGarantiasPort: () => ({
    ejecutarComandoArticulo: mocks.ejecutar,
  }),
}));

const articulo: ArticuloGarantia = {
  id: "articulo-1",
  garantia_id: "garantia-1",
  rol: "original",
  clave: "ART-001",
  description: "Artículo de prueba",
  etapa: "registrado",
  ubicacion: "taller",
  created_at: "2026-11-13T12:00:00Z",
  updated_at: "2026-11-13T12:00:00Z",
};

function montar(permisos: string[]) {
  const onSuccess = vi.fn();
  const vista = render(
    <ComandoArticuloForm
      garantiaId="garantia-1"
      articulos={[articulo]}
      permisos={permisos}
      onSuccess={onSuccess}
    />,
  );
  return { ...vista, onSuccess };
}

function prepararDiagnostico() {
  fireEvent.change(screen.getByLabelText("Artículo para operación"), {
    target: { value: "articulo-1" },
  });
  fireEvent.change(screen.getByLabelText("Tipo de operación"), {
    target: { value: "diagnostico" },
  });
  fireEvent.change(screen.getByLabelText("Resultado de operación"), {
    target: { value: "taller" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preparar operación" }));
}

describe("ComandoArticuloForm", () => {
  beforeEach(() => {
    mocks.ejecutar.mockReset();
  });

  it("no muestra operaciones a usuarios sin permiso", () => {
    montar(["garantias:leer"]);

    expect(screen.queryByLabelText("Operaciones de artículo")).toBeNull();
    expect(mocks.ejecutar).not.toHaveBeenCalled();
  });

  it("sólo muestra los comandos autorizados", () => {
    montar(["garantias:actualizar"]);

    const opciones = Array.from(
      screen.getByLabelText("Tipo de operación").querySelectorAll("option"),
    ).map((opcion) => opcion.value);

    expect(opciones).toContain("diagnostico");
    expect(opciones).toContain("dictamen");
    expect(opciones).not.toContain("cambio-fisico");
    expect(opciones).not.toContain("desenlace");
  });

  it("reintenta con la misma identidad tras un error", async () => {
    mocks.ejecutar
      .mockRejectedValueOnce(new Error("Sin conexión"))
      .mockResolvedValueOnce({});

    const { onSuccess } = montar(["garantias:actualizar"]);
    prepararDiagnostico();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar operación" }));

    expect(await screen.findByText("Sin conexión")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar operación" }));

    await waitFor(() => {
      expect(mocks.ejecutar).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    const primera = mocks.ejecutar.mock.calls[0];
    const segunda = mocks.ejecutar.mock.calls[1];

    expect(primera).toEqual(segunda);
    expect(primera[0]).toBe("garantia-1");
    expect(primera[1]).toBe("articulo-1");
    expect(primera[2]).toMatchObject({
      tipo: "diagnostico",
      ruta: "taller",
    });
    expect(primera[3].claveIdempotencia).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(Number.isNaN(Date.parse(primera[3].deviceCreatedAt))).toBe(false);
  });

  it("no duplica envíos mientras la solicitud está en curso", async () => {
    let resolver: ((value: unknown) => void) | undefined;

    mocks.ejecutar.mockImplementation(
      () => new Promise((resolve) => { resolver = resolve; }),
    );

    montar(["garantias:actualizar"]);
    prepararDiagnostico();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar operación" }));

    expect(mocks.ejecutar).toHaveBeenCalledTimes(1);
    expect(
      (screen.getByRole("button", { name: "Enviando..." }) as HTMLButtonElement).disabled,
    ).toBe(true);

    resolver?.({});
    await waitFor(() => {
      expect(screen.getByText("Operación registrada correctamente.")).toBeTruthy();
    });
    expect(mocks.ejecutar).toHaveBeenCalledTimes(1);
  });
});
