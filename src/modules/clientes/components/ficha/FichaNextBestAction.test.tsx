import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaNextBestAction } from "./FichaNextBestAction";
import { buildWhatsAppHref } from "./lib/whatsapp";
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
    scoreCredito: 91,
    bandaRecompra: "ALTA",
    scoreRecompra: 72,
    clv: "120000.00",
    bandaClv: "ALTO",
  };
  return { ...base, ...overrides };
}

const TELEFONO = "477 123 4567";

// ─── No-render guards ─────────────────────────────────────────────────────────

describe("FichaNextBestAction — no-render guards", () => {
  it("renders nothing when pulso is null", () => {
    const { container } = render(
      <FichaNextBestAction pulso={null} telefono={TELEFONO} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when bandaCredito is undefined", () => {
    const { container } = render(
      <FichaNextBestAction
        pulso={makePulso({ bandaCredito: undefined })}
        telefono={TELEFONO}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when bandaRecompra is undefined", () => {
    const { container } = render(
      <FichaNextBestAction
        pulso={makePulso({ bandaRecompra: undefined })}
        telefono={TELEFONO}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when bandaCredito is empty string", () => {
    const { container } = render(
      <FichaNextBestAction
        pulso={makePulso({ bandaCredito: "" })}
        telefono={TELEFONO}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});

// ─── Quadrant headlines ───────────────────────────────────────────────────────

describe("FichaNextBestAction — cuadrante headlines", () => {
  it("shows 'Sube la línea y vende más' for BAJO × ALTA", () => {
    render(
      <FichaNextBestAction
        pulso={makePulso({ bandaCredito: "BAJO", bandaRecompra: "ALTA" })}
        telefono={TELEFONO}
      />,
    );
    expect(
      screen.getByText("Sube la línea y vende más"),
    ).toBeInTheDocument();
  });

  it("shows 'Reactiva al cliente' for BAJO × BAJA", () => {
    render(
      <FichaNextBestAction
        pulso={makePulso({ bandaCredito: "BAJO", bandaRecompra: "BAJA" })}
        telefono={TELEFONO}
      />,
    );
    expect(screen.getByText("Reactiva al cliente")).toBeInTheDocument();
  });

  it("shows 'Reactiva al cliente' for MEDIO × MEDIA", () => {
    render(
      <FichaNextBestAction
        pulso={makePulso({ bandaCredito: "MEDIO", bandaRecompra: "MEDIA" })}
        telefono={TELEFONO}
      />,
    );
    expect(screen.getByText("Reactiva al cliente")).toBeInTheDocument();
  });

  it("shows 'Vende con enganche' for ALTO × ALTA", () => {
    render(
      <FichaNextBestAction
        pulso={makePulso({ bandaCredito: "ALTO", bandaRecompra: "ALTA" })}
        telefono={TELEFONO}
      />,
    );
    expect(screen.getByText("Vende con enganche")).toBeInTheDocument();
  });

  it("shows 'Vende con enganche' for CRITICO × ALTA", () => {
    render(
      <FichaNextBestAction
        pulso={makePulso({ bandaCredito: "CRITICO", bandaRecompra: "ALTA" })}
        telefono={TELEFONO}
      />,
    );
    expect(screen.getByText("Vende con enganche")).toBeInTheDocument();
  });

  it("shows 'Prioriza la cobranza' for ALTO × BAJA", () => {
    render(
      <FichaNextBestAction
        pulso={makePulso({ bandaCredito: "ALTO", bandaRecompra: "BAJA" })}
        telefono={TELEFONO}
      />,
    );
    expect(screen.getByText("Prioriza la cobranza")).toBeInTheDocument();
  });

  it("shows 'Prioriza la cobranza' for CRITICO × MEDIA", () => {
    render(
      <FichaNextBestAction
        pulso={makePulso({ bandaCredito: "CRITICO", bandaRecompra: "MEDIA" })}
        telefono={TELEFONO}
      />,
    );
    expect(screen.getByText("Prioriza la cobranza")).toBeInTheDocument();
  });
});

// ─── nextBestProduct ──────────────────────────────────────────────────────────

describe("FichaNextBestAction — nextBestProduct", () => {
  it("shows nextBestProduct when provided", () => {
    render(
      <FichaNextBestAction
        pulso={makePulso({ nextBestProduct: "Recámara matrimonial" })}
        telefono={TELEFONO}
      />,
    );
    expect(screen.getByText("Recámara matrimonial")).toBeInTheDocument();
  });

  it("shows the label prefix for nextBestProduct", () => {
    render(
      <FichaNextBestAction
        pulso={makePulso({ nextBestProduct: "Sala moderna" })}
        telefono={TELEFONO}
      />,
    );
    expect(screen.getByText(/Próximo mejor producto/i)).toBeInTheDocument();
  });
});

// ─── Llamar button ────────────────────────────────────────────────────────────

describe("FichaNextBestAction — botón Llamar", () => {
  it("renders Llamar link with tel: href", () => {
    render(
      <FichaNextBestAction
        pulso={makePulso()}
        telefono="477 123 4567"
      />,
    );
    const link = screen.getByRole("link", { name: /llamar/i });
    expect(link).toHaveAttribute("href", "tel:477 123 4567");
  });

  it("does not render Llamar when telefono is empty", () => {
    render(<FichaNextBestAction pulso={makePulso()} telefono="" />);
    expect(screen.queryByRole("link", { name: /llamar/i })).toBeNull();
  });

  it("does not render Llamar when telefono is whitespace only", () => {
    render(<FichaNextBestAction pulso={makePulso()} telefono="   " />);
    expect(screen.queryByRole("link", { name: /llamar/i })).toBeNull();
  });
});

// ─── WhatsApp button ──────────────────────────────────────────────────────────

describe("FichaNextBestAction — botón WhatsApp", () => {
  it("renders WhatsApp link with wa.me href for 10-digit number", () => {
    render(
      <FichaNextBestAction pulso={makePulso()} telefono="477 123 4567" />,
    );
    const link = screen.getByRole("link", { name: /whatsapp/i });
    expect(link).toHaveAttribute(
      "href",
      "https://wa.me/524771234567",
    );
  });

  it("strips dashes, spaces and parens from phone number", () => {
    render(
      <FichaNextBestAction
        pulso={makePulso()}
        telefono="(477) 123-4567"
      />,
    );
    const link = screen.getByRole("link", { name: /whatsapp/i });
    expect(link).toHaveAttribute("href", "https://wa.me/524771234567");
  });

  it("does not prepend 52 when number already has 12+ digits", () => {
    render(
      <FichaNextBestAction
        pulso={makePulso()}
        telefono="+52 477 123 4567"
      />,
    );
    const link = screen.getByRole("link", { name: /whatsapp/i });
    // digits: 524771234567 → already 12, no prefix added
    expect(link).toHaveAttribute("href", "https://wa.me/524771234567");
  });

  it("does not render WhatsApp when telefono is empty", () => {
    render(<FichaNextBestAction pulso={makePulso()} telefono="" />);
    expect(screen.queryByRole("link", { name: /whatsapp/i })).toBeNull();
  });
});

// ─── Agendar button ───────────────────────────────────────────────────────────

describe("FichaNextBestAction — botón Agendar", () => {
  it("renders an Agendar button (no href)", () => {
    render(<FichaNextBestAction pulso={makePulso()} telefono={TELEFONO} />);
    const btn = screen.getByRole("button", { name: /agendar/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("type", "button");
  });

  it("Agendar renders even when telefono is empty", () => {
    render(<FichaNextBestAction pulso={makePulso()} telefono="" />);
    expect(
      screen.getByRole("button", { name: /agendar/i }),
    ).toBeInTheDocument();
  });
});

// ─── Chip label ───────────────────────────────────────────────────────────────

describe("FichaNextBestAction — chip de cuadrante", () => {
  it("shows 'Vender más' chip for BAJO × ALTA", () => {
    render(
      <FichaNextBestAction
        pulso={makePulso({ bandaCredito: "BAJO", bandaRecompra: "ALTA" })}
        telefono={TELEFONO}
      />,
    );
    expect(screen.getByText("Vender más")).toBeInTheDocument();
  });

  it("shows 'No extender' chip for CRITICO × BAJA", () => {
    render(
      <FichaNextBestAction
        pulso={makePulso({ bandaCredito: "CRITICO", bandaRecompra: "BAJA" })}
        telefono={TELEFONO}
      />,
    );
    expect(screen.getByText("No extender")).toBeInTheDocument();
  });
});

// ─── buildWhatsAppHref (pure function) ────────────────────────────────────────

describe("buildWhatsAppHref", () => {
  it("prepends 52 to a 10-digit local number", () => {
    expect(buildWhatsAppHref("4771234567")).toBe(
      "https://wa.me/524771234567",
    );
  });

  it("strips non-digits before prepending", () => {
    expect(buildWhatsAppHref("477 123-4567")).toBe(
      "https://wa.me/524771234567",
    );
  });

  it("does not prepend 52 when already 12 digits", () => {
    expect(buildWhatsAppHref("524771234567")).toBe(
      "https://wa.me/524771234567",
    );
  });

  it("strips + and spaces from +52 number", () => {
    expect(buildWhatsAppHref("+52 477 123 4567")).toBe(
      "https://wa.me/524771234567",
    );
  });
});
