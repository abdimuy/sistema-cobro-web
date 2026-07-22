import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueueItem } from "./QueueItem";
import { makeFakeConversacionResumen } from "../../application/__tests__/fakeBandejaPort";

describe("QueueItem", () => {
  it("renders the segment chip, nombre and preview, and calls onClick", async () => {
    const item = makeFakeConversacionResumen({
      clienteId: 24037,
      nombre: "MINERVA LOPEZ",
      segmento: "recien_liquidado",
      ultimoMensaje: "¿qué tienen de comedores?",
      ultimaDecision: {
        intencion: "señal de compra",
        confianza: 88,
        accion: "responder",
        resultado: "pendiente",
        razonEscalamiento: "",
      },
    });
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<QueueItem item={item} active={false} onClick={onClick} />);

    expect(screen.getByText("recién liq.")).toBeInTheDocument();
    expect(screen.getByText("MINERVA LOPEZ")).toBeInTheDocument();
    expect(screen.getByText(/señal de compra/)).toBeInTheDocument();
    expect(screen.getByText(/qué tienen de comedores/)).toBeInTheDocument();

    await user.click(screen.getByTestId("queue-item-24037"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("marks the active item and shows a dashed dot for low confidence", () => {
    const item = makeFakeConversacionResumen({
      clienteId: 5,
      ultimaDecision: {
        intencion: "no se entiende",
        confianza: 30,
        accion: "responder",
        resultado: "propuesto",
        razonEscalamiento: "",
      },
    });
    render(<QueueItem item={item} active onClick={() => {}} />);

    expect(screen.getByTestId("queue-item-5")).toHaveClass("bandeja-qitem-active");
    expect(screen.getByText(/confianza baja/)).toBeInTheDocument();
  });
});
