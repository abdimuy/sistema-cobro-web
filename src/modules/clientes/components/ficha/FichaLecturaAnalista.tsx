import { ClipboardList } from "lucide-react";
import { Panel, Titular } from "./lib/Panel";
import { RasgoBadge } from "./RasgoBadge";
import type { Pulso } from "../../domain/entities/FichaCliente";

interface Props {
  pulso?: Pulso | null;
}

export function FichaLecturaAnalista({ pulso }: Props) {
  const hasNarrativa = Boolean(pulso?.narrativa);
  const hasRasgos = (pulso?.rasgosIA?.length ?? 0) > 0;
  const hasContexto = Boolean(pulso?.contextoOperativo);

  if (!hasNarrativa && !hasRasgos && !hasContexto) return null;

  return (
    <section
      className="border-b border-border/60 px-8 py-8"
      aria-label="Lectura del analista"
    >
      <Panel
        title="Lectura del analista (IA)"
        titleHint="Asignado por IA"
        subtitle="análisis conductual"
      >
        {hasNarrativa && <Titular text={pulso!.narrativa} />}
        {hasContexto && (
          <div className="flex items-start gap-2">
            <ClipboardList className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <div className="flex flex-col gap-0.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
                Contexto operativo
              </p>
              <p className="text-[13px] leading-snug text-foreground/80">
                {pulso!.contextoOperativo}
              </p>
            </div>
          </div>
        )}
        {hasRasgos && (
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
              Rasgos (IA)
            </p>
            <div className="flex flex-wrap gap-2">
              {pulso!.rasgosIA!.map((rasgo, i) => (
                <RasgoBadge key={i} label={rasgo} />
              ))}
            </div>
          </div>
        )}
      </Panel>
    </section>
  );
}
