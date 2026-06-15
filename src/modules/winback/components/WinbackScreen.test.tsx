import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WinbackProvider } from "../presentation/context/WinbackContext";
import { WinbackScreen } from "./WinbackScreen";
import {
  FakeWinbackPort,
  makeFakeWinbackItem,
  makeFakeAttribution,
} from "../application/__tests__/fakeWinbackPort";

// Helpers -----------------------------------------------------------------

function renderScreen(port: FakeWinbackPort) {
  return render(
    <WinbackProvider port={port}>
      <WinbackScreen />
    </WinbackProvider>,
  );
}

// Tests -------------------------------------------------------------------

describe("WinbackScreen", () => {
  let port: FakeWinbackPort;

  beforeEach(() => {
    port = new FakeWinbackPort();
    port.listarResponse = {
      items: [
        makeFakeWinbackItem({ clienteId: 1001, nombre: "MUEBLES HERNANDEZ SA" }),
        makeFakeWinbackItem({ clienteId: 1002, nombre: "DISTRIBUIDORA TORRES" }),
      ],
    };
    port.attributionResponse = makeFakeAttribution();
    port.refrescarResponse = { estado: "iniciado", mensaje: "enqueued" };
  });

  it("renders the screen title", () => {
    renderScreen(port);
    expect(screen.getByText("Winback")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    renderScreen(port);
    expect(
      screen.getByText(/potencial de recompra/i),
    ).toBeInTheDocument();
  });

  it("shows a client nombre in the table after loading", async () => {
    renderScreen(port);
    await waitFor(() =>
      expect(screen.getByText("MUEBLES HERNANDEZ SA")).toBeInTheDocument(),
    );
  });

  it("shows the second client nombre too", async () => {
    renderScreen(port);
    await waitFor(() =>
      expect(screen.getByText("DISTRIBUIDORA TORRES")).toBeInTheDocument(),
    );
  });

  it("renders the Refrescar button", () => {
    renderScreen(port);
    expect(
      screen.getByTestId("refrescar-button"),
    ).toBeInTheDocument();
  });

  it("calls port.refrescar when the Refrescar button is clicked", async () => {
    renderScreen(port);

    const btn = screen.getByTestId("refrescar-button");
    await userEvent.click(btn);

    await waitFor(() =>
      expect(port.refrescarCalls.length).toBeGreaterThanOrEqual(1),
    );
    expect(port.refrescarCalls[0].input).toMatchObject({ full: false });
  });

  it("renders the attribution panel heading", async () => {
    renderScreen(port);
    // Panel header is always present
    await waitFor(() =>
      expect(screen.getByText("Atribución")).toBeInTheDocument(),
    );
  });

  it("shows uplift value from attribution", async () => {
    renderScreen(port);
    // makeFakeAttribution returns uplift "0.20" → should display +20%
    await waitFor(() =>
      expect(screen.getByText("+20%")).toBeInTheDocument(),
    );
  });

  it("renders the detail drawer closed initially", async () => {
    renderScreen(port);
    await waitFor(() =>
      expect(screen.getByText("MUEBLES HERNANDEZ SA")).toBeInTheDocument(),
    );
    // Sheet is closed — the "Llamar" button inside the drawer is not rendered
    expect(screen.queryByText("Llamar")).not.toBeInTheDocument();
  });
});
