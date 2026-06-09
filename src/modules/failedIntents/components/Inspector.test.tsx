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

  it("Editar y reenviar is enabled for blob intents (multipart editor)", async () => {
    const intent = makeFakeIntent({
      hasBlob: true,
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
    const btn = screen.getByTestId("action-editar-y-reenviar");
    expect(btn).not.toBeDisabled();
    // The description tells the operator the editor handles parts +
    // files, not just JSON.
    expect(btn.textContent).toMatch(/multipart|archivos|campos/i);
  });

  it("Reenviar sin cambios is enabled for a `new` JSON intent", async () => {
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
    expect(screen.getByTestId("action-reenviar-sin-cambios")).not.toBeDisabled();
  });

  it("calls onAction('replay') when Reenviar sin cambios is clicked", async () => {
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
    await user.click(screen.getByTestId("action-reenviar-sin-cambios"));
    expect(onAction).toHaveBeenCalledWith("replay");
  });

  it("keeps reenviar actions enabled in retried_fail (la venta sigue sin guardarse)", async () => {
    // Caso real: vendedor capturó una venta, falló por validación, la app
    // hizo replay, falló otra vez (retried_fail). La venta NO se guardó.
    // El operador debe poder corregir y reintentar — siempre.
    const intent = makeFakeIntent({
      status: IntentStatus.create("retried_fail") as IntentStatus,
      hasBlob: true,
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
    expect(screen.getByTestId("action-reenviar-sin-cambios")).not.toBeDisabled();
    expect(screen.getByTestId("action-editar-y-reenviar")).not.toBeDisabled();
    // Resolver sí queda bloqueado en estados terminales — el backend exige
    // status='new' para UpdateStatus.
    expect(screen.getByTestId("action-marcar-como-resuelto")).toBeDisabled();
  });

  it.each([
    ["retried_ok", "ya se guardó la venta — otro reenvío duplicaría"],
    ["resolved_manual", "el operador ya cerró el intent"],
    ["ignored", "el operador descartó el intent"],
  ])(
    "disables every action when intent is %s (%s)",
    async (statusValue) => {
      // Contrato: cuando el intent ya está cerrado (con éxito o por
      // decisión del operador), NO se debe poder reenviar — un reenvío
      // crearía data duplicada porque cada replay genera una idempotency
      // key nueva.
      const intent = makeFakeIntent({
        status: IntentStatus.create(statusValue) as IntentStatus,
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
      expect(screen.getByTestId("action-reenviar-sin-cambios")).toBeDisabled();
      expect(screen.getByTestId("action-editar-y-reenviar")).toBeDisabled();
      expect(screen.getByTestId("action-marcar-como-resuelto")).toBeDisabled();
    },
  );

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
