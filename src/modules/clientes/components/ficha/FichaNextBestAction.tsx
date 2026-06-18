import { Phone, MessageCircle, Calendar } from "lucide-react";
import { CELLS, resolveCell } from "./lib/matrizAccion";
import { buildWhatsAppHref } from "./lib/whatsapp";
import { formatMoneyShort } from "../lib/format";
import type { Pulso } from "../../domain/entities/FichaCliente";

// ─── Sub-components ────────────────────────────────────────────────────────────

function ActionButton({
  children,
  href,
  ghost = false,
}: {
  children: React.ReactNode;
  href?: string;
  ghost?: boolean;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-md border px-4 py-2 font-mono text-[11px] tracking-[0.06em] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const solid =
    "border-foreground/20 bg-foreground text-background";
  const ghostCls =
    "border-border bg-transparent text-foreground";

  const classes = `${base} ${ghost ? ghostCls : solid}`;

  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes}>
      {children}
    </button>
  );
}

// ─── Public component ──────────────────────────────────────────────────────────

interface Props {
  pulso: Pulso | null;
  telefono: string;
}

export function FichaNextBestAction({ pulso, telefono }: Props) {
  // Need both bands to resolve the quadrant
  if (!pulso || !pulso.bandaCredito || !pulso.bandaRecompra) return null;

  const { bandaCredito, bandaRecompra, scoreCredito, scoreRecompra, clv, bandaClv, nextBestProduct } =
    pulso;

  const key = resolveCell(bandaCredito, bandaRecompra);
  const cell = CELLS[key];

  // Build the "por qué" line from available data
  const whyParts: string[] = [
    `riesgo ${bandaCredito.toLowerCase()}${scoreCredito != null ? ` (${scoreCredito})` : ""}`,
    `recompra ${bandaRecompra.toLowerCase()}${scoreRecompra != null ? ` (${scoreRecompra})` : ""}`,
  ];
  if (clv && bandaClv) {
    whyParts.push(`CLV ${formatMoneyShort(clv)} (${bandaClv.toLowerCase()})`);
  }
  const whyLine = whyParts.join(" · ");

  const hasTelefono = Boolean(telefono.trim());

  return (
    <section
      className="border-b border-border/60 px-8 py-8"
      aria-label="Acción recomendada"
    >
      {/* Heading row */}
      <div className="mb-4 flex items-center gap-3">
        <div>
          <h3 className="font-serif text-base font-normal text-foreground">
            Acción recomendada
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            matriz riesgo × propensión
          </p>
        </div>
        {/* Quadrant chip */}
        <span
          className={`ml-1 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${cell.chipText} ${cell.chipBorder}`}
        >
          {cell.label}
        </span>
      </div>

      {/* Action card */}
      <div
        className={`flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between ${cell.cardBorder} ${cell.cardBg}`}
      >
        {/* Left: text */}
        <div className="flex flex-col gap-1">
          <h4 className="font-serif text-xl font-normal text-foreground">
            {cell.headline}
          </h4>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-muted-foreground">
            {whyLine}
          </p>
          {nextBestProduct && (
            <p className="mt-1 font-mono text-xs text-foreground/80">
              Próximo mejor producto:{" "}
              <span className="font-serif text-sm font-normal text-foreground">
                {nextBestProduct}
              </span>
            </p>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          {hasTelefono && (
            <ActionButton href={`tel:${telefono}`}>
              <Phone size={13} aria-hidden="true" />
              Llamar
            </ActionButton>
          )}
          {hasTelefono && (
            <ActionButton href={buildWhatsAppHref(telefono)} ghost>
              <MessageCircle size={13} aria-hidden="true" />
              WhatsApp
            </ActionButton>
          )}
          <ActionButton ghost>
            <Calendar size={13} aria-hidden="true" />
            Agendar
          </ActionButton>
        </div>
      </div>
    </section>
  );
}
