import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hilo } from "./Hilo";
import type { Turno } from "../../domain/entities";

describe("Hilo", () => {
  it("renders an empty state when there are no turnos", () => {
    render(<Hilo turnos={[]} />);
    expect(screen.getByText("Aún no hay mensajes")).toBeInTheDocument();
  });

  it("renders bubbles chronologically with a single day separator for same-day turnos", () => {
    const turnos: Turno[] = [
      {
        direccion: "saliente",
        autor: "ia",
        cuerpo: "¡Felicidades por completar su pago!",
        mensajeRef: "msg-1",
        createdAt: "2026-07-21T10:02:00",
      },
      {
        direccion: "entrante",
        autor: "cliente",
        cuerpo: "¿qué tienen de comedores?",
        mensajeRef: "",
        createdAt: "2026-07-21T10:14:00",
      },
    ];

    render(<Hilo turnos={turnos} />);

    const bubbles = screen.getAllByTestId("turno-bubble");
    expect(bubbles).toHaveLength(2);
    expect(bubbles[0]).toHaveTextContent("¡Felicidades por completar su pago!");
    expect(bubbles[1]).toHaveTextContent("¿qué tienen de comedores?");

    // Same calendar day → exactly one separator, not one per bubble.
    const seps = document.querySelectorAll(".bandeja-daysep");
    expect(seps).toHaveLength(1);
  });
});
