import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SimularEntranteControl } from "./SimularEntranteControl";
import { BandejaProvider } from "../../presentation/context/BandejaContext";
import { FakeBandejaPort, makeFakeDecisionResult } from "../../application/__tests__/fakeBandejaPort";
import type { DecisionResult } from "../../domain/entities";

function renderControl(port: FakeBandejaPort, onDone = vi.fn()) {
  return {
    onDone,
    ...render(
      <BandejaProvider port={port}>
        <SimularEntranteControl onDone={onDone} />
      </BandejaProvider>,
    ),
  };
}

describe("SimularEntranteControl", () => {
  it("starts collapsed", () => {
    renderControl(new FakeBandejaPort());
    expect(screen.queryByLabelText("Mensaje a simular")).not.toBeInTheDocument();
  });

  it("entering a cliente_id + mensaje and clicking calls port.simularEntrante with those args and triggers refetch", async () => {
    const port = new FakeBandejaPort();
    const user = userEvent.setup();
    const { onDone } = renderControl(port);

    await user.click(screen.getByRole("button", { name: "🧪 Simular entrante" }));
    await user.type(screen.getByLabelText("Cliente ID a simular"), "1001");
    await user.type(screen.getByLabelText("Mensaje a simular"), "¿todavía tienen el comedor?");
    await user.click(screen.getByRole("button", { name: "Simular entrante" }));

    await waitFor(() =>
      expect(port.simularEntranteCalls).toEqual([
        { clienteId: 1001, mensaje: "¿todavía tienen el comedor?" },
      ]),
    );
    expect(onDone).toHaveBeenCalled();
  });

  it("the submit button is disabled while sending, and re-enabled once it resolves", async () => {
    const port = new FakeBandejaPort();
    let resolveFn: (v: DecisionResult) => void = () => {};
    port.simularEntranteResponse = () =>
      new Promise((resolve) => {
        resolveFn = resolve;
      });
    const user = userEvent.setup();
    renderControl(port);

    await user.click(screen.getByRole("button", { name: "🧪 Simular entrante" }));
    await user.type(screen.getByLabelText("Cliente ID a simular"), "1001");
    await user.type(screen.getByLabelText("Mensaje a simular"), "hola");

    const submit = screen.getByRole("button", { name: "Simular entrante" });
    await user.click(submit);

    expect(await screen.findByRole("button", { name: "Simulando…" })).toBeDisabled();

    resolveFn(makeFakeDecisionResult());

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Simular entrante" })).not.toBeDisabled(),
    );
  });

  it("the submit button stays disabled until both fields are filled", async () => {
    const port = new FakeBandejaPort();
    const user = userEvent.setup();
    renderControl(port);

    await user.click(screen.getByRole("button", { name: "🧪 Simular entrante" }));
    expect(screen.getByRole("button", { name: "Simular entrante" })).toBeDisabled();

    await user.type(screen.getByLabelText("Cliente ID a simular"), "1001");
    expect(screen.getByRole("button", { name: "Simular entrante" })).toBeDisabled();

    await user.type(screen.getByLabelText("Mensaje a simular"), "hola");
    expect(screen.getByRole("button", { name: "Simular entrante" })).not.toBeDisabled();
  });
});
