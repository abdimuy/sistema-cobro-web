import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BorradorComposer } from "./BorradorComposer";
import { BandejaProvider } from "../../presentation/context/BandejaContext";
import { FakeBandejaPort } from "../../application/__tests__/fakeBandejaPort";
import type { Decision } from "../../domain/entities";

function buildDecision(overrides: Partial<Decision> = {}): Decision {
  return {
    intencion: "señal de compra",
    confianza: 88,
    senales: [],
    accion: "responder",
    borrador: "Tenemos el comedor Roma de 6 sillas. ¿Le late que le mande una foto?",
    evidencia: ["Última compra: sala (liquidada)", "Sugerido: comedor"],
    razonEscalamiento: "señal de compra directa (preguntó por producto)",
    resultado: "propuesto",
    createdAt: "2026-07-21T10:14:00Z",
    ...overrides,
  };
}

function renderComposer(port: FakeBandejaPort, onDone = vi.fn()) {
  return {
    onDone,
    ...render(
      <BandejaProvider port={port}>
        <BorradorComposer clienteId={1001} decision={buildDecision()} onDone={onDone} />
      </BandejaProvider>,
    ),
  };
}

describe("BorradorComposer", () => {
  it("renders the borrador, binary confianza, por qué, evidencia chips and the 4 actions", () => {
    const port = new FakeBandejaPort();
    renderComposer(port);

    expect(
      screen.getByText(/Tenemos el comedor Roma de 6 sillas/),
    ).toBeInTheDocument();
    expect(screen.getByText("Confianza alta")).toBeInTheDocument();
    expect(screen.getByTitle("Confianza del modelo: 88%")).toBeInTheDocument();
    expect(screen.getByText(/señal de compra directa/)).toBeInTheDocument();
    expect(screen.getByText("Última compra: sala (liquidada)", { exact: false })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Aprobar y enviar/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dictar/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Escalar a mí/ })).toBeInTheDocument();
  });

  it("shows the binary label for low confidence without a permanently visible percentage", () => {
    const port = new FakeBandejaPort();
    render(
      <BandejaProvider port={port}>
        <BorradorComposer clienteId={1001} decision={buildDecision({ confianza: 40 })} onDone={vi.fn()} />
      </BandejaProvider>,
    );
    expect(screen.getByText("Confianza baja")).toBeInTheDocument();
    expect(screen.queryByText("40%")).not.toBeInTheDocument();
    expect(screen.getByTitle("Confianza del modelo: 40%")).toBeInTheDocument();
  });

  it("Aprobar calls port.aprobar with the clienteId and triggers onDone (refetch)", async () => {
    const port = new FakeBandejaPort();
    const user = userEvent.setup();
    const { onDone } = renderComposer(port);

    await user.click(screen.getByRole("button", { name: /Aprobar y enviar/ }));

    await waitFor(() => expect(port.aprobarCalls).toEqual([{ clienteId: 1001 }]));
    expect(onDone).toHaveBeenCalled();
  });

  it("Editar reveals a textarea seeded with the borrador; Guardar calls port.editar with the edited text", async () => {
    const port = new FakeBandejaPort();
    const user = userEvent.setup();
    const { onDone } = renderComposer(port);

    await user.click(screen.getByRole("button", { name: "Editar" }));
    const textarea = screen.getByLabelText("Editar borrador");
    expect(textarea).toHaveValue(
      "Tenemos el comedor Roma de 6 sillas. ¿Le late que le mande una foto?",
    );

    await user.clear(textarea);
    await user.type(textarea, "Nuevo texto editado por el operador");
    await user.click(screen.getByRole("button", { name: "Guardar y enviar" }));

    await waitFor(() =>
      expect(port.editarCalls).toEqual([
        { clienteId: 1001, texto: "Nuevo texto editado por el operador" },
      ]),
    );
    expect(onDone).toHaveBeenCalled();
  });

  it("Guardar y enviar is disabled when the edited text is empty", async () => {
    const port = new FakeBandejaPort();
    const user = userEvent.setup();
    renderComposer(port);

    await user.click(screen.getByRole("button", { name: "Editar" }));
    const textarea = screen.getByLabelText("Editar borrador");
    await user.clear(textarea);

    expect(screen.getByRole("button", { name: "Guardar y enviar" })).toBeDisabled();
  });

  it("Dictar reveals an intent input; submitting calls port.dictar", async () => {
    const port = new FakeBandejaPort();
    const user = userEvent.setup();
    renderComposer(port);

    await user.click(screen.getByRole("button", { name: /Dictar/ }));
    const input = screen.getByLabelText("Dictar intención");
    await user.type(input, "ofrécele el comedor con enganche de $500");
    await user.click(screen.getByRole("button", { name: "Generar" }));

    await waitFor(() =>
      expect(port.dictarCalls).toEqual([
        { clienteId: 1001, intencion: "ofrécele el comedor con enganche de $500" },
      ]),
    );
  });

  it("Escalar opens a confirm dialog; confirming calls port.escalar", async () => {
    const port = new FakeBandejaPort();
    const user = userEvent.setup();
    renderComposer(port);

    await user.click(screen.getByRole("button", { name: /Escalar a mí/ }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Escalar conversación")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Escalar a mí" }));

    await waitFor(() =>
      expect(port.escalarCalls).toEqual([{ clienteId: 1001, asignadoA: "" }]),
    );
  });
});
