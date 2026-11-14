import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EntregaGarantiaForm } from "../EntregaGarantiaForm";

const mocks = vi.hoisted(() => ({
  entregar: vi.fn(),
}));

vi.mock("../../presentation/composition/crearGarantiasPort", () => ({
  crearGarantiasPort: () => ({
    entregarGarantia: mocks.entregar,
  }),
}));

function montar(permisos = ["garantias:cerrar"]) {
  const onSuccess = vi.fn();

  render(
    <EntregaGarantiaForm
      garantiaId="garantia-1"
      permisos={permisos}
      onSuccess={onSuccess}
    />,
  );

  return onSuccess;
}

function llenar(firma: File) {
  fireEvent.change(screen.getByLabelText("Archivo de firma"), {
    target: { files: [firma] },
  });

  fireEvent.change(screen.getByLabelText("Latitud GPS"), {
    target: { value: "19.4326" },
  });

  fireEvent.change(screen.getByLabelText("Longitud GPS"), {
    target: { value: "-99.1332" },
  });
}

describe("EntregaGarantiaForm", () => {
  beforeEach(() => {
    mocks.entregar.mockReset();
  });

  it("oculta el formulario sin permiso de cierre", () => {
    montar(["garantias:leer"]);

    expect(screen.queryByLabelText("Entrega con firma"))
      .toBeNull();
  });

  it("rechaza una entrega sin firma", () => {
    montar();

    fireEvent.click(
      screen.getByRole("button", { name: "Preparar entrega" }),
    );

    expect(screen.getByRole("alert").textContent)
      .toContain("Selecciona una firma JPEG o PNG");
    expect(mocks.entregar).not.toHaveBeenCalled();
  });

  it("rechaza una firma demasiado grande", () => {
    montar();

    const firma = new File(
      [new Uint8Array(1024 * 1024 + 1)],
      "firma.png",
      { type: "image/png" },
    );

    llenar(firma);

    fireEvent.click(
      screen.getByRole("button", { name: "Preparar entrega" }),
    );

    expect(screen.getByRole("alert").textContent)
      .toContain("1 MiB");
    expect(mocks.entregar).not.toHaveBeenCalled();
  });

  it("rechaza coordenadas fuera del rango válido", () => {
    montar();

    llenar(new File(["imagen"], "firma.png", {
      type: "image/png",
    }));

    fireEvent.change(screen.getByLabelText("Latitud GPS"), {
      target: { value: "91" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Preparar entrega" }),
    );

    expect(screen.getByRole("alert").textContent)
      .toContain("coordenadas GPS válidas");
    expect(mocks.entregar).not.toHaveBeenCalled();
  });

  it("conserva la firma, GPS e identidad al reintentar", async () => {
    mocks.entregar
      .mockRejectedValueOnce(new Error("Error de red"))
      .mockResolvedValueOnce({});

    const onSuccess = montar();
    const firma = new File(["imagen"], "firma.png", {
      type: "image/png",
    });

    llenar(firma);

    fireEvent.click(
      screen.getByRole("button", { name: "Preparar entrega" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar entrega" }),
    );

    expect(await screen.findByRole("alert"))
      .toHaveTextContent("Error de red");

    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar entrega" }),
    );

    await waitFor(() => {
      expect(mocks.entregar).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    expect(mocks.entregar.mock.calls[0])
      .toEqual(mocks.entregar.mock.calls[1]);

    expect(mocks.entregar.mock.calls[0][1]).toBe(firma);
    expect(mocks.entregar.mock.calls[0][2]).toBe(19.4326);
    expect(mocks.entregar.mock.calls[0][3]).toBe(-99.1332);
  });

  it("evita envíos duplicados mientras procesa la entrega", async () => {
    let resolver: ((valor: unknown) => void) | undefined;

    mocks.entregar.mockImplementation(
      () => new Promise((resolve) => {
        resolver = resolve;
      }),
    );

    const onSuccess = montar();

    llenar(new File(["imagen"], "firma.jpg", {
      type: "image/jpeg",
    }));

    fireEvent.click(
      screen.getByRole("button", { name: "Preparar entrega" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar entrega" }),
    );

    expect(mocks.entregar).toHaveBeenCalledTimes(1);

    const boton = screen.getByRole(
      "button",
      { name: "Enviando..." },
    ) as HTMLButtonElement;

    expect(boton.disabled).toBe(true);

    resolver?.({});

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    expect(mocks.entregar).toHaveBeenCalledTimes(1);
  });

  it("muestra el detalle HTTP 422 y conserva firma, GPS e identidad", async () => {
    const detalle = "La entrega no cumple las condiciones del folio.";
    const error = new AxiosError("Request failed with status code 422");

    error.response = {
      status: 422,
      data: { detail: detalle },
    } as AxiosResponse;

    mocks.entregar
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({});

    const onSuccess = montar();
    const firma = new File(["imagen"], "firma.png", {
      type: "image/png",
    });

    llenar(firma);

    fireEvent.click(
      screen.getByRole("button", { name: "Preparar entrega" }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar entrega" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(detalle);

    expect(mocks.entregar).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar entrega" }),
    );

    await waitFor(() => {
      expect(mocks.entregar).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    expect(mocks.entregar.mock.calls[0])
      .toEqual(mocks.entregar.mock.calls[1]);

    expect(mocks.entregar.mock.calls[0][1]).toBe(firma);
    expect(mocks.entregar.mock.calls[0][2]).toBe(19.4326);
    expect(mocks.entregar.mock.calls[0][3]).toBe(-99.1332);
  });

});
