import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Burbuja } from "./Burbuja";
import type { Turno } from "../../domain/entities";

describe("Burbuja", () => {
  it("renders an entrante turno as a left/in bubble", () => {
    const turno: Turno = {
      direccion: "entrante",
      autor: "cliente",
      cuerpo: "¿qué tienen de comedores?",
      mensajeRef: "",
      createdAt: "2026-07-21T10:14:00",
    };
    render(<Burbuja turno={turno} />);
    const bubble = screen.getByTestId("turno-bubble");
    expect(bubble).toHaveClass("bandeja-bub-in");
    expect(bubble).toHaveTextContent("¿qué tienen de comedores?");
    expect(bubble).not.toHaveTextContent("aprobado");
  });

  it("renders a saliente turno linked to a send with the aprobado hint", () => {
    const turno: Turno = {
      direccion: "saliente",
      autor: "ia",
      cuerpo: "¡Felicidades por completar su pago!",
      mensajeRef: "msg-123",
      createdAt: "2026-07-21T10:02:00",
    };
    render(<Burbuja turno={turno} />);
    const bubble = screen.getByTestId("turno-bubble");
    expect(bubble).toHaveClass("bandeja-bub-out");
    expect(bubble).toHaveTextContent("aprobado");
  });

  it("does not show the aprobado hint for a saliente turno without mensajeRef", () => {
    const turno: Turno = {
      direccion: "saliente",
      autor: "humano",
      cuerpo: "hola",
      mensajeRef: "",
      createdAt: "2026-07-21T10:02:00",
    };
    render(<Burbuja turno={turno} />);
    expect(screen.getByTestId("turno-bubble")).not.toHaveTextContent("aprobado");
  });
});
