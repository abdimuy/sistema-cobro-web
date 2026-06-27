import type { SaludCartera } from "../../domain/entities";
import { CEI_ALERT_THRESHOLD, PAR_ALERT_THRESHOLD } from "./carteraUx";
import { formatRatioPct } from "./format";

export type Alert = { key: string; label: string; value: string };

// Derive deterioration alerts from the current salud metrics. Thresholds are
// the documented constants in carteraUx. Labels are minimal (2-4 words).
export function deriveAlerts(salud: SaludCartera): Alert[] {
  const alerts: Alert[] = [];
  const par = Number(salud.par);
  const cei = Number(salud.ceiRate);

  if (Number.isFinite(par) && par >= PAR_ALERT_THRESHOLD) {
    alerts.push({ key: "par", label: "PAR elevado", value: formatRatioPct(salud.par) });
  }
  if (Number.isFinite(cei) && cei <= CEI_ALERT_THRESHOLD) {
    alerts.push({ key: "cei", label: "Cobranza baja", value: formatRatioPct(salud.ceiRate) });
  }
  return alerts;
}
