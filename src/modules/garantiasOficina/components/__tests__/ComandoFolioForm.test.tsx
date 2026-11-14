import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ComandoFolioForm } from "../ComandoFolioForm";

const mocks = vi.hoisted(() => ({
  ejecutar: vi.fn(),
}));

vi.mock("../../presentation/composition/crearGarantiasPort", () => ({
  crearGarantiasPort: () => ({
    ejecutarComandoFolio: mocks.ejecutar,
  }),
}));

function montar(permisos: string[]) {
  const onSuccess = vi.fn();
  render(
    <ComandoFolioForm
      garantiaId="garantia-1"
      permisos={permisos}
      onSuccess={onSuccess}
    />,
  );
  return onSuccess;
}

describe("ComandoFolioForm", () => {
  beforeEach(() => {
    mocks.ejecutar.mockReset();
  });

  it("oculta el formulario sin permisos", () => {
    montar(["garantias:leer"]);
    expect(screen.queryByLabelText("Operaciones de folio")).toBeNull();
  });

  it("sólo ofrece operaciones autorizadas", () => {
    montar(["garantias:actualizar"]);

    const valores = Array.from(
      screen.getByLabelText("Operación de folio").querySelectorAll("option"),
    ).map((opcion) => opcion.value);

    expect(valores).toContain("listo-entrega");
    expect(valores).not.toContain("cancelar");
    expect(valores).not.toContain("cerrar");
  });

  it("impide cancelar sin motivo", () => {
    montar(["garantias:cerrar"]);

    fireEvent.change(screen.getByLabelText("Operación de folio"), {
      target: { value: "cancelar" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Preparar operación de folio" }),
    );

    expect(screen.getByText("La cancelación requiere un motivo.")).toBeTruthy();
    expect(mocks.ejecutar).not.toHaveBeenCalled();
  });

  it("reintenta cancelar con la misma identidad y motivo", async () => {
    mocks.ejecutar
      .mockRejectedValueOnce(new Error("Error de red"))
      .mockResolvedValueOnce({});

    const onSuccess = montar(["garantias:cerrar"]);

    fireEvent.change(screen.getByLabelText("Operación de folio"), {
      target: { value: "cancelar" },
    });
    fireEvent.change(screen.getByLabelText("Motivo de cancelación"), {
      target: { value: "Solicitud del cliente" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Preparar operación de folio" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar operación de folio" }),
    );

    expect(await screen.findByText("Error de red")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar operación de folio" }),
    );

    await waitFor(() => {
      expect(mocks.ejecutar).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    expect(mocks.ejecutar.mock.calls[0]).toEqual(
      mocks.ejecutar.mock.calls[1],
    );
    expect(mocks.ejecutar.mock.calls[0][1]).toEqual({
      tipo: "cancelar",
      motivo: "Solicitud del cliente",
    });
  });

  it("evita un segundo envío mientras se procesa", async () => {
    let resolver: ((value: unknown) => void) | undefined;
    mocks.ejecutar.mockImplementation(
      () => new Promise((resolve) => { resolver = resolve; }),
    );

    montar(["garantias:actualizar"]);

    fireEvent.change(screen.getByLabelText("Operación de folio"), {
      target: { value: "listo-entrega" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Preparar operación de folio" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar operación de folio" }),
    );

    expect(mocks.ejecutar).toHaveBeenCalledTimes(1);
    expect(
      (screen.getByRole("button", { name: "Enviando..." }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    resolver?.({});

    await waitFor(() => {
      expect(
        screen.getByText("Operación de folio registrada correctamente."),
      ).toBeTruthy();
    });
    expect(mocks.ejecutar).toHaveBeenCalledTimes(1);
  });

  it("muestra el detalle HTTP 422 y conserva la identidad al reintentar", async () => {
    const detalle = "Los artículos deben estar reingresados al inventario.";
    const error = new AxiosError("Request failed with status code 422");

    error.response = {
      status: 422,
      data: { detail: detalle },
    } as AxiosResponse;

    mocks.ejecutar
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({});

    const onSuccess = montar(["garantias:actualizar"]);

    fireEvent.change(screen.getByLabelText("Operación de folio"), {
      target: { value: "listo-entrega" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Preparar operación de folio" }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar operación de folio" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(detalle);

    expect(mocks.ejecutar).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar operación de folio" }),
    );

    await waitFor(() => {
      expect(mocks.ejecutar).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    expect(mocks.ejecutar.mock.calls[0])
      .toEqual(mocks.ejecutar.mock.calls[1]);
  });

});
