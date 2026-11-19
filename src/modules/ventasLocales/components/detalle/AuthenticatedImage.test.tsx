import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ventaV2Http } from "@/services/api/ventaV2Types";
import { AuthenticatedImage } from "./AuthenticatedImage";
import { fuenteImagenArchivo, fuenteImagenVenta } from "./fuenteImagen";

describe("AuthenticatedImage", () => {
  afterEach(() => vi.restoreAllMocks());

  const conBlob = () => {
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    return vi.spyOn(ventaV2Http, "get").mockResolvedValue({ data: new Blob(["x"]) });
  };

  it("origen archivo pide la ruta de archivo", async () => {
    const get = conBlob();
    render(<AuthenticatedImage fuente={fuenteImagenArchivo("v1", "i1")} />);
    await waitFor(() => expect(screen.getByRole("img")).toBeTruthy());
    expect(get).toHaveBeenCalledWith("/ventas/archivo/v1/imagenes/i1", { responseType: "blob" });
    expect(fuenteImagenArchivo("v1", "i1").cacheKey).toBe("archivo:v1/i1");
  });

  it("sin origen sigue pidiendo /ventas/{id}/imagenes/{img}", async () => {
    const get = conBlob();
    render(<AuthenticatedImage fuente={fuenteImagenVenta("v2", "i2")} />);
    await waitFor(() => expect(screen.getByRole("img")).toBeTruthy());
    expect(get).toHaveBeenCalledWith("/ventas/v2/imagenes/i2", { responseType: "blob" });
  });

  it("404 con textoError muestra 'Foto no disponible'", async () => {
    vi.spyOn(ventaV2Http, "get").mockRejectedValue({ response: { status: 404 } });
    render(<AuthenticatedImage fuente={fuenteImagenArchivo("v3", "i3")} textoError="Foto no disponible" />);
    expect(await screen.findByText("Foto no disponible")).toBeTruthy();
  });

  it("sin textoError el error sigue siendo solo el ícono", async () => {
    vi.spyOn(ventaV2Http, "get").mockRejectedValue({ response: { status: 404 } });
    render(<AuthenticatedImage fuente={fuenteImagenArchivo("v4", "i4")} />);
    const el = await screen.findByLabelText("No se pudo cargar la imagen");
    expect(el.textContent).toBe("");
  });
});
