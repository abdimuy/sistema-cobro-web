import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigToolbar, type ConfigFiltro } from "./ConfigToolbar";

const FILTROS: ConfigFiltro[] = [
  { key: "todos", label: "Todos", count: 5 },
  { key: "sin-asignar", label: "Sin asignar", count: 2 },
  { key: "incompletos", label: "Incompletos", count: 1 },
  { key: "completos", label: "Completos", count: 2 },
];

describe("ConfigToolbar", () => {
  it("renders each filtro's label and count", () => {
    render(
      <ConfigToolbar
        search=""
        onSearch={vi.fn()}
        filtros={FILTROS}
        filtroActivo="todos"
        onFiltro={vi.fn()}
        total={5}
      />,
    );
    expect(screen.getByRole("button", { name: /Todos/ })).toHaveTextContent("5");
    expect(screen.getByRole("button", { name: /Incompletos/ })).toHaveTextContent("1");
  });

  it("marks the active filtro with aria-pressed=true and the rest false", () => {
    render(
      <ConfigToolbar
        search=""
        onSearch={vi.fn()}
        filtros={FILTROS}
        filtroActivo="completos"
        onFiltro={vi.fn()}
        total={5}
      />,
    );
    expect(screen.getByRole("button", { name: /Completos/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Todos/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onFiltro with the clicked filtro's key", async () => {
    const user = userEvent.setup();
    const onFiltro = vi.fn();
    render(
      <ConfigToolbar
        search=""
        onSearch={vi.fn()}
        filtros={FILTROS}
        filtroActivo="todos"
        onFiltro={onFiltro}
        total={5}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Incompletos/ }));
    expect(onFiltro).toHaveBeenCalledWith("incompletos");
  });

  it("calls onSearch as the user types in the search box", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <ConfigToolbar
        search=""
        onSearch={onSearch}
        filtros={FILTROS}
        filtroActivo="todos"
        onFiltro={vi.fn()}
        total={5}
      />,
    );
    await user.type(screen.getByRole("textbox", { name: "Buscar" }), "a");
    expect(onSearch).toHaveBeenCalledWith("a");
  });

  it("renders the filtered total", () => {
    render(
      <ConfigToolbar
        search=""
        onSearch={vi.fn()}
        filtros={FILTROS}
        filtroActivo="todos"
        onFiltro={vi.fn()}
        total={3}
      />,
    );
    expect(screen.getByText("3 resultados")).toBeInTheDocument();
  });
});
