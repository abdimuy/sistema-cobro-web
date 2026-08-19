import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { Check, Eye, FileEdit, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { VentaV2 } from "@/services/api/ventaV2Types";
import { FASE_PALETA, type FasePaleta, type FasePaletaKey } from "../fasePaleta";

dayjs.extend(relativeTime);
dayjs.locale("es");

type NodeState = "done" | "active" | "future" | "applied";
type StepKey = FasePaletaKey;

interface Step {
  key: StepKey;
  label: string;
  icon: typeof FileEdit;
  at?: string;
  activeHint: string;
}

/**
 * El lenguaje de color vive en `../fasePaleta` — lo comparte con el anillo de
 * la columna Fase. Aquí sólo se consume: si el azul de "aprobada" cambia,
 * cambia en los dos a la vez.
 */
const palette = FASE_PALETA;
type Palette = FasePaleta;

const stepIndex = (venta: VentaV2): number => {
  if (venta.sincronizacion === "aplicada") return 3;
  if (venta.situacion === "aprobada") return 2;
  if (venta.situacion === "revisada") return 1;
  return 0;
};

export const VentaWorkflowTimeline = ({ venta }: { venta: VentaV2 }) => {
  const cancelled = venta.situacion === "cancelada";
  const applied = venta.sincronizacion === "aplicada";
  const current = stepIndex(venta);

  const steps: Step[] = [
    {
      key: "borrador",
      label: "Borrador",
      icon: FileEdit,
      at: venta.created_at,
      activeHint: "Editable. Captúrala y márcala como revisada cuando esté lista.",
    },
    {
      key: "revisada",
      label: "Revisada",
      icon: Eye,
      at: undefined,
      activeHint: "Lista para evaluación. Apruébala para enviar a Microsip.",
    },
    {
      key: "aprobada",
      label: "Aprobada",
      icon: Check,
      at: venta.aprobacion?.at,
      activeHint: "Aprobada. Aplícala a Microsip cuando esté listo el inventario.",
    },
    {
      key: "aplicada",
      label: "Aplicada",
      icon: Send,
      at: venta.microsip_aplicada_at ?? undefined,
      activeHint: "",
    },
  ];

  const stateFor = (i: number): NodeState => {
    if (cancelled) return i === 0 ? "done" : "future";
    if (applied && i === 3) return "applied";
    if (i < current) return "done";
    if (i === current) return "active";
    return "future";
  };

  const currentStep = steps[current];
  const currentPalette = palette[currentStep.key];

  return (
    <section aria-label="Flujo de aprobación" className="px-8 pb-2">
      <div
        className={cn(
          "rounded-lg border border-border/60 bg-card/40 px-7 pb-6 pt-7 transition-opacity",
          cancelled && "opacity-50"
        )}
      >
        <div className="flex items-start">
          {steps.map((step, i) => {
            const state = stateFor(i);
            return (
              <Fragment key={step.key}>
                <StepColumn step={step} state={state} />
                {i < steps.length - 1 && (
                  <Connector
                    // Connector color = color of NEXT step, painted whenever
                    // we've already passed (or are on) the current step.
                    paint={
                      stateFor(i + 1) === "done" ||
                      stateFor(i + 1) === "applied" ||
                      stateFor(i + 1) === "active"
                        ? palette[steps[i + 1].key].rail
                        : null
                    }
                  />
                )}
              </Fragment>
            );
          })}
        </div>

        {!cancelled && currentStep && (
          <div className="mt-7 border-t border-border/50 pt-4">
            {applied ? (
              <AppliedDetail venta={venta} />
            ) : (
              <ActiveDetail step={currentStep} palette={currentPalette} />
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const Fragment = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const StepColumn = ({ step, state }: { step: Step; state: NodeState }) => {
  const isActive = state === "active";
  const isDone = state === "done";
  const isApplied = state === "applied";
  const isFuture = state === "future";
  const Icon = step.icon;
  const p = palette[step.key];

  return (
    <div className="flex w-[110px] shrink-0 flex-col items-center">
      <div
        className={cn(
          "relative flex h-7 w-7 items-center justify-center rounded-full transition-colors",
          (isDone || isApplied) && cn(p.bg, "text-white"),
          isActive && cn("border bg-background ring-4", p.border, p.fg, p.halo),
          isFuture &&
            "border border-dashed border-muted-foreground/40 bg-background text-muted-foreground/50"
        )}
      >
        {/* Breathing halo: subtle radar pulse on the in-progress step. */}
        {isActive && (
          <span
            aria-hidden
            className={cn(
              "timeline-halo pointer-events-none absolute inset-0 rounded-full border-2",
              p.border
            )}
          />
        )}
        {isDone || isApplied ? (
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        ) : (
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        )}
      </div>

      <p
        className={cn(
          "mt-3 text-[12px] leading-none",
          isActive && cn("font-semibold", p.fg),
          isDone && "font-medium text-foreground/85",
          isApplied && cn("font-medium", p.fg),
          isFuture && "text-muted-foreground/60"
        )}
      >
        {step.label}
      </p>

      <p className="mt-1.5 h-3 font-mono text-[10px] leading-none text-muted-foreground/70">
        {step.at ? (
          <span title={dayjs(step.at).format("DD MMM YYYY · HH:mm")}>
            {dayjs(step.at).fromNow()}
          </span>
        ) : (
          <span className="opacity-50">—</span>
        )}
      </p>
    </div>
  );
};

const Connector = ({ paint }: { paint: string | null }) => (
  <div className="mx-1 mt-[13px] h-px flex-1">
    {paint ? (
      <div className={cn("h-full w-full", paint)} />
    ) : (
      <div className="h-full w-full border-t border-dashed border-muted-foreground/30" />
    )}
  </div>
);

const ActiveDetail = ({ step, palette: p }: { step: Step; palette: Palette }) => (
  <div>
    <p
      className={cn(
        "text-[10px] font-medium uppercase tracking-[0.16em]",
        p.caption
      )}
    >
      Paso actual
    </p>
    <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <p className="text-sm font-semibold text-foreground">{step.label}</p>
      {step.activeHint && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <p className="text-sm text-muted-foreground">{step.activeHint}</p>
        </>
      )}
    </div>
  </div>
);

const AppliedDetail = ({ venta }: { venta: VentaV2 }) => (
  <div>
    <p
      className={cn(
        "text-[10px] font-medium uppercase tracking-[0.16em]",
        palette.aplicada.caption
      )}
    >
      Completada
    </p>
    <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <p className="text-sm font-semibold text-foreground">Aplicada en Microsip</p>
      {venta.microsip_folio && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <p className="font-mono text-xs text-foreground/80">{venta.microsip_folio}</p>
        </>
      )}
      {venta.microsip_aplicada_at && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <p
            className="text-xs text-muted-foreground"
            title={dayjs(venta.microsip_aplicada_at).format("DD MMM YYYY · HH:mm")}
          >
            {dayjs(venta.microsip_aplicada_at).fromNow()}
          </p>
        </>
      )}
    </div>
  </div>
);

export default VentaWorkflowTimeline;
