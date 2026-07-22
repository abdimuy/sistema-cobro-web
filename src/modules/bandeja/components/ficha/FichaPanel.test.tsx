import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaPanel } from "./FichaPanel";
import { makeFakeConversacionDetalle } from "../../application/__tests__/fakeBandejaPort";
import { DomainError } from "../../domain/errors";

describe("FichaPanel", () => {
  it("shows loading/error/empty states", () => {
    const { rerender } = render(<FichaPanel detalle={null} loading error={null} />);
    expect(screen.getByText("Cargando ficha…")).toBeInTheDocument();

    rerender(
      <FichaPanel
        detalle={null}
        loading={false}
        error={new DomainError("boom", "no se pudo cargar la ficha")}
      />,
    );
    expect(screen.getByText("no se pudo cargar la ficha")).toBeInTheDocument();

    rerender(<FichaPanel detalle={null} loading={false} error={null} />);
    expect(screen.getByText("Selecciona una conversación")).toBeInTheDocument();
  });

  it("renders identity + nota destilada + banderas + La IA recomienda", () => {
    const detalle = makeFakeConversacionDetalle({
      conversacion: {
        clienteId: 1001,
        nombre: "MARÍA LÓPEZ",
        segmento: "recien_liquidado",
        telefono: "+52 238 000 4521",
        estado: "conversando",
        asignadoA: "",
        contextoNota: "Paga puntual y completo. Mejor contactar por la tarde.",
        banderas: ["Cuenta compartida con otro cliente"],
        resumenMemoria: "",
        createdAt: "2026-07-21T10:00:00Z",
        updatedAt: "2026-07-21T10:14:00Z",
      },
      decisiones: [
        {
          intencion: "señal de compra",
          confianza: 88,
          senales: [],
          accion: "ofrecer_comedor",
          borrador: "Tenemos el comedor Roma de 6 sillas.",
          evidencia: [],
          razonEscalamiento: "",
          resultado: "propuesto",
          createdAt: "2026-07-21T10:14:00Z",
        },
      ],
    });

    render(<FichaPanel detalle={detalle} loading={false} error={null} />);

    expect(screen.getByText("MARÍA LÓPEZ")).toBeInTheDocument();
    expect(screen.getByText("recién liq.")).toBeInTheDocument();
    expect(screen.getByText("Conversando")).toBeInTheDocument();

    expect(
      screen.getByText(/Paga puntual y completo/),
    ).toBeInTheDocument();
    expect(screen.getByText(/contexto privado/i)).toBeInTheDocument();

    expect(screen.getByText("Cuenta compartida con otro cliente")).toBeInTheDocument();

    expect(screen.getByText("Ofrecer comedor")).toBeInTheDocument();
    expect(screen.getByText(/88% · alta/)).toBeInTheDocument();
    expect(screen.getByText(/Dentro del allowlist/)).toBeInTheDocument();
  });

  it("hides the nota card when contextoNota is empty and the banderas card when banderas is empty", () => {
    const detalle = makeFakeConversacionDetalle({
      conversacion: {
        ...makeFakeConversacionDetalle().conversacion,
        contextoNota: "",
        banderas: [],
      },
      decisiones: [],
    });
    render(<FichaPanel detalle={detalle} loading={false} error={null} />);

    expect(screen.queryByText(/De la nota del cobrador/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Banderas/)).not.toBeInTheDocument();
    expect(screen.queryByText(/La IA recomienda/)).not.toBeInTheDocument();
  });

  it("SAFETY: never renders the raw decision.borrador text, even when it looks like a debt figure", () => {
    const detalle = makeFakeConversacionDetalle({
      conversacion: {
        ...makeFakeConversacionDetalle().conversacion,
        contextoNota: "Paga puntual",
        banderas: [],
      },
      decisiones: [
        {
          intencion: "cobranza",
          confianza: 90,
          senales: [],
          accion: "responder",
          borrador: "Le recordamos que debe $3,542.80 desde hace 47 días, favor de liquidar.",
          evidencia: [],
          razonEscalamiento: "",
          resultado: "propuesto",
          createdAt: "2026-07-21T10:14:00Z",
        },
      ],
    });

    const { container } = render(<FichaPanel detalle={detalle} loading={false} error={null} />);

    expect(container.textContent).not.toContain("3,542.80");
    expect(container.textContent).not.toContain("debe $");
    expect(container.textContent).not.toContain("47 días");
  });
});
