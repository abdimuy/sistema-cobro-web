import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrigenFiltro } from "./OrigenFiltro";

describe("OrigenFiltro", () => {
  it("muestra Todas 8, App 5, Archivo 3 y marca el activo con aria-pressed", () => {
    render(<OrigenFiltro value="app" conteo={{ app: 5, archivo: 3 }} onChange={vi.fn()} />);
    expect(screen.getByRole("group", { name: "Origen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todas 8" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "App 5" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Archivo 3" })).toHaveAttribute("aria-pressed", "false");
  });

  it("archivo null muestra 'Archivo —' y el botón sigue habilitado", () => {
    render(<OrigenFiltro value="todas" conteo={{ app: 5, archivo: null }} onChange={vi.fn()} />);
    const b = screen.getByRole("button", { name: "Archivo —" });
    expect(b).toBeEnabled();
  });

  it("Todas no suma si algún conteo es null", () => {
    render(<OrigenFiltro value="todas" conteo={{ app: 5, archivo: null }} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Todas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "App 5" })).toBeInTheDocument();
  });

  it("sin conteo muestra solo las etiquetas", () => {
    render(<OrigenFiltro value="todas" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Todas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "App" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archivo" })).toBeInTheDocument();
  });

  it("clic llama onChange con 'app' | 'archivo' | 'todas'", () => {
    const onChange = vi.fn();
    render(<OrigenFiltro value="todas" conteo={{ app: 5, archivo: 3 }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "App 5" }));
    fireEvent.click(screen.getByRole("button", { name: "Archivo 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Todas 8" }));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual(["app", "archivo", "todas"]);
  });
});
