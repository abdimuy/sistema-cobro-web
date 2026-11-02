import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParaRevisar } from "../ParaRevisar";
import { makeSenal } from "../../../application/__tests__/fakeDesempenoPort";

const base = { inicioDia: "2026-10-14T14:00:00Z", finDia: "2026-10-14T17:28:00Z", onSeleccionar: vi.fn() };

describe("ParaRevisar: inicio primero, fin último", () => {
  it("con día terminado: Inicio del día, señales y Fin del día al final", () => {
    render(<ParaRevisar {...base} senales={[makeSenal()]} finEsCierre />);
    const inicio = screen.getByTestId("evento-inicio");
    const fin = screen.getByTestId("evento-fin");
    expect(fin).toHaveTextContent("Fin del día");
    expect(fin).toHaveTextContent("11:28");
    const tarjeta = inicio.parentElement!;
    const hijos = [...tarjeta.children];
    expect(hijos[1]).toBe(inicio);
    expect(hijos[hijos.length - 1]).toBe(fin);
    const senal = screen.getByText("Pausa de 1 h 12 min");
    expect(inicio.compareDocumentPosition(senal) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(senal.compareDocumentPosition(fin) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("con el día en curso la última fila dice Última actividad", () => {
    render(<ParaRevisar {...base} senales={[]} finEsCierre={false} />);
    expect(screen.getByTestId("evento-fin")).toHaveTextContent("Última actividad");
    expect(screen.queryByText("Fin del día")).not.toBeInTheDocument();
  });
});
