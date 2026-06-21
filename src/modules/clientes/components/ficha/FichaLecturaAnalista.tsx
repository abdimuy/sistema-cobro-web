import { Panel, Titular } from "./lib/Panel";
import { RasgoBadge } from "./RasgoBadge";
import type { Pulso } from "../../domain/entities/FichaCliente";

interface Props {
  pulso?: Pulso | null;
}

export function FichaLecturaAnalista({ pulso }: Props) {
  const hasNarrativa = Boolean(pulso?.narrativa);
  const hasRasgos = (pulso?.rasgosIA?.length ?? 0) > 0;

  if (!hasNarrativa && !hasRasgos) return null;

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
