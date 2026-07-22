import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConversacionPanel, type ConversacionPanelProps } from "./ConversacionPanel";
import { BandejaProvider } from "../../presentation/context/BandejaContext";
import { FakeBandejaPort, makeFakeConversacionDetalle } from "../../application/__tests__/fakeBandejaPort";
import { DomainError } from "../../domain/errors";

function renderPanel(props: Partial<ConversacionPanelProps> = {}) {
  const port = new FakeBandejaPort();
  return render(
    <BandejaProvider port={port}>
      <ConversacionPanel
        detalle={null}
        loading={false}
        error={null}
        onDone={vi.fn()}
        {...props}
      />
    </BandejaProvider>,
  );
}

describe("ConversacionPanel", () => {
  it("shows an empty state when nothing is selected", () => {
    renderPanel();
    expect(screen.getByText("Selecciona una conversación")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    renderPanel({ loading: true });
    expect(screen.getByText("Cargando conversación…")).toBeInTheDocument();
  });

  it("shows an error state", () => {
    renderPanel({ error: new DomainError("boom", "no se pudo cargar la conversación") });
    expect(screen.getByText("no se pudo cargar la conversación")).toBeInTheDocument();
  });

  it("renders the conv-head (nombre, segmento, teléfono enmascarado, estado) and the thread", () => {
    const detalle = makeFakeConversacionDetalle({
      conversacion: {
        clienteId: 1001,
        nombre: "MARÍA LÓPEZ",
        segmento: "recien_liquidado",
        telefono: "+52 238 000 4521",
        estado: "conversando",
        asignadoA: "",
        contextoNota: "",
        banderas: [],
        resumenMemoria: "",
        createdAt: "2026-07-21T10:00:00Z",
        updatedAt: "2026-07-21T10:14:00Z",
      },
      turnos: [
        {
          direccion: "entrante",
          autor: "cliente",
          cuerpo: "¿qué tienen de comedores?",
          mensajeRef: "",
          createdAt: "2026-07-21T10:14:00Z",
        },
      ],
      decisiones: [],
    });

    renderPanel({ detalle });

    expect(screen.getByText("MARÍA LÓPEZ")).toBeInTheDocument();
    expect(screen.getByText(/recién liq\./)).toBeInTheDocument();
    expect(screen.getByText(/238 ••• 4521/)).toBeInTheDocument();
    expect(screen.getByText("Conversando")).toBeInTheDocument();
    expect(screen.getByText("¿qué tienen de comedores?")).toBeInTheDocument();
  });

  it("renders the composer when the newest decision is responder+propuesto with a borrador", () => {
    const detalle = makeFakeConversacionDetalle({
      decisiones: [
        {
          intencion: "señal de compra",
          confianza: 88,
          senales: [],
          accion: "responder",
          borrador: "Tenemos el comedor Roma",
          evidencia: [],
          razonEscalamiento: "",
          resultado: "propuesto",
          createdAt: "2026-07-21T10:14:00Z",
        },
      ],
    });

    renderPanel({ detalle });
    expect(screen.getByTestId("borrador-composer")).toBeInTheDocument();
  });

  it("does not render the composer when there is no actionable decision (modo ninguno)", () => {
    renderPanel({ detalle: makeFakeConversacionDetalle({ decisiones: [] }) });
    expect(screen.queryByTestId("borrador-composer")).not.toBeInTheDocument();
  });

  it("renders a briefing placeholder (not the composer) when the conversation is escalada", () => {
    const detalle = makeFakeConversacionDetalle({
      conversacion: {
        ...makeFakeConversacionDetalle().conversacion,
        estado: "escalado",
      },
    });
    renderPanel({ detalle });
    expect(screen.queryByTestId("borrador-composer")).not.toBeInTheDocument();
    expect(screen.getByText(/fue escalada/)).toBeInTheDocument();
  });
});
