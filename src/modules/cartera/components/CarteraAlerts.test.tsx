import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CarteraAlerts } from "./CarteraAlerts";
import { deriveAlerts } from "./lib/alerts";
import { makeFakeSaludCartera } from "../application/__tests__/fakeCarteraPort";

describe("deriveAlerts", () => {
  it("returns no alerts when metrics are healthy", () => {
    const alerts = deriveAlerts(makeFakeSaludCartera({ par: "0.05", ceiRate: "0.95" }));
    expect(alerts).toHaveLength(0);
  });

  it("flags PAR above threshold", () => {
    const alerts = deriveAlerts(makeFakeSaludCartera({ par: "0.25", ceiRate: "0.95" }));
    expect(alerts.map((a) => a.key)).toContain("par");
  });

  it("flags CEI below threshold", () => {
    const alerts = deriveAlerts(makeFakeSaludCartera({ par: "0.05", ceiRate: "0.70" }));
    expect(alerts.map((a) => a.key)).toContain("cei");
  });
});

describe("CarteraAlerts", () => {
  it("renders nothing when healthy", () => {
    const { container } = render(
      <CarteraAlerts salud={makeFakeSaludCartera({ par: "0.05", ceiRate: "0.95" })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an alert strip under threshold conditions", () => {
    render(<CarteraAlerts salud={makeFakeSaludCartera({ par: "0.25", ceiRate: "0.70" })} />);
    expect(screen.getByText(/PAR elevado/)).toBeInTheDocument();
    expect(screen.getByText(/Cobranza baja/)).toBeInTheDocument();
  });
});
