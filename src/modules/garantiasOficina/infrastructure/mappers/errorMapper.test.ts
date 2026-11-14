import { describe, expect, it } from "vitest";
import { AxiosError, type AxiosResponse } from "axios";
import { mensajeErrorGarantias } from "./errorMapper";

describe("mensajeErrorGarantias", () => {
  it("muestra el detalle del backend ante un 422", () => {
    const error = new AxiosError(
      "Request failed with status code 422",
    );

    error.response = {
      status: 422,
      data: {
        detail: "Los artículos deben estar reingresados al inventario.",
      },
    } as AxiosResponse;

    expect(mensajeErrorGarantias(error)).toBe(
      "Los artículos deben estar reingresados al inventario.",
    );
  });

  it("muestra un mensaje de permisos ante un 403 sin detalle", () => {
    const error = new AxiosError("Forbidden");

    error.response = {
      status: 403,
      data: {},
    } as AxiosResponse;

    expect(mensajeErrorGarantias(error)).toBe(
      "No tienes permiso para realizar esta operación.",
    );
  });

  it("maneja errores de conexión", () => {
    const error = new AxiosError("Network Error");

    expect(mensajeErrorGarantias(error)).toBe(
      "No hay conexión con el servidor.",
    );
  });

  it("conserva errores normales", () => {
    expect(
      mensajeErrorGarantias(new Error("Fallo temporal")),
    ).toBe("Fallo temporal");
  });
});
