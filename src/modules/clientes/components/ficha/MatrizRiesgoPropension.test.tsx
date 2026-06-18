import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatrizRiesgoPropension } from "./MatrizRiesgoPropension";
import type { Pulso } from "../../domain/entities/FichaCliente";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makePulso(overrides: Partial<Pulso> = {}): Pulso {
  const base: Pulso = {
    score: 75,
    segmento: "LEAL_POR_LIQUIDAR",
    estadoPago: "AL_CORRIENTE",
    recenciaDias: 30,
    frecuencia: 12,
    monetary: "85000.00",
    saldo: "13000.00",
    porLiquidarPct: "15.29",
    fechaUltimaCompra: new Date("2025-02-15T09:00:00Z"),
    fechaUltimoPago: new Date("2025-03-01T14:30:00Z"),
    nextBestProduct: "Comedor 6 personas",
    numPagos: 48,
    cadenciaDias: 30,
    diasAtrasoProm: 2,
    pctPagosATiempo: "94.68",
    fechaProxPago: new Date("2026-01-12T12:00:00Z"),
    montoProxPago: "4000.00",
    tierRiesgo: "AL_DIA",
    bandaCredito: "BAJO",
    bandaRecompra: "ALTA",
    clv: "120000.00",
    bandaClv: "ALTO",
  };
  return { ...base, ...overrides };
}

// ─── No-aplica tests ──────────────────────────────────────────────────────────

describe("MatrizRiesgoPropension — no-aplica", () => {
  it("renders nothing when pulso is null", () => {
    const { container } = render(<MatrizRiesgoPropension pulso={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when bandaCredito is undefined", () => {
    const { container } = render(
      <MatrizRiesgoPropension
        pulso={makePulso({ bandaCredito: undefined })}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when bandaRecompra is undefined", () => {
    const { container } = render(
      <MatrizRiesgoPropension
        pulso={makePulso({ bandaRecompra: undefined })}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when bandaCredito is empty string", () => {
    const { container } = render(
      <MatrizRiesgoPropension pulso={makePulso({ bandaCredito: "" })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when bandaRecompra is empty string", () => {
    const { container } = render(
      <MatrizRiesgoPropension pulso={makePulso({ bandaRecompra: "" })} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

// ─── Section heading ──────────────────────────────────────────────────────────

describe("MatrizRiesgoPropension — structure", () => {
  it("renders section heading 'Acción recomendada'", () => {
    render(<MatrizRiesgoPropension pulso={makePulso()} />);
    expect(screen.getByText("Acción recomendada")).toBeInTheDocument();
  });

  it("renders axis labels for columns and rows", () => {
    render(<MatrizRiesgoPropension pulso={makePulso()} />);
    expect(screen.getByText(/Alta prop\./i)).toBeInTheDocument();
    expect(screen.getByText(/Baja prop\./i)).toBeInTheDocument();
    expect(screen.getByText(/Bajo/i)).toBeInTheDocument();
    expect(screen.getByText(/Alto/i)).toBeInTheDocument();
  });

  it("renders all four cell labels", () => {
    render(<MatrizRiesgoPropension pulso={makePulso()} />);
    expect(screen.getByText("Vender más")).toBeInTheDocument();
    expect(screen.getByText("Reactivar")).toBeInTheDocument();
    expect(screen.getByText("Vender con enganche")).toBeInTheDocument();
    expect(screen.getByText("No extender")).toBeInTheDocument();
  });

  it("has accessible aria-label on the section", () => {
    const { container } = render(<MatrizRiesgoPropension pulso={makePulso()} />);
    const section = container.querySelector(
      "section[aria-label='Acción recomendada']",
    );
    expect(section).not.toBeNull();
  });
});

// ─── Quadrant: Bajo riesgo × Alta propensión → "Vender más" ──────────────────

describe("MatrizRiesgoPropension — cuadrante Vender más (BAJO × ALTA)", () => {
  it("highlights 'Vender más' when bandaCredito=BAJO, bandaRecompra=ALTA", () => {
    render(
      <MatrizRiesgoPropension
        pulso={makePulso({ bandaCredito: "BAJO", bandaRecompra: "ALTA" })}
      />,
    );
    const highlighted = screen.getByRole("region", {
      name: "Acción recomendada: Vender más",
    });
    expect(highlighted).toBeInTheDocument();
  });

  it("also highlights 'Vender más' when bandaCredito=MEDIO", () => {
    render(
      <MatrizRiesgoPropension
        pulso={makePulso({ bandaCredito: "MEDIO", bandaRecompra: "ALTA" })}
      />,
    );
    expect(
      screen.getByRole("region", { name: "Acción recomendada: Vender más" }),
    ).toBeInTheDocument();
  });

  it("renders the CLV amount inside the highlighted 'Vender más' cell", () => {
    render(
      <MatrizRiesgoPropension
        pulso={makePulso({
          bandaCredito: "BAJO",
          bandaRecompra: "ALTA",
          clv: "8204.83",
        })}
      />,
    );
    const cell = screen.getByRole("region", {
      name: "Acción recomendada: Vender más",
    });
    // formatMoneyShort("8204.83") → "$8,205" in es-MX locale
    expect(cell.textContent).toMatch(/\$8[,.]?205/);
  });
});

// ─── Quadrant: Bajo riesgo × Baja propensión → "Reactivar" ──────────────────

describe("MatrizRiesgoPropension — cuadrante Reactivar (BAJO × BAJA)", () => {
  it("highlights 'Reactivar' when bandaCredito=BAJO, bandaRecompra=BAJA", () => {
    render(
      <MatrizRiesgoPropension
        pulso={makePulso({ bandaCredito: "BAJO", bandaRecompra: "BAJA" })}
      />,
    );
    expect(
      screen.getByRole("region", { name: "Acción recomendada: Reactivar" }),
    ).toBeInTheDocument();
  });

  it("highlights 'Reactivar' when bandaCredito=MEDIO, bandaRecompra=MEDIA", () => {
    render(
      <MatrizRiesgoPropension
        pulso={makePulso({ bandaCredito: "MEDIO", bandaRecompra: "MEDIA" })}
      />,
    );
    expect(
      screen.getByRole("region", { name: "Acción recomendada: Reactivar" }),
    ).toBeInTheDocument();
  });

  it("renders CLV inside the 'Reactivar' cell", () => {
    render(
      <MatrizRiesgoPropension
        pulso={makePulso({
          bandaCredito: "BAJO",
          bandaRecompra: "BAJA",
          clv: "35000.00",
        })}
      />,
    );
    const cell = screen.getByRole("region", {
      name: "Acción recomendada: Reactivar",
    });
    expect(cell.textContent).toMatch(/\$35[,.]?000/);
  });
});

// ─── Quadrant: Alto riesgo × Alta propensión → "Vender con enganche" ─────────

describe("MatrizRiesgoPropension — cuadrante Enganche (ALTO × ALTA)", () => {
  it("highlights 'Vender con enganche' when bandaCredito=ALTO, bandaRecompra=ALTA", () => {
    render(
      <MatrizRiesgoPropension
        pulso={makePulso({ bandaCredito: "ALTO", bandaRecompra: "ALTA" })}
      />,
    );
    expect(
      screen.getByRole("region", {
        name: "Acción recomendada: Vender con enganche",
      }),
    ).toBeInTheDocument();
  });

  it("highlights 'Vender con enganche' when bandaCredito=CRITICO, bandaRecompra=ALTA", () => {
    render(
      <MatrizRiesgoPropension
        pulso={makePulso({ bandaCredito: "CRITICO", bandaRecompra: "ALTA" })}
      />,
    );
    expect(
      screen.getByRole("region", {
        name: "Acción recomendada: Vender con enganche",
      }),
    ).toBeInTheDocument();
  });

  it("renders CLV inside the enganche cell", () => {
    render(
      <MatrizRiesgoPropension
        pulso={makePulso({
          bandaCredito: "ALTO",
          bandaRecompra: "ALTA",
          clv: "62500.50",
        })}
      />,
    );
    const cell = screen.getByRole("region", {
      name: "Acción recomendada: Vender con enganche",
    });
    expect(cell.textContent).toMatch(/\$62[,.]?501/);
  });
});

// ─── Quadrant: Alto riesgo × Baja propensión → "No extender" ─────────────────

describe("MatrizRiesgoPropension — cuadrante No extender (ALTO × BAJA)", () => {
  it("highlights 'No extender' when bandaCredito=ALTO, bandaRecompra=BAJA", () => {
    render(
      <MatrizRiesgoPropension
        pulso={makePulso({ bandaCredito: "ALTO", bandaRecompra: "BAJA" })}
      />,
    );
    expect(
      screen.getByRole("region", {
        name: "Acción recomendada: No extender",
      }),
    ).toBeInTheDocument();
  });

  it("highlights 'No extender' when bandaCredito=CRITICO, bandaRecompra=MEDIA", () => {
    render(
      <MatrizRiesgoPropension
        pulso={makePulso({ bandaCredito: "CRITICO", bandaRecompra: "MEDIA" })}
      />,
    );
    expect(
      screen.getByRole("region", {
        name: "Acción recomendada: No extender",
      }),
    ).toBeInTheDocument();
  });

  it("renders CLV inside the 'No extender' cell", () => {
    render(
      <MatrizRiesgoPropension
        pulso={makePulso({
          bandaCredito: "CRITICO",
          bandaRecompra: "BAJA",
          clv: "9800.00",
        })}
      />,
    );
    const cell = screen.getByRole("region", {
      name: "Acción recomendada: No extender",
    });
    expect(cell.textContent).toMatch(/\$9[,.]?800/);
  });
});

// ─── CLV absent ───────────────────────────────────────────────────────────────

describe("MatrizRiesgoPropension — CLV ausente", () => {
  it("does not render 'Valor:' when clv is undefined", () => {
    render(
      <MatrizRiesgoPropension
        pulso={makePulso({ bandaCredito: "BAJO", bandaRecompra: "ALTA", clv: undefined })}
      />,
    );
    expect(screen.queryByText(/Valor:/)).not.toBeInTheDocument();
  });
});
