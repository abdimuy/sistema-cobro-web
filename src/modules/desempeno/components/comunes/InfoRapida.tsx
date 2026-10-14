import { Fragment, type ReactElement, type ReactNode } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export const RETRASO_APERTURA_MS = 300;

// InfoRapida: popover de información rápida (D17). El disparador es el hijo
// (un elemento DOM). Para abrirse también con teclado, el hijo lleva
// tabIndex={0}; los elementos de la línea de actividad no lo llevan (spec §10:
// esos se abren con el ratón). El contenido solo se monta al abrirse.
export function InfoRapida({
  children,
  contenido,
  lado = "bottom",
  className,
}: {
  children: ReactElement;
  contenido: ReactNode;
  lado?: "top" | "bottom";
  className?: string;
}) {
  return (
    <HoverCard openDelay={RETRASO_APERTURA_MS} closeDelay={120}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent
          side={lado}
          sideOffset={8}
          className={cn(
            "w-auto min-w-[220px] max-w-[320px] rounded-[10px] bg-dsm-tarjeta px-3.5 py-3 text-[12.5px] leading-snug shadow-lg",
            className,
          )}
        >
          {contenido}
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  );
}

export function TarjetaTitulo({ children }: { children: ReactNode }) {
  return <div className="text-[13px] font-medium">{children}</div>;
}

export function TarjetaSub({ children }: { children: ReactNode }) {
  return <div className="mt-px font-mono text-[10.5px] text-muted-foreground">{children}</div>;
}

export function TarjetaFilas({ filas }: { filas: ReadonlyArray<readonly [string, ReactNode]> }) {
  return (
    <dl className="mt-2.5 grid grid-cols-[auto_auto] items-baseline gap-x-4 gap-y-1">
      {filas.map(([clave, valor]) => (
        <Fragment key={clave}>
          <dt className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            {clave}
          </dt>
          <dd className="m-0 text-right tabular">{valor}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

export function TarjetaNota({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-foreground/80">{children}</p>;
}

export function TarjetaSeparador() {
  return <div className="my-2.5 h-px bg-border" />;
}

export function TarjetaLista({ filas }: { filas: ReadonlyArray<readonly [string, string]> }) {
  return (
    <ul className="mt-2 flex flex-col gap-1 tabular">
      {filas.map(([izq, der], i) => (
        <li key={`${izq}-${i}`} className="flex justify-between gap-4">
          <span className="font-mono text-[11.5px]">{izq}</span>
          <span>{der}</span>
        </li>
      ))}
    </ul>
  );
}

// TarjetaBarras: barras de proporción. `n` y `total` llegan del API; el ancho
// es solo dibujo.
export function TarjetaBarras({
  filas,
}: {
  filas: ReadonlyArray<{ etiqueta: string; n: number; total: number; clase: string }>;
}) {
  return (
    <div className="mt-2.5 flex flex-col gap-1.5">
      {filas.map((f) => (
        <div key={f.etiqueta} className="grid grid-cols-[78px_1fr_34px] items-center gap-2 text-xs">
          <span>{f.etiqueta}</span>
          <i className="block h-1.5 overflow-hidden rounded-full bg-muted">
            <b
              className={cn("block h-full", f.clase)}
              style={{ width: `${f.total > 0 ? (f.n / f.total) * 100 : 0}%` }}
            />
          </i>
          <span className="text-right tabular">{f.n}</span>
        </div>
      ))}
    </div>
  );
}
