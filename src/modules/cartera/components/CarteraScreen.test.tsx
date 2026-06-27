import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CarteraProvider } from "../presentation/context/CarteraContext";
import { CarteraScreen } from "./CarteraScreen";
import { FakeCarteraPort, makeFakeSaludCartera } from "../application/__tests__/fakeCarteraPort";

function renderScreen(port: FakeCarteraPort) {
  return render(
    <CarteraProvider port={port}>
      <CarteraScreen />
    </CarteraProvider>,
  );
}

describe("CarteraScreen", () => {
  let port: FakeCarteraPort;

  beforeEach(() => {
    port = new FakeCarteraPort();
    port.saludResponse = makeFakeSaludCartera();
  });

  it("renders the screen title", () => {
    renderScreen(port);
    expect(screen.getByText("Cartera")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    renderScreen(port);
    expect(
      screen.getByText(/salud del portafolio/i),
    ).toBeInTheDocument();
  });

  it("renders the zona filter", () => {
    renderScreen(port);
    expect(screen.getByText("Zona")).toBeInTheDocument();
  });

  it("renders the cobrador filter", () => {
    renderScreen(port);
    expect(screen.getByText("Cobrador")).toBeInTheDocument();
  });

  it("renders the periodo filter", () => {
    renderScreen(port);
    expect(screen.getByText("Periodo")).toBeInTheDocument();
  });

  it("shows the empty state placeholder after loading", async () => {
    renderScreen(port);
    await waitFor(() =>
      expect(screen.getByText(/próximamente/i)).toBeInTheDocument(),
    );
  });
});
