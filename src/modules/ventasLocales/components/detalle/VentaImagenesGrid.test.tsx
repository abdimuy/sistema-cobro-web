import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Stub the authed image so no network/blob fetch happens in jsdom. The grid and
// the lightbox both render it; a plain <img> with the alt is enough.
vi.mock("./AuthenticatedImage", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt ?? "imagen"} />,
}));

import VentaImagenesGrid from "./VentaImagenesGrid";
import type { ImagenV2 } from "@/services/api/ventaV2Types";

const imagenes = [
  { id: "img-1", descripcion: "frente", created_at: "2026-05-01T10:00:00Z" },
  { id: "img-2", descripcion: "ine", created_at: "2026-05-01T10:01:00Z" },
] as unknown as ImagenV2[];

describe("VentaImagenesGrid", () => {
  it("empty state when there are no images", () => {
    render(<VentaImagenesGrid ventaId="v1" imagenes={[]} />);
    expect(screen.getByText("No hay imágenes adjuntas")).toBeInTheDocument();
  });

  it("opens the lightbox portaled to <body>, not inside the grid container", () => {
    const { container } = render(
      <VentaImagenesGrid ventaId="v1" imagenes={imagenes} />,
    );

    // The lightbox is closed initially.
    expect(screen.queryByText("1 / 2")).not.toBeInTheDocument();

    // Open the first thumbnail.
    fireEvent.click(screen.getAllByRole("button")[0]);

    // The lightbox is now open (its "1 / 2" counter is unique to it)...
    const counter = screen.getByText("1 / 2");
    expect(counter).toBeInTheDocument();

    // ...and it is PORTALED: it lives under document.body, NOT inside the grid's
    // own render container. This is the guard for the fix — rendered in place it
    // would be trapped by the modal's transformed ancestor.
    expect(within(container).queryByText("1 / 2")).toBeNull();
    expect(document.body.contains(counter)).toBe(true);
  });
});
