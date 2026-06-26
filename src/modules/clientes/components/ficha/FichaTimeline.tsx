import { useTimeline } from "../../presentation/hooks/useTimeline";
import type { TipoEvento } from "../../domain/entities/Timeline";

interface ColorConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
}

const TIPO_CONFIG: Record<TipoEvento, ColorConfig> = {
  compra_credito: {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
    label: "Crédito",
  },
  compra_contado: {
    bg: "bg-green-500/10",
    text: "text-green-600",
    border: "border-green-500/20",
    dot: "bg-green-500",
    label: "Contado",
  },
  pago: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
    label: "Pago",
  },
};

const FALLBACK_CONFIG: ColorConfig = {
  bg: "bg-gray-500/10",
  text: "text-gray-400",
  border: "border-gray-500/20",
  dot: "bg-gray-400",
  label: "—",
};

const MXN_FMT = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

function formatFecha(d: Date): string {
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  clienteId: number;
}

export function FichaTimeline({ clienteId }: Props) {
  const { timeline, isLoading, error } = useTimeline(clienteId);

  if (isLoading) {
    return (
      <section className="border-b border-border/60 px-8 py-8" aria-label="Historial de movimientos">
        <h3 className="font-serif text-base font-normal text-foreground mb-4">
          Historial
        </h3>
        <p className="font-mono text-[11px] text-muted-foreground/60 animate-pulse">
          Cargando…
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="border-b border-border/60 px-8 py-8" aria-label="Historial de movimientos">
        <h3 className="font-serif text-base font-normal text-foreground mb-4">
          Historial
        </h3>
        <p className="font-mono text-[11px] text-red-500/80">{error.message}</p>
      </section>
    );
  }

  return (
    <section className="border-b border-border/60 px-8 py-8" aria-label="Historial de movimientos">
      <h3 className="font-serif text-base font-normal text-foreground mb-6">
        Historial
      </h3>

      {timeline.length === 0 ? (
        <p className="font-mono text-[11px] italic text-muted-foreground/60">
          Sin movimientos
        </p>
      ) : (
        <ol className="relative border-l border-border/60 space-y-0">
          {timeline.map((ev, i) => {
            const cfg = TIPO_CONFIG[ev.tipo] ?? FALLBACK_CONFIG;
            return (
              <li key={`${ev.tipo}-${ev.refId}-${i}`} className="pl-6 pb-6 relative">
                {/* timeline dot */}
                <span
                  className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-background ${cfg.dot}`}
                />
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  {/* type badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {formatFecha(ev.fecha)}
                  </span>
                </div>
                <p className="font-serif text-sm text-foreground">
                  {MXN_FMT.format(ev.monto)}
                  <span className="font-mono text-[10px] text-muted-foreground ml-2">
                    {ev.etiqueta}
                  </span>
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
