import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
    // "Cobrador" also appears as a column header in CobradorRanking while loading;
    // scope to the filter bar to avoid a multi-match error.
    const filterBar = await screen.findByTestId("cartera-filters");
    expect(within(filterBar).getByText("Cobrador")).toBeInTheDocument();
  });

  it("renders the periodo filter", async () => {
    renderScreen(port);
    expect(await screen.findByText("Periodo")).toBeInTheDocument();
  });

  it("renders the KPI hero once salud loads", async () => {
    renderScreen(port);
    // "PAR" also appears as a column header in CobradorRanking while loading;
    // scope to the KPI hero to avoid a stale-element error.
    const kpiHero = await screen.findByTestId("cartera-kpi-hero");
    expect(within(kpiHero).getByText("PAR")).toBeInTheDocument();
    expect(within(kpiHero).getByText("Tasa de cobranza")).toBeInTheDocument();
  });

  it("renders the aging panel title", async () => {
    renderScreen(port);
    expect(await screen.findByText("Antigüedad de saldos")).toBeInTheDocument();
  });

  it("renders the deterioration chip", async () => {
    renderScreen(port);
    expect(await screen.findByText(/deterioro/i)).toBeInTheDocument();
  });

  it("does not show 'Sin datos' while aging is still loading", async () => {
    const slowPort = new FakeCarteraPort();
    slowPort.saludResponse = makeFakeSaludCartera();
    slowPort.rollRateResponse = makeFakeRollRate();
    // Aging never resolves — simulates in-flight concurrent fetch.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    slowPort.obtenerAging = () => new Promise<any>(() => {});
    renderScreen(slowPort);
    // Wait for salud to render (aging is still in-flight).
    await screen.findByText("PAR");
    expect(screen.queryByText(/sin datos/i)).not.toBeInTheDocument();
  });
});
