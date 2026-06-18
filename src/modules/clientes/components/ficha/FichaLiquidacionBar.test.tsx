import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaLiquidacionBar } from "./FichaLiquidacionBar";
import type { ResumenFicha } from "../../domain/entities/FichaCliente";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeResumen(overrides: Partial<ResumenFicha> = {}): ResumenFicha {
  return {
    totalComprado: "50000.00",
    totalAbonado: "35000.00",
    saldo: "15000.00",
    pctLiquidado: "70.00",
    numVentas: 3,
    numPagos: 12,
    ticketPromedio: "16666.67",
    abonosPorMes: [],
    compradoVsAbonado: [],
    ...overrides,
  };
}

// ─── Rendering guards ─────────────────────────────────────────────────────────

describe("FichaLiquidacionBar — rendering guards", () => {
  it("renders nothing when totalComprado is 0", () => {
    const { container } = render(
      <FichaLiquidacionBar resumen={makeResumen({ totalComprado: "0" })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when totalComprado is '0.00'", () => {
    const { container } = render(
      <FichaLiquidacionBar resumen={makeResumen({ totalComprado: "0.00" })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders when totalComprado is positive", () => {
    const { container } = render(
      <FichaLiquidacionBar resumen={makeResumen()} />,
    );
    expect(container.firstChild).not.toBeNull();
  });
});

// ─── Progressbar ARIA ─────────────────────────────────────────────────────────

describe("FichaLiquidacionBar — progressbar ARIA attributes", () => {
  it("has role=progressbar", () => {
    render(<FichaLiquidacionBar resumen={makeResumen()} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("sets aria-valuenow to the clamped pct", () => {
    render(
      <FichaLiquidacionBar resumen={makeResumen({ pctLiquidado: "70.00" })} />,
    );
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "70");
  });

  it("sets aria-valuemin=0 and aria-valuemax=100", () => {
    render(<FichaLiquidacionBar resumen={makeResumen()} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("clamps pct > 100 to 100 in aria-valuenow", () => {
    render(
      <FichaLiquidacionBar resumen={makeResumen({ pctLiquidado: "150" })} />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("clamps pct < 0 to 0 in aria-valuenow", () => {
    render(
      <FichaLiquidacionBar resumen={makeResumen({ pctLiquidado: "-10" })} />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });
});

// ─── Fill width ───────────────────────────────────────────────────────────────

describe("FichaLiquidacionBar — fill width style", () => {
  it("sets fill width matching the pct", () => {
    const { container } = render(
      <FichaLiquidacionBar resumen={makeResumen({ pctLiquidado: "42.50" })} />,
    );
    const fill = container.querySelector("[style*='width']") as HTMLElement;
    expect(fill).not.toBeNull();
    // pct = 42.5 → width: 42.5%
    expect(fill.style.width).toBe("42.5%");
  });

  it("clamps fill width to 100% when pct > 100", () => {
    const { container } = render(
      <FichaLiquidacionBar resumen={makeResumen({ pctLiquidado: "110" })} />,
    );
    const fill = container.querySelector("[style*='width']") as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });

  it("clamps fill width to 0% when pct < 0", () => {
    const { container } = render(
      <FichaLiquidacionBar resumen={makeResumen({ pctLiquidado: "-5" })} />,
    );
    const fill = container.querySelector("[style*='width']") as HTMLElement;
    expect(fill.style.width).toBe("0%");
  });
});

// ─── Formatted amounts ────────────────────────────────────────────────────────

describe("FichaLiquidacionBar — formatted amounts", () => {
  it("shows pagado amount", () => {
    render(
      <FichaLiquidacionBar
        resumen={makeResumen({ totalAbonado: "35000.00" })}
      />,
    );
    // formatMoney("35000.00") → "$35,000.00" in es-MX
    expect(screen.getByText(/pagado/i)).toBeInTheDocument();
    expect(screen.getByText(/35[,.]?000/)).toBeInTheDocument();
  });

  it("shows saldo and totalComprado", () => {
    render(
      <FichaLiquidacionBar
        resumen={makeResumen({
          saldo: "15000.00",
          totalComprado: "50000.00",
        })}
      />,
    );
    expect(screen.getByText(/saldo/i)).toBeInTheDocument();
    // both amounts should appear somewhere in the footer
    expect(screen.getByText(/50[,.]?000/)).toBeInTheDocument();
  });

  it("shows the percentage label", () => {
    render(
      <FichaLiquidacionBar resumen={makeResumen({ pctLiquidado: "70.00" })} />,
    );
    // formatPct("70.00") → "70%"
    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  it("shows the section label", () => {
    render(<FichaLiquidacionBar resumen={makeResumen()} />);
    expect(
      screen.getByText(/Liquidación de la cuenta/i),
    ).toBeInTheDocument();
  });
});

// ─── Edge: 0% and 100% ───────────────────────────────────────────────────────

describe("FichaLiquidacionBar — edge percentages", () => {
  it("handles pctLiquidado=0", () => {
    render(<FichaLiquidacionBar resumen={makeResumen({ pctLiquidado: "0" })} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("handles pctLiquidado=100", () => {
    render(
      <FichaLiquidacionBar resumen={makeResumen({ pctLiquidado: "100" })} />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});

// ─── Editorial styling ────────────────────────────────────────────────────────

describe("FichaLiquidacionBar — editorial styling", () => {
  it("renders the percentage in a serif element", () => {
    render(
      <FichaLiquidacionBar resumen={makeResumen({ pctLiquidado: "70.00" })} />,
    );
    const pctEl = screen.getByText("70%");
    expect(pctEl).toHaveClass("font-serif");
  });

  it("bar track has class h-3 (thicker bar)", () => {
    render(<FichaLiquidacionBar resumen={makeResumen()} />);
    const track = screen.getByRole("progressbar");
    expect(track).toHaveClass("h-3");
  });
});
