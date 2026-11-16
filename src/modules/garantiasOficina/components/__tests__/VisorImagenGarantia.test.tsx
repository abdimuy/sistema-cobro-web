import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { VisorImagenGarantia } from "../VisorImagenGarantia";

const mocks = vi.hoisted(() => ({
  descargar: vi.fn(),
}));

vi.mock("../../presentation/composition/crearGarantiasPort", () => ({
  crearGarantiasPort: () => ({
    descargarImagen: mocks.descargar,
  }),
}));

function montar(imagenId = "imagen-1") {
  return render(
    <VisorImagenGarantia
      garantiaId="garantia-1"
      eventoId="evento-1"
      imagenId={imagenId}
    />,
  );
}

describe("VisorImagenGarantia", () => {
  beforeEach(() => {
    mocks.descargar.mockReset();

    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:imagen-de-prueba"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    // React debe desmontar el visor mientras el mock de URL sigue activo.
    cleanup();
    vi.unstubAllGlobals();
  });

  it("no descarga imágenes antes de abrir el visor", () => {
    montar();
    expect(mocks.descargar).not.toHaveBeenCalled();
  });

  it("descarga y muestra una imagen autenticada", async () => {
    mocks.descargar.mockResolvedValue(
      new Blob(["imagen"], { type: "image/png" }),
    );

    montar();

    fireEvent.click(screen.getByRole("button", { name: "Ver imagen" }));

    const imagen = await screen.findByRole("img", {
      name: "Evidencia fotográfica de garantía",
    });

    expect(imagen.getAttribute("src")).toBe("blob:imagen-de-prueba");
    expect(mocks.descargar).toHaveBeenCalledWith(
      "garantia-1",
      "evento-1",
      "imagen-1",
      expect.any(AbortSignal),
    );
  });

  it("libera la URL temporal al cerrar", async () => {
    mocks.descargar.mockResolvedValue(
      new Blob(["imagen"], { type: "image/jpeg" }),
    );

    montar();

    fireEvent.click(screen.getByRole("button", { name: "Ver imagen" }));

    await screen.findByRole("img", {
      name: "Evidencia fotográfica de garantía",
    });

    fireEvent.click(screen.getByRole("button", { name: "Cerrar imagen" }));

    await waitFor(() => {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(
        "blob:imagen-de-prueba",
      );
    });

    expect(screen.queryByRole("img")).toBeNull();
  });

  it("presenta el error HTTP sin mostrar imagen", async () => {
    mocks.descargar.mockRejectedValue(new Error("Acceso denegado"));

    montar();
    fireEvent.click(screen.getByRole("button", { name: "Ver imagen" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Acceso denegado",
    );
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("rechaza contenido que no sea una imagen", async () => {
    mocks.descargar.mockResolvedValue(
      new Blob(["error"], { type: "application/json" }),
    );

    montar();
    fireEvent.click(screen.getByRole("button", { name: "Ver imagen" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El archivo recibido no es una imagen.",
    );
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("cancela una descarga pendiente al cerrar", async () => {
    let signal: AbortSignal | undefined;

    mocks.descargar.mockImplementation(
      (_garantia: string, _evento: string, _imagen: string, s: AbortSignal) => {
        signal = s;
        return new Promise(() => {});
      },
    );

    montar();
    fireEvent.click(screen.getByRole("button", { name: "Ver imagen" }));

    expect(signal?.aborted).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar imagen" }));

    expect(signal?.aborted).toBe(true);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
