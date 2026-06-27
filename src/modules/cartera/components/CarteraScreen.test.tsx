import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CarteraProvider } from "../presentation/context/CarteraContext";
import { CarteraScreen } from "./CarteraScreen";
import {
  FakeCarteraPort,
  makeFakeSaludCartera,
  makeFakeAgingBucket,
  makeFakeRollRate,
  makeFakeCobradorPerformance,
} from "../application/__tests__/fakeCarteraPort";

// Prevent network calls from useGetZonasCliente
vi.mock("@/modules/user/useGetZonaCliente", () => ({
  default: () => ({
    zonasCliente: [
      { ZONA_CLIENTE_ID: 10, ZONA_CLIENTE: "ZONA NORTE" },
      { ZONA_CLIENTE_ID: 20, ZONA_CLIENTE: "ZONA SUR" },
    ],
    error: "",
    isLoading: false,
  }),
}));

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
    // Both DeterioroChip and CarteraRollRate panel show "Deterioro"; assert ≥1 match.
    const matches = await screen.findAllByText(/deterioro/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("zona dropdown is populated from useGetZonasCliente (name labels, id values)", async () => {
    renderScreen(port);
    // Open the zona combobox (first one in the filter bar)
    const filterBar = await screen.findByTestId("cartera-filters");
    const zonaCombobox = within(filterBar).getAllByRole("combobox")[0];
    await userEvent.click(zonaCombobox);
    expect(screen.getByText("ZONA NORTE")).toBeInTheDocument();
    expect(screen.getByText("ZONA SUR")).toBeInTheDocument();
  });

  it("selecting a zona passes the zona ID to the cobradores hook", async () => {
    renderScreen(port);
    const filterBar = await screen.findByTestId("cartera-filters");
    const zonaCombobox = within(filterBar).getAllByRole("combobox")[0];
    await userEvent.click(zonaCombobox);
    await userEvent.click(screen.getByText("ZONA NORTE"));
    await waitFor(() =>
      expect(port.cobradoresCalls.some((c) => c.filters.zona === "10")).toBe(true),
    );
  });

  it("selecting a zona passes the zona ID to the salud hook", async () => {
    renderScreen(port);
    const filterBar = await screen.findByTestId("cartera-filters");
    const zonaCombobox = within(filterBar).getAllByRole("combobox")[0];
    await userEvent.click(zonaCombobox);
    await userEvent.click(screen.getByText("ZONA SUR"));
    await waitFor(() =>
      expect(port.saludCalls.some((c) => c.filters.zona === "20")).toBe(true),
    );
  });

  it("cobrador dropdown is populated from ranking data (name labels)", async () => {
    port.cobradoresResponse = [
      makeFakeCobradorPerformance({ cobradorId: 3, cobradorNombre: "GARCIA LOPEZ" }),
      makeFakeCobradorPerformance({ cobradorId: 7, cobradorNombre: "MARTINEZ RUIZ" }),
    ];
    renderScreen(port);
    const filterBar = await screen.findByTestId("cartera-filters");
    const cobradorCombobox = within(filterBar).getAllByRole("combobox")[1];
    await userEvent.click(cobradorCombobox);
    // options appear in the open listbox; names also appear in the ranking table rows
    await waitFor(() => {
      const garciaOpts = screen.getAllByText("GARCIA LOPEZ");
      expect(garciaOpts.length).toBeGreaterThanOrEqual(1);
      const martinezOpts = screen.getAllByText("MARTINEZ RUIZ");
      expect(martinezOpts.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("cobrador dropdown uses fallback label when cobradorNombre is empty", async () => {
    port.cobradoresResponse = [
      makeFakeCobradorPerformance({ cobradorId: 9, cobradorNombre: "" }),
    ];
    renderScreen(port);
    const filterBar = await screen.findByTestId("cartera-filters");
    const cobradorCombobox = within(filterBar).getAllByRole("combobox")[1];
    await userEvent.click(cobradorCombobox);
    await waitFor(() => {
      const fallbacks = screen.getAllByText("Cobrador #9");
      expect(fallbacks.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("does not show 'Sin datos' while aging is still loading", async () => {
    const slowPort = new FakeCarteraPort();
    slowPort.saludResponse = makeFakeSaludCartera();
    slowPort.rollRateResponse = makeFakeRollRate();
    // Aging and cosechas never resolve — simulates in-flight concurrent fetches.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    slowPort.obtenerAging = () => new Promise<any>(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    slowPort.obtenerCosechas = () => new Promise<any>(() => {});
    renderScreen(slowPort);
    // Wait for salud to render (aging + cosechas are still in-flight).
    await screen.findByText("PAR");
    expect(screen.queryByText(/sin datos/i)).not.toBeInTheDocument();
  });
});
