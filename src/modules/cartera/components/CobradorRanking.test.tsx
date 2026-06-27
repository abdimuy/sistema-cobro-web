import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CobradorRanking } from "./CobradorRanking";
import { makeFakeCobradorPerformance } from "../application/__tests__/fakeCarteraPort";

describe("CobradorRanking", () => {
  it("renders one row per cobrador", () => {
    const cobradores = [
      makeFakeCobradorPerformance({ cobradorId: 1 }),
      makeFakeCobradorPerformance({ cobradorId: 2 }),
    ];
    render(<CobradorRanking cobradores={cobradores} />);
    expect(screen.getByText("Cobrador #1")).toBeInTheDocument();
    expect(screen.getByText("Cobrador #2")).toBeInTheDocument();
  });

  it("reorders rows when clicking the CEI header", () => {
    const cobradores = [
      makeFakeCobradorPerformance({ cobradorId: 1, cei: "0.70" }),
      makeFakeCobradorPerformance({ cobradorId: 2, cei: "0.95" }),
    ];
    render(<CobradorRanking cobradores={cobradores} />);

    const ceiHeader = screen.getByText("CEI");
    fireEvent.click(ceiHeader);

    const rows = screen.getAllByRole("row");
    // After clicking CEI (defaults to desc), cobrador 2 (0.95) should appear before cobrador 1 (0.70)
    const firstDataRow = rows[1];
    expect(firstDataRow).toHaveTextContent("Cobrador #2");
  });

  it("CEI cell uses semáforo dot class for green case", () => {
    const cobradores = [
      // CEI 0.95 > 0.9 threshold → green
      makeFakeCobradorPerformance({ cobradorId: 1, cei: "0.95" }),
    ];
    const { container } = render(<CobradorRanking cobradores={cobradores} />);
    // semaphoreTone("green").dot = "bg-emerald-500"
    const greenDot = container.querySelector(".bg-emerald-500");
    expect(greenDot).not.toBeNull();
  });

  it("CEI cell uses semáforo dot class for red case", () => {
    const cobradores = [
      // CEI 0.50 <= 0.8 threshold → red
      makeFakeCobradorPerformance({ cobradorId: 1, cei: "0.50" }),
    ];
    const { container } = render(<CobradorRanking cobradores={cobradores} />);
    // semaphoreTone("red").dot = "bg-red-500"
    const redDot = container.querySelector(".bg-red-500");
    expect(redDot).not.toBeNull();
  });

  it("renders empty state when no cobradores", () => {
    render(<CobradorRanking cobradores={[]} />);
    expect(screen.getByText("Sin cobradores")).toBeInTheDocument();
  });

  it("does not show 'Sin cobradores' while isLoading is true", () => {
    render(<CobradorRanking cobradores={[]} isLoading={true} />);
    expect(screen.queryByText("Sin cobradores")).not.toBeInTheDocument();
  });
});
