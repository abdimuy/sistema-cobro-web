import type { Pulso } from "../../domain/entities/FichaCliente";

// Derived CLV "por qué" — the backend sends no CLV drivers, so we surface them
// from the signals already on the pulso. CLV = margen × ticket esperado ×
// compras futuras × prob. de pago, so the drivers are propensity, payment
// reliability and ticket value. Kept in its own module so the section component
// file only exports components (react-refresh/only-export-components).
export function clvDrivers(pulso: Pulso): string[] {
  const out: string[] = [];

  switch (pulso.bandaRecompra) {
    case "ALTA":
      out.push("recompra recurrente esperada");
      break;
    case "MEDIA":
      out.push("recompra moderada esperada");
      break;
    case "BAJA":
      out.push("poca recompra esperada");
      break;
  }

  if (pulso.bandaCredito === "BAJO" || pulso.bandaCredito === "MEDIO") {
    out.push("pagos confiables");
  } else if (pulso.bandaCredito === "ALTO" || pulso.bandaCredito === "CRITICO") {
    out.push("riesgo de impago");
  } else if (
    pulso.estadoPago === "AL_CORRIENTE" ||
    pulso.estadoPago === "LIQUIDADO"
  ) {
    out.push("pagos confiables");
  }

  switch (pulso.bandaClv) {
    case "ALTO":
      out.push("tickets de alto valor");
      break;
    case "MEDIO":
      out.push("ticket de valor medio");
      break;
    case "BAJO":
      out.push("ticket de bajo valor");
      break;
  }

  return out.slice(0, 3);
}
