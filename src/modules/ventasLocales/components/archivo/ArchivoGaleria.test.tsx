import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const fuenteMock = vi.fn((v: string, i: string) => ({
  cacheKey: `${v}/${i}`,
  descargar: vi.fn(),
}));
vi.mock("../detalle/fuenteImagen", () => ({
  fuenteImagenArchivo: (v: string, i: string) => fuenteMock(v, i),
}));
const authImg = vi.fn(
  (p: { textoError?: string; fuente: { cacheKey: string } }) => (
    <div
      data-testid="img"
      data-key={p.fuente.cacheKey}
      data-error={p.textoError}
    />
  ),
);
vi.mock("../detalle/AuthenticatedImage", () => ({
  default: (p: never) => authImg(p),
}));

import { ArchivoGaleria } from "./ArchivoGaleria";

const imagenes = [
  { id: "a", mime: "image/jpeg", fecha_subida: "2026-02-03T22:05:00Z" },
  { id: "b", mime: "image/jpeg", fecha_subida: "2026-02-04T22:05:00Z" },
  { id: "c", mime: "image/jpeg", fecha_subida: "2026-02-05T22:05:00Z" },
];

describe("ArchivoGaleria", () => {
  it("muestra 'Foto 1 de 3' y la fecha de subida, y no la descripción", () => {
    render(<ArchivoGaleria ventaId="v1" imagenes={imagenes} />);
    expect(screen.getByText("Foto 1 de 3")).toBeInTheDocument();
    expect(screen.getByText(/subida 03\/02\/2026 16:05/)).toBeInTheDocument();
    expect(screen.queryByText(/IMAGEN/i)).toBeNull();
  });

  it("siguiente/anterior cambian la foto y se deshabilitan en los extremos", () => {
    render(<ArchivoGaleria ventaId="v1" imagenes={imagenes} />);
    expect(screen.getByLabelText("Foto anterior")).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Foto siguiente"));
    expect(screen.getByText("Foto 2 de 3")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Foto siguiente"));
    expect(screen.getByLabelText("Foto siguiente")).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Foto anterior"));
    expect(screen.getByText("Foto 2 de 3")).toBeInTheDocument();
  });

  it("clic en la miniatura 3 muestra 'Foto 3 de 3'", () => {
    render(<ArchivoGaleria ventaId="v1" imagenes={imagenes} />);
    fireEvent.click(screen.getByLabelText("Ver foto 3"));
    expect(screen.getByText("Foto 3 de 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Ver foto 3")).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByLabelText("Ver foto 1")).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("sin imágenes muestra 'Sin fotos' y ningún botón anterior/siguiente", () => {
    render(<ArchivoGaleria ventaId="v1" imagenes={[]} />);
    expect(screen.getByText("Sin fotos")).toBeInTheDocument();
    expect(screen.queryByLabelText("Foto anterior")).toBeNull();
    expect(screen.queryByLabelText("Foto siguiente")).toBeNull();
  });

  it("pasa textoError 'Foto no disponible' a la imagen", () => {
    render(<ArchivoGaleria ventaId="v1" imagenes={imagenes} />);
    expect(screen.getAllByTestId("img")[0]).toHaveAttribute(
      "data-error",
      "Foto no disponible",
    );
    expect(screen.getAllByTestId("img")[0]).toHaveAttribute("data-key", "v1/a");
  });

  it("flecha derecha del teclado avanza y la izquierda retrocede", () => {
    render(<ArchivoGaleria ventaId="v1" imagenes={imagenes} />);
    const region = screen.getByRole("group", { name: "Fotos de la venta" });
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(screen.getByText("Foto 2 de 3")).toBeInTheDocument();
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    expect(screen.getByText("Foto 1 de 3")).toBeInTheDocument();
  });

  it("si cambian las imágenes y el índice queda fuera, vuelve a la primera", () => {
    const { rerender } = render(
      <ArchivoGaleria ventaId="v1" imagenes={imagenes} />,
    );
    fireEvent.click(screen.getByLabelText("Ver foto 3"));
    rerender(<ArchivoGaleria ventaId="v2" imagenes={imagenes.slice(0, 1)} />);
    expect(screen.getByText("Foto 1 de 1")).toBeInTheDocument();
  });
});
