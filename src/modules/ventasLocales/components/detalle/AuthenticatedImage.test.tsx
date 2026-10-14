import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AuthenticatedImage from "./AuthenticatedImage";

// jsdom no trae URL.createObjectURL/revokeObjectURL.
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:foto");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => vi.restoreAllMocks());

describe("AuthenticatedImage con descargador", () => {
  it("dos consumidores de la misma clave comparten UNA descarga", async () => {
    const descargar = vi.fn(async () => new Blob(["x"], { type: "image/jpeg" }));
    const fuente = { cacheKey: "prueba/compartida", descargar };
    render(
      <>
        <AuthenticatedImage fuente={fuente} alt="miniatura" />
        <AuthenticatedImage fuente={fuente} alt="visor" />
      </>,
    );
    expect(await screen.findByAltText("miniatura")).toHaveAttribute("src", "blob:foto");
    expect(await screen.findByAltText("visor")).toBeInTheDocument();
    expect(descargar).toHaveBeenCalledTimes(1);
  });

  it("al desmontar al último consumidor libera el blob", async () => {
    const fuente = { cacheKey: "prueba/liberar", descargar: async () => new Blob(["x"]) };
    const { unmount } = render(<AuthenticatedImage fuente={fuente} alt="foto" />);
    await screen.findByAltText("foto");
    unmount();
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:foto"));
  });

  it("si la descarga falla lo dice", async () => {
    const fuente = { cacheKey: "prueba/falla", descargar: async () => Promise.reject(new Error("404")) };
    render(<AuthenticatedImage fuente={fuente} alt="foto" />);
    expect(await screen.findByRole("img", { name: "No se pudo cargar la imagen" })).toBeInTheDocument();
  });
});
