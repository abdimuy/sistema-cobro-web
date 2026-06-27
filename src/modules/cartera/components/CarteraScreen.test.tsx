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

  it("renders the screen title", async () => {
    renderScreen(port);
    expect(await screen.findByText("Cartera")).toBeInTheDocument();
  });

  it("renders the subtitle", async () => {
    renderScreen(port);
    expect(
      await screen.findByText(/salud del portafolio/i),
    ).toBeInTheDocument();
  });

  it("renders the zona filter", async () => {
    renderScreen(port);
    expect(await screen.findByText("Zona")).toBeInTheDocument();
  });

  it("renders the cobrador filter", async () => {
    renderScreen(port);
    expect(await screen.findByText("Cobrador")).toBeInTheDocument();
  });

  it("renders the periodo filter", async () => {
    renderScreen(port);
    expect(await screen.findByText("Periodo")).toBeInTheDocument();
  });

  it("shows the empty state placeholder after loading", async () => {
    renderScreen(port);
    await waitFor(() =>
      expect(screen.getByText(/próximamente/i)).toBeInTheDocument(),
    );
  });
});
