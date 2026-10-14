import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registrar = vi.fn();
vi.mock("@/lib/bitacora", () => ({
  registrar: (...args: unknown[]) => registrar(...args),
}));

import { ErrorBoundaryRaiz } from "../ErrorBoundaryRaiz";

function Revienta(): JSX.Element {
  throw new Error("fallo de prueba en render");
}

describe("ErrorBoundaryRaiz", () => {
  beforeEach(() => {
    registrar.mockClear();
    // React imprime el error capturado en consola; se silencia para no
    // ensuciar la salida, sin ocultar que la prueba lo provoca a propósito.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra a sus hijos cuando nada falla", () => {
    render(
      <ErrorBoundaryRaiz>
        <p>contenido normal</p>
      </ErrorBoundaryRaiz>,
    );
    expect(screen.getByText("contenido normal")).toBeInTheDocument();
  });

  it("un hijo que lanza en render muestra el aviso en español, no una pantalla vacía", () => {
    const { container } = render(
      <ErrorBoundaryRaiz>
        <Revienta />
      </ErrorBoundaryRaiz>,
    );
    expect(
      screen.getByText("Algo falló al mostrar esta pantalla"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recargar" })).toBeInTheDocument();
    expect(container.textContent?.trim()).not.toBe("");
  });

  it("registra el error en la bitácora con nivel error", () => {
    render(
      <ErrorBoundaryRaiz>
        <Revienta />
      </ErrorBoundaryRaiz>,
    );
    expect(registrar).toHaveBeenCalledWith(
      "error",
      expect.stringContaining("fallo de prueba en render"),
    );
  });

  it("el botón Recargar recarga la página", async () => {
    const recargar = vi.fn();
    render(
      <ErrorBoundaryRaiz recargar={recargar}>
        <Revienta />
      </ErrorBoundaryRaiz>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Recargar" }));
    expect(recargar).toHaveBeenCalledTimes(1);
  });
});
