import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CampoInline } from "../piezas/CampoInline";
import { MontoInput } from "../piezas/MontoInput";
import { DiaCobranzaPicker } from "../piezas/DiaCobranzaPicker";
import { PlanCreditoCoherencePanel } from "../piezas/PlanCreditoCoherencePanel";
import type {
  FinancieroFormData,
  ValidationError,
} from "../../../presentation/hooks/useVentaEditState";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanTabProps {
  data: FinancieroFormData;
  errors: ValidationError[];
  preciosCalculados: { anual: number; cortoPlazo: number; contado: number };
  onUpdate: (
    field: keyof FinancieroFormData,
    value: FinancieroFormData[keyof FinancieroFormData],
  ) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMoney = (n: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const getFieldError = (errors: ValidationError[], field: string): string | undefined =>
  errors.find((e) => e.field === field)?.message;

// ─── Sub-components ───────────────────────────────────────────────────────────

const SubCardHeader = ({ title }: { title: string }) => (
  <div className="border-b border-border/60 px-5 py-3">
    <h3 className="font-serif text-lg font-normal text-foreground">{title}</h3>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const PlanTab = ({
  data,
  errors,
  preciosCalculados,
  onUpdate,
}: PlanTabProps) => {
  const isCredito = data.tipoVenta === "CREDITO";

  const errorEnganche = getFieldError(errors, "financiero.enganche");
  const errorParcialidad = getFieldError(errors, "financiero.parcialidad");
  const errorFrecPago = getFieldError(errors, "financiero.frecPago");
  const errorDiaSemana = getFieldError(errors, "financiero.diaCobranzaSemana");
  const errorDiaMes = getFieldError(errors, "financiero.diaCobranzaMes");
  const errorNota = getFieldError(errors, "financiero.nota");

  const handleFrecPagoChange = (value: string) => {
    const newFrec = value as FinancieroFormData["frecPago"];
    onUpdate("frecPago", newFrec);
    if (newFrec === "SEMANAL") {
      onUpdate("diaCobranzaMes", 0);
    } else if (newFrec === "QUINCENAL" || newFrec === "MENSUAL") {
      onUpdate("diaCobranzaSemana", "");
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-card: Datos generales */}
      <div className="rounded-lg border border-border/60 bg-card">
        <SubCardHeader title="Datos generales" />
        <div className="px-5 py-5 space-y-5">
          <CampoInline label="Fecha de venta" obligatorio>
            <Input
              type="datetime-local"
              value={data.fechaVenta.slice(0, 16)}
              onChange={(e) => {
                const iso = e.target.value
                  ? `${e.target.value}:00.000Z`
                  : data.fechaVenta;
                onUpdate("fechaVenta", iso);
              }}
            />
          </CampoInline>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Tipo de venta
            </label>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                {data.tipoVenta}
              </span>
              <p className="text-[11px] text-muted-foreground">
                Para cambiar el tipo, regresá a borrador y crea una nueva venta.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-card: Montos
          Sólo lectura, y no por prudencia: el servidor DESCARTA los montos que
          se le manden. `crear_venta.go` los marca "ignored: montos are derived
          from line items" y `ActualizarHeaderInput` ni siquiera los incluye.
          Eran tres campos editables que no hacían nada — se escribía otro
          número, se guardaba sin error, y al recargar volvía al anterior.
          Para cambiar un total hay que cambiar los precios de las líneas, en
          la pestaña Productos. */}
      <div className="rounded-lg border border-border/60 bg-card">
        <SubCardHeader title="Montos" />
        <div className="px-5 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CampoInline label="Anual" helper="Suma de productos">
              <p className="font-mono text-sm tabular-nums text-foreground">
                {fmtMoney(preciosCalculados.anual)}
              </p>
            </CampoInline>

            <CampoInline label="Corto plazo" helper="Suma de productos">
              <p className="font-mono text-sm tabular-nums text-foreground">
                {fmtMoney(preciosCalculados.cortoPlazo)}
              </p>
            </CampoInline>

            <CampoInline label="Contado" helper="Suma de productos">
              <p className="font-mono text-sm tabular-nums text-foreground">
                {fmtMoney(preciosCalculados.contado)}
              </p>
            </CampoInline>
          </div>
        </div>
      </div>

      {/* Sub-card: Plan de crédito (only if CREDITO) */}
      {isCredito && (
        <div className="rounded-lg border border-border/60 bg-card">
          <SubCardHeader title="Plan de crédito" />
          <div className="px-5 py-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CampoInline
                label="Plazo (meses)"
                obligatorio
              >
                <Input
                  type="number"
                  min="1"
                  value={data.plazoMeses || ""}
                  onChange={(e) =>
                    onUpdate("plazoMeses", parseInt(e.target.value, 10) || 0)
                  }
                  placeholder="ej. 12"
                />
              </CampoInline>

              <CampoInline
                label="Frecuencia"
                obligatorio
                error={errorFrecPago}
              >
                <Select
                  value={data.frecPago}
                  onValueChange={handleFrecPagoChange}
                >
                  <SelectTrigger
                    className={cn(
                      errorFrecPago &&
                        "border-destructive/60 focus-visible:ring-destructive/30",
                    )}
                  >
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEMANAL">Semanal</SelectItem>
                    <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                    <SelectItem value="MENSUAL">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </CampoInline>

              <CampoInline label="Enganche" obligatorio error={errorEnganche}>
                <MontoInput
                  value={data.enganche}
                  onChange={(v) => onUpdate("enganche", v)}
                  error={!!errorEnganche}
                />
              </CampoInline>

              <CampoInline
                label="Parcialidad"
                obligatorio
                error={errorParcialidad}
              >
                <MontoInput
                  value={data.parcialidad}
                  onChange={(v) => onUpdate("parcialidad", v)}
                  error={!!errorParcialidad}
                />
              </CampoInline>
            </div>

            {data.frecPago !== "" && (
              <DiaCobranzaPicker
                frecPago={data.frecPago}
                diaSemana={data.diaCobranzaSemana}
                diaMes={data.diaCobranzaMes}
                error={errorDiaSemana ?? errorDiaMes}
                onSemanaChange={(v) => onUpdate("diaCobranzaSemana", v)}
                onMesChange={(v) => onUpdate("diaCobranzaMes", v)}
              />
            )}

            <PlanCreditoCoherencePanel
              anualRaw={data.montoAnual}
              engancheRaw={data.enganche}
              parcialidadRaw={data.parcialidad}
              plazoMeses={data.plazoMeses}
            />
          </div>
        </div>
      )}

      {/* Sub-card: Nota */}
      <div className="rounded-lg border border-border/60 bg-card">
        <SubCardHeader title="Nota" />
        <div className="px-5 py-5">
          <CampoInline
            label="Nota"
            helper={`${data.nota.length}/500`}
          >
            <Textarea
              value={data.nota}
              maxLength={500}
              onChange={(e) => onUpdate("nota", e.target.value)}
              className={cn(
                errorNota && "border-destructive/60 focus-visible:ring-destructive/30",
              )}
              rows={3}
            />
          </CampoInline>
        </div>
      </div>
    </div>
  );
};
