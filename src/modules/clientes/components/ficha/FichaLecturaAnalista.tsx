import { PenLine } from "lucide-react";
import { RasgoBadge } from "./RasgoBadge";
import type { Pulso } from "../../domain/entities/FichaCliente";

interface Props {
  pulso?: Pulso | null;
}

/**
 * FichaLecturaAnalista renders the analyst's reading as a glass "intelligence
 * brief": a translucent, edge-lit panel with an ambient ink-amber glow and an
 * editorial serif pull-quote. No "IA" branding — the office reads it as the
 * analyst's synthesis. Dark-glassmorphism techniques (backdrop blur, masked
 * gradient hairline, layered depth) cohere with the ficha's monochrome theme.
 */
export function FichaLecturaAnalista({ pulso }: Props) {
  const narrativa = pulso?.narrativa;
  const rasgos = pulso?.rasgosIA ?? [];
  const hasNarrativa = Boolean(narrativa);
  const hasRasgos = rasgos.length > 0;

  if (!hasNarrativa && !hasRasgos) return null;

  return (
    <section
      className="border-b border-border/60 px-8 py-9"
      aria-label="Lectura del analista"
    >
      <article className="lectura-rise group relative mx-auto max-w-3xl overflow-hidden rounded-[20px] bg-white/[0.035] px-7 py-7 shadow-[0_8px_32px_-10px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-shadow duration-500 hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
        {/* Ambient ink-amber glow — the single accent in a monochrome theme. */}
        <div
          aria-hidden
          className="lectura-glow pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-amber-400/20 blur-[64px]"
        />
        {/* Scrim — keeps the serif text crisp over the glow. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-background/30"
        />
        {/* Masked gradient hairline (edge-lighting). */}
        <div
          aria-hidden
          className="lectura-border pointer-events-none absolute inset-0 rounded-[20px]"
        />

        <div className="relative">
          <header className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]">
              <PenLine className="h-3.5 w-3.5 text-amber-300/90" aria-hidden />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/70">
                Lectura del analista
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/45">
                síntesis · cliente 360
              </span>
            </div>
          </header>

          {hasNarrativa && (
            <figure className="relative mt-5">
              <span
                aria-hidden
                className="pointer-events-none absolute -left-1 -top-8 select-none font-serif text-[76px] leading-none text-amber-200/[0.09]"
              >
                &ldquo;
              </span>
              <blockquote className="relative font-serif text-[16px] leading-[1.75] text-foreground/95">
                {narrativa}
              </blockquote>
            </figure>
          )}

          {hasRasgos && (
            <footer
              className={`flex flex-wrap items-center gap-2 ${
                hasNarrativa ? "mt-6 border-t border-white/[0.06] pt-5" : ""
              }`}
            >
              <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/45">
                Rasgos
              </span>
              {rasgos.map((rasgo, i) => (
                <RasgoBadge key={i} label={rasgo} />
              ))}
            </footer>
          )}
        </div>
      </article>
    </section>
  );
}
