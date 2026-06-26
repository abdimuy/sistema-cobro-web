import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaTendencia } from "./FichaTendencia";
import type { PuntoMensual, Tendencia } from "../../domain/entities/FichaCliente";

// ─── recharts stub ────────────────────────────────────────────────────────────

vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 400, height: 40 }}>{children}</div>
    ),
  };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeAbonos(n = 6): PuntoMensual[] {
  return Array.from({ length: n }, (_, i) => ({
    anio: 2025,
    mes: i + 1,
    monto: String((1000 + i * 200).toFixed(2)),
  }));
}

function makeTendencia(
  overrides: Partial<Tendencia> = {},
): Tendencia {
  return { slope: 124.5, direccion: "mejorando", cambio: true, ...overrides };
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe("FichaTendencia — rendering", () => {
  it("renders the sparkline section when there are 2+ data points", () => {
    render(
      <FichaTendencia
        abonosPorMes={makeAbonos(6)}
        tendencia={makeTendencia()}
      />,
    );
    expect(screen.getByRole("region", { name: /tendencia de abonos/i })).toBeInTheDocument();
  });

  it("returns null when there are fewer than 2 data points", () => {
    const { container } = render(
      <FichaTendencia
        abonosPorMes={makeAbonos(1)}
        tendencia={makeTendencia()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when abonosPorMes is empty", () => {
    const { container } = render(
      <FichaTendencia
        abonosPorMes={[]}
        tendencia={makeTendencia()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the Abonos / mes label", () => {
    render(
      <FichaTendencia
        abonosPorMes={makeAbonos(6)}
        tendencia={makeTendencia()}
      />,
    );
    expect(screen.getByText(/abonos \/ mes/i)).toBeInTheDocument();
  });

  it("renders the Tendencia label", () => {
    render(
      <FichaTendencia
        abonosPorMes={makeAbonos(6)}
        tendencia={makeTendencia()}
      />,
    );
    expect(screen.getByText(/^Tendencia$/i)).toBeInTheDocument();
  });
});

// ─── Direction indicator ───────────────────────────────────────────────────────

describe("FichaTendencia — indicador de dirección", () => {
  it("shows ↑ Mejorando for direccion=mejorando", () => {
    render(
      <FichaTendencia
        abonosPorMes={makeAbonos(6)}
        tendencia={makeTendencia({ direccion: "mejorando" })}
      />,
    );
    expect(screen.getByText("↑")).toBeInTheDocument();
    expect(screen.getByText("Mejorando")).toBeInTheDocument();
  });

  it("shows → Estable for direccion=estable", () => {
    render(
      <FichaTendencia
        abonosPorMes={makeAbonos(6)}
        tendencia={makeTendencia({ direccion: "estable", slope: 0 })}
      />,
    );
    expect(screen.getByText("→")).toBeInTheDocument();
    expect(screen.getByText("Estable")).toBeInTheDocument();
  });

  it("shows ↓ Empeorando for direccion=empeorando", () => {
    render(
      <FichaTendencia
        abonosPorMes={makeAbonos(6)}
        tendencia={makeTendencia({ direccion: "empeorando", slope: -300 })}
      />,
    );
    expect(screen.getByText("↓")).toBeInTheDocument();
    expect(screen.getByText("Empeorando")).toBeInTheDocument();
  });

  it("applies green styling to the mejorando indicator", () => {
    render(
      <FichaTendencia
        abonosPorMes={makeAbonos(6)}
        tendencia={makeTendencia({ direccion: "mejorando" })}
      />,
    );
    const label = screen.getByText("Mejorando");
    // The container div carries the color class
    const container = label.closest("div");
    expect(container?.className).toMatch(/green/);
  });

  it("applies red styling to the empeorando indicator", () => {
    render(
      <FichaTendencia
        abonosPorMes={makeAbonos(6)}
        tendencia={makeTendencia({ direccion: "empeorando", slope: -300 })}
      />,
    );
    const label = screen.getByText("Empeorando");
    const container = label.closest("div");
    expect(container?.className).toMatch(/red/);
  });

  it("does not show a coloured class for estable (uses muted)", () => {
    render(
      <FichaTendencia
        abonosPorMes={makeAbonos(6)}
        tendencia={makeTendencia({ direccion: "estable", slope: 0 })}
      />,
    );
    const label = screen.getByText("Estable");
    const container = label.closest("div");
    // estable uses text-muted-foreground — no red/green
    expect(container?.className).not.toMatch(/green/);
    expect(container?.className).not.toMatch(/red/);
  });
});

// ─── Accessibility ─────────────────────────────────────────────────────────────

describe("FichaTendencia — accessibility", () => {
  it("has an aria-label on the section", () => {
    render(
      <FichaTendencia
        abonosPorMes={makeAbonos(6)}
        tendencia={makeTendencia()}
      />,
    );
    expect(
      screen.getByRole("region", { name: "Tendencia de abonos" }),
    ).toBeInTheDocument();
  });
});
