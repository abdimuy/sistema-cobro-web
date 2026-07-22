import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BriefingEscalada } from "./BriefingEscalada";
import { BandejaProvider } from "../../presentation/context/BandejaContext";
import { FakeBandejaPort, makeFakeConversacionDetalle } from "../../application/__tests__/fakeBandejaPort";
import type { ConversacionDetalle, Decision } from "../../domain/entities";

function buildDetalle(decision: Partial<Decision>): ConversacionDetalle {
  const base: Decision = {
    intencion: "",
    confianza: 0,
    senales: [],
    accion: "",
    borrador: "",
    evidencia: [],
    razonEscalamiento: "",
    resultado: "",
    createdAt: "2026-07-21T10:14:00Z",
  };
  return makeFakeConversacionDetalle({
    conversacion: { ...makeFakeConversacionDetalle().conversacion, estado: "escalado" },
    decisiones: [{ ...base, ...decision }],
  });
}

function renderBriefing(port: FakeBandejaPort, detalle: ConversacionDetalle, onDone = vi.fn()) {
  return {
    onDone,
    ...render(
      <BandejaProvider port={port}>
        <BriefingEscalada clienteId={1001} detalle={detalle} onDone={onDone} />
      </BandejaProvider>,
    ),
  };
}

describe("BriefingEscalada", () => {
  it("renders the amber briefing fields, the deuda-specific next step, and the three actions", () => {
    const port = new FakeBandejaPort();
    const detalle = buildDetalle({
      intencion: "duda sobre una posible deuda de un tercero",
      confianza: 92,
      senales: ["deuda_mencionada"],
      accion: "escalar",
      razonEscalamiento: "mención de deuda = sensible",
      resultado: "escalado",
    });

    renderBriefing(port, detalle);

    const briefing = screen.getByTestId("briefing-escalada");
    expect(within(briefing).getByText("duda sobre una posible deuda de un tercero")).toBeInTheDocument();
    expect(within(briefing).getByText("mención de deuda = sensible")).toBeInTheDocument();
    expect(within(briefing).getByText("Alta (92%)")).toBeInTheDocument();
    expect(within(briefing).getByText("Deuda mencionada")).toBeInTheDocument();
    expect(within(briefing).getByText("Pausó · no tocó la deuda")).toBeInTheDocument();
    expect(within(briefing).getByText(/Aclarar que es otro tema/)).toBeInTheDocument();
    expect(within(briefing).getByText(/mantén la venta viva sin tocar la deuda/)).toBeInTheDocument();

    expect(screen.getByTestId("brief-flagline")).toHaveTextContent("Deuda mencionada");

    expect(screen.getByRole("button", { name: "Tomar la conversación" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dictar respuesta/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reasignar" })).toBeInTheDocument();

    // SAFETY: never a debt figure, never raw cobrador-note text.
    expect(screen.queryByText(/\$[\d,.]+/)).not.toBeInTheDocument();
    expect(screen.queryByText("Paga puntual y completo.")).not.toBeInTheDocument();
  });

  it("renders the generic next step for a non-deuda escalation (confianza baja)", () => {
    const port = new FakeBandejaPort();
    const detalle = buildDetalle({
      intencion: "mensaje ambiguo",
      confianza: 40,
      senales: [],
      accion: "escalar",
      razonEscalamiento: "confianza baja",
      resultado: "escalado",
    });

    renderBriefing(port, detalle);

    expect(screen.getByText("Baja (40%)")).toBeInTheDocument();
    expect(screen.getByText("Pausó · escaló a un humano")).toBeInTheDocument();
    expect(screen.getByText(/Responder tú directamente/)).toBeInTheDocument();
    expect(screen.queryByText(/Aclarar que es otro tema/)).not.toBeInTheDocument();
    expect(screen.getByText("Sin señales adicionales registradas")).toBeInTheDocument();
  });

  it("Tomar la conversación opens a confirm dialog and confirming calls port.escalar", async () => {
    const port = new FakeBandejaPort();
    const user = userEvent.setup();
    const detalle = buildDetalle({ razonEscalamiento: "deuda" });
    const { onDone } = renderBriefing(port, detalle);

    await user.click(screen.getByRole("button", { name: "Tomar la conversación" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByRole("heading", { name: "Tomar la conversación" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Tomar la conversación" }));

    await waitFor(() => expect(port.escalarCalls).toEqual([{ clienteId: 1001, asignadoA: "" }]));
    expect(onDone).toHaveBeenCalled();
  });

  it("Dictar respuesta reveals an intent input; submitting calls port.dictar", async () => {
    const port = new FakeBandejaPort();
    const user = userEvent.setup();
    const detalle = buildDetalle({ razonEscalamiento: "confianza baja" });
    renderBriefing(port, detalle);

    await user.click(screen.getByRole("button", { name: /Dictar respuesta/ }));
    const input = screen.getByLabelText("Dictar respuesta");
    await user.type(input, "explícale que ya no debe nada");
    await user.click(screen.getByRole("button", { name: "Generar" }));

    await waitFor(() =>
      expect(port.dictarCalls).toEqual([
        { clienteId: 1001, intencion: "explícale que ya no debe nada" },
      ]),
    );
  });

  it("Reasignar reveals an assignee input; submitting calls port.escalar with the typed value", async () => {
    const port = new FakeBandejaPort();
    const user = userEvent.setup();
    const detalle = buildDetalle({ razonEscalamiento: "deuda" });
    renderBriefing(port, detalle);

    await user.click(screen.getByRole("button", { name: "Reasignar" }));
    const input = screen.getByLabelText("Asignar a");
    await user.type(input, "cobranza");
    await user.click(screen.getByRole("button", { name: "Escalar" }));

    await waitFor(() =>
      expect(port.escalarCalls).toEqual([{ clienteId: 1001, asignadoA: "cobranza" }]),
    );
  });

  it("shows an empty fallback when there is no decision to explain the escalation", () => {
    const port = new FakeBandejaPort();
    const detalle = makeFakeConversacionDetalle({
      conversacion: { ...makeFakeConversacionDetalle().conversacion, estado: "escalado" },
      decisiones: [],
    });
    renderBriefing(port, detalle);
    expect(screen.queryByTestId("briefing-escalada")).not.toBeInTheDocument();
    expect(screen.getByText(/Sin detalle de la decisión/)).toBeInTheDocument();
  });
});
