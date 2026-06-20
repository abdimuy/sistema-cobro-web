import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import ScoreBadge from "../badges/ScoreBadge";
import SegmentoBadge from "../badges/SegmentoBadge";
import { formatMoney } from "../lib/format";
import type { FichaCliente } from "../../domain/entities/FichaCliente";

interface Props {
  ficha: FichaCliente;
}

// Notes longer than this collapse to a few lines with a "ver más" toggle.
const NOTA_MAX = 160;

// Microsip notes are a free-form follow-up log: a description, *name account
// markers, ****EMPHASIS**** flags, and a dated timeline (DD-MM-YYYY). This
// regex tokenises those structural cues so they can be highlighted without
// rewriting the text — robust to any note shape (non-matching text passes through).
const NOTA_TOKEN_RE = /(\*{2,}\s*[^*]+?\s*\*{2,})|(\b\d{1,2}-\d{1,2}-\d{4}\b)|(\*)/g;

// highlightNota turns the raw note into nodes with dates and markers emphasised.
function highlightNota(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  NOTA_TOKEN_RE.lastIndex = 0;
  while ((m = NOTA_TOKEN_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) {
      nodes.push(
        <strong key={key++} className="font-semibold text-foreground">
          {m[1].replace(/\*/g, "").trim()}
        </strong>,
      );
    } else if (m[2]) {
      nodes.push(
        <span key={key++} className="font-semibold text-foreground">
          {m[2]}
        </span>,
      );
    } else {
      // single "*" account marker → bullet
      nodes.push(
        <span key={key++} className="text-muted-foreground">
          •{" "}
        </span>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// NotaBlock renders the free-form client note as readable prose (sans-serif,
// relaxed leading) inside a labelled block — NOT the uppercase-mono label
// treatment, which made long notes unreadable. The original casing is kept
// verbatim (Microsip stores codes/names uppercase; transforming would mangle them).
function NotaBlock({ nota }: { nota: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = nota.length > NOTA_MAX;
  const shown = !isLong || expanded ? nota : `${nota.slice(0, NOTA_MAX).trimEnd()}…`;

  return (
    <div className="max-w-2xl border-l-2 border-border pl-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
        Nota
      </p>
      <p className="mt-1 whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-foreground/75">
        {highlightNota(shown)}
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ml-1.5 align-baseline font-mono text-[11px] uppercase tracking-wide text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            {expanded ? "ver menos" : "ver más"}
          </button>
        )}
      </p>
    </div>
  );
}

export function FichaHero({ ficha }: Props) {
  const { pulso } = ficha;
  const tieneSaldo = Number(ficha.resumen.saldo) > 0;
  const direccion = [
    ficha.direccion.calle,
    ficha.direccion.colonia,
    ficha.direccion.poblacion,
    ficha.direccion.estado,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="border-b border-border/60 px-8 py-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: identity */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <h1 className="font-serif text-[36px] font-normal leading-[1.1] tracking-tight text-foreground">
              {ficha.nombre}
            </h1>

            {/* Structured metadata — estatus omitted (shown as a pill in the header) */}
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Zona {ficha.zona}
              {ficha.cobrador && ` · ${ficha.cobrador}`}
              {` · #${ficha.clienteId}`}
            </p>

            {direccion && (
              <p className="font-mono text-[11px] text-muted-foreground/70">
                {direccion}
              </p>
            )}
          </div>

          {ficha.limiteCredito && Number(ficha.limiteCredito) > 0 && (
            <p className="font-mono text-[11px] text-muted-foreground/60">
              Límite crédito{" "}
              <span className="tabular-nums text-foreground/70">
                {formatMoney(ficha.limiteCredito)}
              </span>
            </p>
          )}

          {ficha.notas && <NotaBlock nota={ficha.notas} />}
        </div>

        {/* Right: Saldo + Reactivación */}
        <div className="flex shrink-0 flex-col gap-6 lg:items-end">
          {/* Saldo — de-emphasised when zero (a liquidated client's $0 is not the headline) */}
          <div className="lg:text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              SALDO
            </p>
            <p
              className={cn(
                "tabular-nums font-serif font-normal leading-none",
                tieneSaldo
                  ? "text-[44px] text-foreground"
                  : "text-2xl text-muted-foreground/50",
              )}
            >
              {formatMoney(ficha.resumen.saldo)}
            </p>
          </div>

          {/* Reactivación score + segmento (the actionable signals for this client) */}
          {pulso ? (
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Reactivación
                </span>
                <ScoreBadge score={pulso.score} tienePulso />
              </div>
              <SegmentoBadge value={pulso.segmento} />
            </div>
          ) : (
            <p className="font-mono text-[11px] text-muted-foreground/50">
              Sin pulso analítico
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
