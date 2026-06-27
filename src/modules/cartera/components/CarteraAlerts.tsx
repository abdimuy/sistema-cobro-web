import type { SaludCartera } from "../domain/entities";
import { deriveAlerts } from "./lib/alerts";

export function CarteraAlerts({ salud }: { salud: SaludCartera }) {
  const alerts = deriveAlerts(salud);
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" role="status" aria-label="Alertas de deterioro">
      {alerts.map((a) => (
        <span
          key={a.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 font-mono text-[11px] text-red-500"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
          {a.label} · {a.value}
        </span>
      ))}
    </div>
  );
}
