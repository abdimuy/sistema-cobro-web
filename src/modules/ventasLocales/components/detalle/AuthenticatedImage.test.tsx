import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
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

// Descarga controlable desde la prueba.
function diferida() {
  let soltar: (b: Blob) => void = () => {};
  const promesa = new Promise<Blob>((r) => (soltar = r));
  return { promesa, soltar: (b: Blob = new Blob(["x"])) => soltar(b) };
}

describe("AuthenticatedImage: cambios de fuente y concurrencia", () => {
  beforeEach(() => {
    let n = 0;
    URL.createObjectURL = vi.fn(() => `blob:${++n}`);
  });

  it("otra cacheKey descarga la nueva imagen y libera la anterior", async () => {
    const d1 = vi.fn(async () => new Blob(["1"]));
    const d2 = vi.fn(async () => new Blob(["2"]));
    const { rerender } = render(<AuthenticatedImage fuente={{ cacheKey: "cambio/k1", descargar: d1 }} alt="foto" />);
    expect(await screen.findByAltText("foto")).toHaveAttribute("src", "blob:1");
    rerender(<AuthenticatedImage fuente={{ cacheKey: "cambio/k2", descargar: d2 }} alt="foto" />);
    await waitFor(() => expect(screen.getByAltText("foto")).toHaveAttribute("src", "blob:2"));
    expect(d1).toHaveBeenCalledTimes(1);
    expect(d2).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1"));
  });

  it("una descarga vieja que termina tarde no pisa a la nueva", async () => {
    const vieja = diferida();
    const { rerender } = render(
      <AuthenticatedImage fuente={{ cacheKey: "tarde/A", descargar: () => vieja.promesa }} alt="foto" />,
    );
    rerender(<AuthenticatedImage fuente={{ cacheKey: "tarde/B", descargar: async () => new Blob(["B"]) }} alt="foto" />);
    // B se crea primero → blob:1; A termina después → blob:2.
    expect(await screen.findByAltText("foto")).toHaveAttribute("src", "blob:1");
    await act(async () => vieja.soltar());
    expect(screen.getByAltText("foto")).toHaveAttribute("src", "blob:1");
    // Nadie usa ya la A: su URL se libera al llegar.
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:2"));
  });

  it("desmontar con la descarga en vuelo: al llegar se libera y no truena", async () => {
    const d = diferida();
    const { unmount } = render(<AuthenticatedImage fuente={{ cacheKey: "tarde/desmontada", descargar: () => d.promesa }} alt="foto" />);
    unmount();
    await act(async () => d.soltar());
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1"));
  });

  it("con 5 imágenes pendientes solo 4 descargan a la vez; la 5.ª entra cuando una termina", async () => {
    const pendientes = Array.from({ length: 5 }, () => diferida());
    const llamadas = pendientes.map((p) => vi.fn(() => p.promesa));
    render(
      <>
        {llamadas.map((descargar, i) => (
          <AuthenticatedImage key={i} fuente={{ cacheKey: `cupo/${i}`, descargar }} alt={`foto ${i}`} />
        ))}
      </>,
    );
    const enCurso = () => llamadas.filter((f) => f.mock.calls.length > 0).length;
    await waitFor(() => expect(enCurso()).toBe(4));
    await act(async () => {
      await Promise.resolve();
    });
    expect(enCurso()).toBe(4);
    expect(llamadas[4]).not.toHaveBeenCalled();

    await act(async () => pendientes[0].soltar());
    await waitFor(() => expect(llamadas[4]).toHaveBeenCalledTimes(1));

    // Se sueltan todas para no dejar cupos ocupados en el módulo.
    await act(async () => pendientes.slice(1).forEach((p) => p.soltar()));
    expect(await screen.findByAltText("foto 4")).toBeInTheDocument();
  });
});
