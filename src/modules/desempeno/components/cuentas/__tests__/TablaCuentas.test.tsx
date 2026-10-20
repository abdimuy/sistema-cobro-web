import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FILAS_INICIALES, TablaCuentas } from "../TablaCuentas";
import { makeCuenta } from "../../../application/__tests__/fakeDesempenoPort";

let disparar: () => void = () => {};
beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IntersectionObserverCallback) {
        disparar = () =>
          cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

const lista = (n: number) => Array.from({ length: n }, (_, i) => makeCuenta({ ventaId: i + 1 }));

describe("TablaCuentas (D26)", () => {
  it("pinta 60 filas y 60 más al acercarse al final", () => {
    render(<TablaCuentas cuentas={lista(150)} onAbrir={() => {}} />);
    expect(screen.getAllByTestId("fila-cuenta")).toHaveLength(FILAS_INICIALES);
    act(() => disparar());
    expect(screen.getAllByTestId("fila-cuenta")).toHaveLength(120);
    act(() => disparar());
    expect(screen.getAllByTestId("fila-cuenta")).toHaveLength(150);
  });

  it("al cambiar la lista vuelve a 60", () => {
    const muchas = lista(150);
    const { rerender } = render(<TablaCuentas cuentas={muchas} onAbrir={() => {}} />);
    act(() => disparar());
    expect(screen.getAllByTestId("fila-cuenta")).toHaveLength(120);
    rerender(<TablaCuentas cuentas={muchas.slice(0, 100)} onAbrir={() => {}} />);
    expect(screen.getAllByTestId("fila-cuenta")).toHaveLength(60);
  });

  it("con pocas cuentas las pinta todas", () => {
    render(<TablaCuentas cuentas={lista(5)} onAbrir={() => {}} />);
    expect(screen.getAllByTestId("fila-cuenta")).toHaveLength(5);
  });
});

describe("TablaCuentas: asignar visita (visitas P3, Tarea 9)", () => {
  it("el botón de la fila asigna sin abrir la venta", async () => {
    const user = userEvent.setup();
    const onAbrir = vi.fn();
    const onAsignar = vi.fn();
    const cuenta = makeCuenta({ ventaId: 13785217, doctoPvId: 9934 });
    render(<TablaCuentas cuentas={[cuenta]} onAbrir={onAbrir} onAsignar={onAsignar} />);
    await user.click(within(screen.getByTestId("fila-cuenta")).getByRole("button", { name: "Asignar visita" }));
    expect(onAsignar).toHaveBeenCalledWith(cuenta);
    expect(onAbrir).not.toHaveBeenCalled();
  });

  it("sin onAsignar no hay botón", () => {
    render(<TablaCuentas cuentas={lista(1)} onAbrir={() => {}} />);
    expect(screen.queryByRole("button", { name: "Asignar visita" })).toBeNull();
  });
});
