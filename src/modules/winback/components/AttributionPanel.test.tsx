import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AttributionPanel from "./AttributionPanel";
import { makeFakeAttribution } from "../application/__tests__/fakeWinbackPort";

describe("AttributionPanel", () => {
  it("renders loading skeletons when isLoading is true", () => {
    const { container } = render(
      <AttributionPanel attribution={null} isLoading={true} />,
    );
    // shadcn Skeleton renders divs with the animate-pulse class
    const skeletons = container.querySelectorAll("[class*='animate-pulse']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders muted fallback when attribution is null and not loading", () => {
    render(<AttributionPanel attribution={null} isLoading={false} />);
    expect(screen.getByText("Sin datos de atribución")).toBeTruthy();
  });

  it("renders treatment, control and uplift stats", () => {
    const attribution = makeFakeAttribution();
    render(<AttributionPanel attribution={attribution} isLoading={false} />);

    // Treatment: 20/50
    expect(screen.getByText("20/50")).toBeTruthy();
    // Control: 10/50
    expect(screen.getByText("10/50")).toBeTruthy();
    // Uplift: +20% (positive → prefixed with +)
    expect(screen.getByText("+20%")).toBeTruthy();
  });

  it("prefixes uplift with + only when positive", () => {
    const negativeAttribution = makeFakeAttribution({ uplift: "-0.05" });
    render(<AttributionPanel attribution={negativeAttribution} isLoading={false} />);
    // Negative uplift should NOT have + prefix
    expect(screen.getByText("-5%")).toBeTruthy();
  });

  it("renders section labels", () => {
    const attribution = makeFakeAttribution();
    render(<AttributionPanel attribution={attribution} isLoading={false} />);
    expect(screen.getByText("Atribución")).toBeTruthy();
    expect(screen.getByText(/Tratamiento vs control/i)).toBeTruthy();
  });
});
