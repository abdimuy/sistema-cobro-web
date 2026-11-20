import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrigenFiltro } from "./OrigenFiltro";

describe("OrigenFiltro", () => {
  it("muestra Todas, App y Archivo sin totales y marca el activo con aria-pressed", () => {
    render(<OrigenFiltro value="app" onChange={vi.fn()} />);
    expect(screen.getByRole("group", { name: "Origen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todas" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "App" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Archivo" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("group", { name: "Origen" })).not.toHaveTextContent(/\d/);
  });

  it("clic llama onChange con 'app' | 'archivo' | 'todas'", () => {
    const onChange = vi.fn();
    render(<OrigenFiltro value="todas" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "App" }));
    fireEvent.click(screen.getByRole("button", { name: "Archivo" }));
    fireEvent.click(screen.getByRole("button", { name: "Todas" }));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual(["app", "archivo", "todas"]);
  });
});
