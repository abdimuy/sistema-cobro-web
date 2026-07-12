import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("./AuthenticatedImage", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt ?? "imagen"} />,
}));

import VentaImagenLightbox from "./VentaImagenLightbox";
import type { ImagenV2 } from "@/services/api/ventaV2Types";

const imagenes = [
  { id: "img-1", descripcion: "frente", created_at: "2026-05-01T10:00:00Z" },
] as unknown as ImagenV2[];

const renderLightbox = (onClose = vi.fn()) => {
  const utils = render(
    <VentaImagenLightbox
      ventaId="v1"
      imagenes={imagenes}
      initialIndex={0}
      onClose={onClose}
    />,
  );
  const root = utils.container.querySelector("[data-lightbox]") as HTMLElement;
  return { ...utils, root, onClose };
};

describe("VentaImagenLightbox", () => {
  it("closes when the empty backdrop itself is clicked", () => {
    const { root, onClose } = renderLightbox();
    fireEvent.click(root); // target === currentTarget → backdrop
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT close when a toolbar button (not the backdrop) is clicked", () => {
    const { onClose } = renderLightbox();
    fireEvent.click(screen.getByTitle("Zoom in (+)"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on Escape", () => {
    const { onClose } = renderLightbox();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("marks its root with data-lightbox so the venta dialog can ignore it", () => {
    const { root } = renderLightbox();
    expect(root).not.toBeNull();
  });
});
