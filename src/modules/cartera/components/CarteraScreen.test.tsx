import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CarteraProvider } from "../presentation/context/CarteraContext";
import { CarteraScreen } from "./CarteraScreen";
import {
  FakeCarteraPort,
  makeFakeSaludCartera,
  makeFakeAgingBucket,
  makeFakeRollRate,
} from "../application/__tests__/fakeCarteraPort";

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
    port.agingResponse = [makeFakeAgingBucket({ bucket: "0-30" })];
    port.rollRateResponse = makeFakeRollRate();
  });

  it("renders the screen title", async () => {
    renderScreen(port);
    expect(await screen.findByText("Cartera")).toBeInTheDocument();
  });

  it("renders the subtitle", async () => {
    renderScreen(port);
    expect(await screen.findByText(/salud del portafolio/i)).toBeInTheDocument();
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

  it("renders the KPI hero once salud loads", async () => {
    renderScreen(port);
    expect(await screen.findByText("PAR")).toBeInTheDocument();
    expect(screen.getByText("Tasa de cobranza")).toBeInTheDocument();
  });

  it("renders the aging panel title", async () => {
    renderScreen(port);
    expect(await screen.findByText("Antigüedad de saldos")).toBeInTheDocument();
  });

  it("renders the deterioration chip", async () => {
    renderScreen(port);
    expect(await screen.findByText(/deterioro/i)).toBeInTheDocument();
  });
});
