import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CarteraRollRate } from "./CarteraRollRate";
import { makeFakeRollRate } from "../application/__tests__/fakeCarteraPort";

describe("CarteraRollRate", () => {
  it("shows the signed scalar and direction label when disponible:true", () => {
    render(
      <CarteraRollRate
        rollRate={makeFakeRollRate({ disponible: true, rollRate: 0.08 })}
      />,
    );
    expect(screen.getByText(/deterioro/i)).toBeInTheDocument();
    expect(screen.getByText(/\+8%/)).toBeInTheDocument();
  });

  it("shows dates when disponible:true", () => {
    render(
      <CarteraRollRate
        rollRate={makeFakeRollRate({
          disponible: true,
          rollRate: -0.05,
          fechaCorteAnterior: new Date("2025-09-30T00:00:00Z"),
          fechaCorteReciente: new Date("2025-10-31T00:00:00Z"),
        })}
      />,
    );
    expect(screen.getByText(/corte anterior/i)).toBeInTheDocument();
    expect(screen.getByText(/corte reciente/i)).toBeInTheDocument();
  });

  it("shows 'Acumulando datos' when disponible:false", () => {
    render(
      <CarteraRollRate
        rollRate={makeFakeRollRate({ disponible: false, rollRate: 0 })}
      />,
    );
    expect(screen.getByText(/acumulando datos/i)).toBeInTheDocument();
    expect(screen.queryByText(/deterioro/i)).not.toBeInTheDocument();
  });

  it("shows 'Acumulando datos' when rollRate is null", () => {
    render(<CarteraRollRate rollRate={null} />);
    expect(screen.getByText(/acumulando datos/i)).toBeInTheDocument();
  });
});
