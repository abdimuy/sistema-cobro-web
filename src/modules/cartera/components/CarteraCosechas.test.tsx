import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CarteraCosechas } from "./CarteraCosechas";
import { makeFakeCosecha } from "../application/__tests__/fakeCarteraPort";

describe("CarteraCosechas", () => {
  it("renders cohort labels via the accessible summary", () => {
    const cosechas = [
      makeFakeCosecha({ cohortMonth: 24318, saldo: "30000.00", conteo: 15 }), // Jun 2026
      makeFakeCosecha({ cohortMonth: 24313, saldo: "20000.00", conteo: 10 }), // Ene 2026
    ];
    render(<CarteraCosechas cosechas={cosechas} />);

    // The accessible sr-only list contains the cohort labels
    expect(screen.getByText(/jun 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/ene 2026/i)).toBeInTheDocument();
  });

  it("shows empty state when no cosechas", () => {
    render(<CarteraCosechas cosechas={[]} />);
    expect(screen.getByText(/sin datos/i)).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading:true and empty", () => {
    render(<CarteraCosechas cosechas={[]} isLoading={true} />);
    expect(screen.queryByText(/sin datos/i)).not.toBeInTheDocument();
    // The skeleton div renders instead of the chart or empty state
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).not.toBeNull();
  });
});
