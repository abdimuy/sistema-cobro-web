import { describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Sin red: la imagen falsa deja ver qué fuente se pidió y cuántas se montaron.
vi.mock("./detalle/AuthenticatedImage", () => ({
  default: ({ fuente, alt }: { fuente: { cacheKey: string }; alt?: string }) => (
    <span data-testid="img" data-key={fuente.cacheKey} data-alt={alt} />
  ),
}));
vi.mock("./detalle/VentaImagenLightbox", () => ({
  default: ({ initialIndex }: { initialIndex: number }) => (
    <div data-testid="lightbox" data-index={initialIndex} />
  ),
}));

import { FotosVistaPrevia } from "./FotosVistaPrevia";
import type { ImagenListado, VentaLocal } from "@/services/api/getVentasLocales";

const fotos = (n: number): ImagenListado[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `img-${i + 1}`,
    descripcion: i === 0 ? "Fachada" : null,
    created_at: "2026-08-10T18:30:00Z",
    mime: "image/jpeg",
  }));

const venta = (n: number, origen?: "archivo"): VentaLocal => ({
  LOCAL_SALE_ID: "venta-1",
  USER_EMAIL: "x@y.mx",
  ALMACEN_ID: 1,
  NOMBRE_CLIENTE: "María Fernanda Olvera",
  FECHA_VENTA: "2026-08-10T18:00:00Z",
  LATITUD: 0,
  LONGITUD: 0,
  DIRECCION: "",
  PRECIO_TOTAL: 1,
  TELEFONO: "",
  ORIGEN: origen,
  IMAGENES: fotos(n),
});

const pila = () => screen.getByRole("button", { name: /fotos? de María Fernanda Olvera/ });

describe("FotosVistaPrevia", () => {
  it("la pila muestra el número de fotos", () => {
    render(<FotosVistaPrevia venta={venta(5)} />);
    expect(pila().getAttribute("aria-label")).toBe("5 fotos de María Fernanda Olvera");
    expect(within(pila()).getByTestId("fotos-contador").textContent).toBe("5");
  });

  it("sin fotos no hay botón y sí el espacio", () => {
    render(<FotosVistaPrevia venta={venta(0)} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByTestId("fotos-espacio")).toBeTruthy();
  });

  it("cerrada no monta ninguna imagen", () => {
    render(<FotosVistaPrevia venta={venta(4)} />);
    expect(screen.queryAllByTestId("img")).toHaveLength(0);
  });

  it("al enfocar muestra la foto 1 con 1 / N y hover en la miniatura 3 la cambia", async () => {
    const user = userEvent.setup();
    render(<FotosVistaPrevia venta={venta(5)} />);
    await user.tab();
    expect(await screen.findByText("1 / 5")).toBeTruthy();
    expect(screen.getByText("Fachada", { selector: "span" })).toBeTruthy();
    expect(screen.getByText(/Subida 10\/08\/2026/)).toBeTruthy();

    await user.hover(screen.getByRole("button", { name: "Ver foto: Foto 3" }));
    expect(await screen.findByText("3 / 5")).toBeTruthy();
    expect(screen.getByText("Foto 3", { selector: "span" })).toBeTruthy();
  });

  it("el foco en una miniatura también cambia la foto", async () => {
    const user = userEvent.setup();
    render(<FotosVistaPrevia venta={venta(5)} />);
    await user.hover(pila());
    const mini = await screen.findByRole("button", { name: "Ver foto: Foto 2" });
    act(() => mini.focus());
    expect(await screen.findByText("2 / 5")).toBeTruthy();
  });

  it("más de 6 fotos: 5 miniaturas y +N", async () => {
    const user = userEvent.setup();
    render(<FotosVistaPrevia venta={venta(9)} />);
    await user.tab();
    await screen.findByText("1 / 9");
    expect(screen.getAllByRole("button", { name: /^Ver foto:/ })).toHaveLength(5);
    expect(screen.getByText("+4")).toBeTruthy();
  });

  it("exactamente 6 fotos: 6 miniaturas y sin +N", async () => {
    const user = userEvent.setup();
    render(<FotosVistaPrevia venta={venta(6)} />);
    await user.tab();
    await screen.findByText("1 / 6");
    expect(screen.getAllByRole("button", { name: /^Ver foto:/ })).toHaveLength(6);
    expect(screen.queryByText(/^\+\d/)).toBeNull();
  });

  it("app: clic en miniatura k abre el visor en k; +N abre en 5", async () => {
    const user = userEvent.setup();
    render(<FotosVistaPrevia venta={venta(9)} />);
    await user.tab();
    await user.click(await screen.findByRole("button", { name: "Ver foto: Foto 3" }));
    expect(screen.getByTestId("lightbox").getAttribute("data-index")).toBe("2");
  });

  it("app: clic en +N abre el visor en el índice 5", async () => {
    const user = userEvent.setup();
    render(<FotosVistaPrevia venta={venta(9)} />);
    await user.tab();
    await user.click(await screen.findByText("+4"));
    expect(screen.getByTestId("lightbox").getAttribute("data-index")).toBe("5");
  });

  it("app: clic en la pila abre el visor en la primera", async () => {
    const user = userEvent.setup();
    render(<FotosVistaPrevia venta={venta(3)} />);
    await user.click(pila());
    expect(screen.getByTestId("lightbox").getAttribute("data-index")).toBe("0");
  });

  it("Archivo: clic en miniatura llama a abrir el panel con ese índice, sin visor", async () => {
    const user = userEvent.setup();
    const abrir = vi.fn();
    render(<FotosVistaPrevia venta={venta(5, "archivo")} onAbrirArchivo={abrir} />);
    await user.tab();
    await user.click(await screen.findByRole("button", { name: "Ver foto: Foto 4" }));
    expect(abrir).toHaveBeenCalledTimes(1);
    expect(abrir.mock.calls[0]?.[0]).toBe(3);
    expect(screen.queryByTestId("lightbox")).toBeNull();
  });

  it("la fila de Archivo usa la fuente de Archivo y la de la app la suya", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<FotosVistaPrevia venta={venta(2, "archivo")} />);
    await user.tab();
    await screen.findByText("1 / 2");
    for (const el of screen.getAllByTestId("img")) {
      expect(el.getAttribute("data-key")).toMatch(/^archivo:venta-1\/img-/);
    }
    unmount();

    render(<FotosVistaPrevia venta={venta(2)} />);
    await user.tab();
    await screen.findByText("1 / 2");
    for (const el of screen.getAllByTestId("img")) {
      expect(el.getAttribute("data-key")).toMatch(/^venta\/venta-1\/img-/);
    }
  });
});
