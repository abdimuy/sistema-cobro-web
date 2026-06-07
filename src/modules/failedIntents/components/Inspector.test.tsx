import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Inspector } from "./Inspector";
import { makeFakeIntent } from "../application/__tests__/fakeRepoPort";
import { IntentStatus } from "../domain/values";

async function clickActionsTab() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: /acciones/i }));
}

describe("Inspector", () => {
  it("shows the placeholder when no intent is selected", () => {
    render(
      <Inspector
        intent={null}
        isLoading={false}
        onAction={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/seleccioná un intento/i)).toBeInTheDocument();
  });

  it("paints method + path + HTTP status header for a JSON intent", () => {
    const intent = makeFakeIntent();
    render(
      <Inspector
        intent={intent}
        isLoading={false}
        onAction={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("POST /v2/ventas")).toBeInTheDocument();
    expect(screen.getByText(/HTTP 422/i)).toBeInTheDocument();
  });

  it("disables the Replay con correcciones button for blob intents", async () => {
    const intent = makeFakeIntent({ hasBlob: true });
    render(
      <Inspector
        intent={intent}
        isLoading={false}
        onAction={() => {}}
        onClose={() => {}}
      />,
    );
    await clickActionsTab();
    const btn = screen.getByTestId("action-replay-con-correcciones");
    expect(btn).toBeDisabled();
  });

  it("Replay tal cual is enabled for a `new` JSON intent", async () => {
    const intent = makeFakeIntent({
      hasBlob: false,
      status: IntentStatus.create("new") as IntentStatus,
    });
    render(
      <Inspector
        intent={intent}
        isLoading={false}
        onAction={() => {}}
        onClose={() => {}}
      />,
    );
    await clickActionsTab();
    expect(screen.getByTestId("action-replay-tal-cual")).not.toBeDisabled();
  });

  it("calls onAction('replay') when Replay tal cual is clicked", async () => {
    const intent = makeFakeIntent();
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(
      <Inspector
        intent={intent}
        isLoading={false}
        onAction={onAction}
        onClose={() => {}}
      />,
    );
    await clickActionsTab();
    await user.click(screen.getByTestId("action-replay-tal-cual"));
    expect(onAction).toHaveBeenCalledWith("replay");
  });

  it("disables every action when the intent is terminal (ignored)", async () => {
    const intent = makeFakeIntent({
      status: IntentStatus.create("ignored") as IntentStatus,
      hasBlob: false,
    });
    render(
      <Inspector
        intent={intent}
        isLoading={false}
        onAction={() => {}}
        onClose={() => {}}
      />,
    );
    await clickActionsTab();
    expect(screen.getByTestId("action-replay-tal-cual")).toBeDisabled();
    expect(
      screen.getByTestId("action-replay-con-correcciones"),
    ).toBeDisabled();
    expect(
      screen.getByTestId("action-marcar-como-resuelto"),
    ).toBeDisabled();
  });

  it("surfaces an error message banner", () => {
    const intent = makeFakeIntent();
    render(
      <Inspector
        intent={intent}
        isLoading={false}
        errorMessage="no se pudo cargar"
        onAction={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument();
  });
});
