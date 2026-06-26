import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { FichaSaludStrip } from "./FichaSaludStrip";
import type { ResumenFicha, Pulso } from "../../domain/entities/FichaCliente";

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
    tendencia: { slope: 0, direccion: "estable" as const, cambio: false },
    ...overrides,
  };
}

function makePulso(overrides: Partial<Pulso> = {}): Pulso {
  return {
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
    ...overrides,
  };
}

// ─── % Liquidado item ─────────────────────────────────────────────────────────

describe("FichaSaludStrip — % Liquidado", () => {
  it("renders the clamped pct label and progressbar for a normal resumen", () => {
    render(
      <FichaSaludStrip resumen={makeResumen({ pctLiquidado: "70.00" })} pulso={makePulso()} />,
    );
    expect(screen.getByText("70%")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "70");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("clamps pct > 100 to 100", () => {
    render(
      <FichaSaludStrip resumen={makeResumen({ pctLiquidado: "120" })} pulso={makePulso()} />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("clamps pct < 0 to 0", () => {
    render(
      <FichaSaludStrip resumen={makeResumen({ pctLiquidado: "-5" })} pulso={makePulso()} />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("bar fill width matches the clamped pct", () => {
    const { container } = render(
      <FichaSaludStrip resumen={makeResumen({ pctLiquidado: "42.50" })} pulso={makePulso()} />,
    );
    const fill = container.querySelector("[style*='width']") as HTMLElement;
    expect(fill).not.toBeNull();
    expect(fill.style.width).toBe("42.5%");
  });

  it("bar is thinner than the original (has h-1.5, not h-3)", () => {
    render(<FichaSaludStrip resumen={makeResumen()} pulso={makePulso()} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveClass("h-1.5");
  });

  it("omits % liquidado item when totalComprado is '0'", () => {
    render(
      <FichaSaludStrip
        resumen={makeResumen({ totalComprado: "0" })}
        pulso={makePulso()}
      />,
    );
    expect(screen.queryByRole("progressbar")).toBeNull();
    // % Liquidado label must be absent; other items still render
    expect(screen.queryByText(/% Liquidado/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Puntualidad/i)).toBeInTheDocument();
  });

  it("omits % liquidado item when totalComprado is '0.00'", () => {
    const { container } = render(
      <FichaSaludStrip
        resumen={makeResumen({ totalComprado: "0.00" })}
        pulso={makePulso()}
      />,
    );
    expect(container.querySelector("[role='progressbar']")).toBeNull();
  });
});

// ─── Puntualidad ──────────────────────────────────────────────────────────────

describe("FichaSaludStrip — Puntualidad", () => {
  it("renders formatted pct when pulso is present with numPagos > 0", () => {
    render(
      <FichaSaludStrip resumen={makeResumen()} pulso={makePulso({ pctPagosATiempo: "94.68" })} />,
    );
    // 94.68 → "94.7%"
    expect(screen.getByText("94.7%")).toBeInTheDocument();
  });

  it("shows '—' when pulso is null", () => {
    render(<FichaSaludStrip resumen={makeResumen()} pulso={null} />);
    // At least one '—' for puntualidad (and estado)
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows '—' when pulso.numPagos === 0", () => {
    render(
      <FichaSaludStrip
        resumen={makeResumen()}
        pulso={makePulso({ numPagos: 0, pctPagosATiempo: "0.00" })}
      />,
    );
    // puntualidad shows '—' because numPagos is 0
    const labelEl = screen.getByText(/Puntualidad/i);
    const container = labelEl.closest("div");
    expect(container).not.toBeNull();
    // The '—' is either within the puntualidad item or visible
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Próximo pago ─────────────────────────────────────────────────────────────

describe("FichaSaludStrip — Próximo pago", () => {
  it("renders formatted date and monto when fechaProxPago is in the future", () => {
    const future = dayjs().add(20, "day");
    render(
      <FichaSaludStrip
        resumen={makeResumen()}
        pulso={makePulso({
          fechaProxPago: future.toDate(),
          montoProxPago: "4000.00",
        })}
      />,
    );
    // dayjs D MMM YYYY in es locale
    expect(
      screen.getByText(future.locale("es").format("D MMM YYYY")),
    ).toBeInTheDocument();
    // formatMoney("4000.00") → "$4,000.00" in es-MX
    expect(screen.getByText(/\$4[.,]000/i)).toBeInTheDocument();
    // Not overdue → no "Vencido" annotation
    expect(screen.queryByText(/vencido hace/i)).not.toBeInTheDocument();
  });

  it("shows 'Vencido hace N días' when fechaProxPago is in the past", () => {
    const past = dayjs().subtract(130, "day");
    render(
      <FichaSaludStrip
        resumen={makeResumen()}
        pulso={makePulso({
          fechaProxPago: past.toDate(),
          montoProxPago: "4000.00",
        })}
      />,
    );
    // The expected date still renders...
    expect(
      screen.getByText(past.locale("es").format("D MMM YYYY")),
    ).toBeInTheDocument();
    // ...alongside the overdue annotation (replacing the monto line).
    expect(screen.getByText(/vencido hace 130 días/i)).toBeInTheDocument();
  });

  it("uses the singular 'día' when overdue by exactly one day", () => {
    const past = dayjs().subtract(1, "day");
    render(
      <FichaSaludStrip
        resumen={makeResumen()}
        pulso={makePulso({ fechaProxPago: past.toDate(), montoProxPago: "4000.00" })}
      />,
    );
    expect(screen.getByText(/vencido hace 1 día$/i)).toBeInTheDocument();
  });

  it("shows 'Sin pago programado' when pulso.fechaProxPago is null", () => {
    render(
      <FichaSaludStrip
        resumen={makeResumen()}
        pulso={makePulso({ fechaProxPago: null, montoProxPago: "0.00" })}
      />,
    );
    expect(screen.getByText("Sin pago programado")).toBeInTheDocument();
  });

  it("shows 'Sin pago programado' when pulso is null", () => {
    render(<FichaSaludStrip resumen={makeResumen()} pulso={null} />);
    expect(screen.getByText("Sin pago programado")).toBeInTheDocument();
  });
});

// ─── Estado de pago ───────────────────────────────────────────────────────────

describe("FichaSaludStrip — Estado de pago", () => {
  it("renders EstadoPagoBadge label when pulso is present", () => {
    render(
      <FichaSaludStrip
        resumen={makeResumen()}
        pulso={makePulso({ estadoPago: "AL_CORRIENTE" })}
      />,
    );
    // EstadoPagoBadge renders the label "Al corriente"
    expect(screen.getByText("Al corriente")).toBeInTheDocument();
  });

  it("shows '—' when pulso is null", () => {
    render(<FichaSaludStrip resumen={makeResumen()} pulso={null} />);
    // '—' placeholder for estado de pago
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("renders MOROSO badge when estadoPago is MOROSO", () => {
    render(
      <FichaSaludStrip
        resumen={makeResumen()}
        pulso={makePulso({ estadoPago: "MOROSO" })}
      />,
    );
    expect(screen.getByText("Moroso")).toBeInTheDocument();
  });
});

// ─── pulso = null (full scenario) ────────────────────────────────────────────

describe("FichaSaludStrip — pulso null full scenario", () => {
  it("renders without crashing and shows % liquidado + placeholders", () => {
    render(
      <FichaSaludStrip
        resumen={makeResumen({ pctLiquidado: "55.00" })}
        pulso={null}
      />,
    );
    // % liquidado renders
    expect(screen.getByText("55%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    // '—' placeholders for puntualidad + estado
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    // próximo pago shows 'Sin pago programado'
    expect(screen.getByText("Sin pago programado")).toBeInTheDocument();
  });
});

// ─── totalComprado = "0" (full scenario) ─────────────────────────────────────

describe("FichaSaludStrip — totalComprado '0' scenario", () => {
  it("omits % liquidado item but renders puntualidad, próximo pago, and estado", () => {
    render(
      <FichaSaludStrip
        resumen={makeResumen({ totalComprado: "0" })}
        pulso={makePulso()}
      />,
    );
    // No progressbar
    expect(screen.queryByRole("progressbar")).toBeNull();
    // Puntualidad label present
    expect(screen.getByText(/Puntualidad/i)).toBeInTheDocument();
    // Próximo pago label present
    expect(screen.getByText(/Próximo pago/i)).toBeInTheDocument();
    // Estado badge present
    expect(screen.getByText("Al corriente")).toBeInTheDocument();
  });
});

// ─── Accessibility ───────────────────────────────────────────────────────────

describe("FichaSaludStrip — accessibility", () => {
  it("has aria-label on the section element", () => {
    render(<FichaSaludStrip resumen={makeResumen()} pulso={makePulso()} />);
    expect(
      screen.getByRole("region", { name: /de un vistazo/i }),
    ).toBeInTheDocument();
  });
});
