import BandaRecompraBadge from "../badges/BandaRecompraBadge";
import type { Pulso } from "../../domain/entities/FichaCliente";

// ─── Band-matched repurchase score number ──────────────────────────────────────

// Color classes keyed by banda value — mirrors BandaRecompraBadge exactly so the
// numeric score never contradicts the propensity band label shown next to it.
const BAND_SCORE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ALTA:  { bg: "bg-green-500/10",  text: "text-green-600",  border: "border-green-500/20"  },
  MEDIA: { bg: "bg-amber-500/10",  text: "text-amber-500",  border: "border-amber-500/20"  },
  BAJA:  { bg: "bg-gray-500/10",   text: "text-gray-500",   border: "border-gray-500/20"   },
};

function RecompraScoreNumber({ score, banda }: { score: number; banda: string }) {
  const colors = BAND_SCORE_COLORS[banda] ?? {
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    border: "border-border/40",
  };
  return (
    <span
      className={`font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded-md border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {score}
    </span>
  );
}

// ─── Shared card shell ────────────────────────────────────────────────────────

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-md border border-border/60 px-5 py-4">
      <div>
        <h4 className="font-serif text-sm font-normal text-foreground">
          {title}
        </h4>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  );
}

// ─── FichaRecompraCard ────────────────────────────────────────────────────────

interface Props {
  pulso: Pulso | null;
}

export function FichaRecompraCard({ pulso }: Props) {
  if (!pulso?.bandaRecompra) return null;

  const { bandaRecompra, scoreRecompra, recompraDrivers } = pulso;
  const drivers = recompraDrivers ?? [];

  return (
    <section
      className="border-b border-border/60 px-8 py-8"
      aria-label="Propensión a Recompra"
    >
      <div className="mb-5">
        <h3 className="font-serif text-base font-normal text-foreground">
          Propensión a recompra
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          inteligencia comercial
        </p>
      </div>

      <Card title="Calificación" subtitle="banda y score">
        <div className="flex flex-col gap-3">
          {/* Banda badge */}
          <BandaRecompraBadge value={bandaRecompra} />

          {/* Numeric score — colored to match the banda */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Score
            </span>
            <RecompraScoreNumber score={scoreRecompra ?? 0} banda={bandaRecompra} />
            <span className="font-mono text-[10px] text-muted-foreground/70">
              / 100
            </span>
          </div>

          {/* Drivers */}
          {drivers.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Por qué
              </span>
              <ul className="space-y-0.5 pl-3">
                {drivers.map((driver, i) => (
                  <li
                    key={i}
                    className="font-mono text-[11px] text-muted-foreground before:content-['·'] before:mr-1.5 before:text-muted-foreground/50"
                  >
                    {driver}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}
