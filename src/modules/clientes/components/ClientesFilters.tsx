import { useState } from "react";
import { Filter, X, Tag, MapPin, BarChart3, Wallet, Users, AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { SegmentoValue, EstadoPagoValue } from "../domain/values";
import type { DirectorioFacets } from "../application/dto";

export interface FilterState {
  segmento?: string;
  estadoPago?: string;
  tierRiesgo?: string;
  bandaCredito?: string;
  conSaldo?: boolean;
  scoreMin?: number;
  zonaInput?: string;    // Phase 1: free-text, no catalog yet
  cobradorInput?: string; // Phase 1: free-text, no catalog yet
}

interface ClientesFiltersProps extends FilterState {
  onChange: (changes: Partial<FilterState>) => void;
  facets?: DirectorioFacets;
  className?: string;
}

const SEGMENTO_LABELS: Record<SegmentoValue, string> = {
  LEAL_POR_LIQUIDAR: "Leal por liquidar",
  DORMIDO_VALIOSO: "Dormido valioso",
  ACTIVO: "Activo",
  NUEVO: "Nuevo",
  FRIO: "Frío",
  PERDIDO: "Perdido",
};

const ESTADO_PAGO_LABELS: Record<EstadoPagoValue, string> = {
  AL_CORRIENTE: "Al corriente",
  ATRASADO: "Atrasado",
  MOROSO: "Moroso",
  LIQUIDADO: "Liquidado",
  SIN_CREDITO: "Sin crédito",
};

const TIER_RIESGO_LABELS: Record<string, string> = {
  AL_DIA: "Al día",
  VIGILANCIA: "Vigilancia",
  EN_RIESGO: "En riesgo",
  CRITICO: "Crítico",
};
const TIER_ORDER = ["AL_DIA", "VIGILANCIA", "EN_RIESGO", "CRITICO"] as const;

const BANDA_CREDITO_LABELS: Record<string, string> = {
  BAJO: "Riesgo bajo",
  MEDIO: "Riesgo medio",
  ALTO: "Riesgo alto",
  CRITICO: "Riesgo crítico",
};
const BANDA_CREDITO_ORDER = ["BAJO", "MEDIO", "ALTO", "CRITICO"] as const;

const SCORE_OPTIONS: { value: number | undefined; label: string }[] = [
  { value: undefined, label: "Cualquiera" },
  { value: 30, label: "30+" },
  { value: 50, label: "50+" },
  { value: 70, label: "70+" },
];

const ALL_VALUE = "__all__";

function countActiveFilters(state: Omit<ClientesFiltersProps, "onChange" | "className">): number {
  let count = 0;
  if (state.segmento) count++;
  if (state.estadoPago) count++;
  if (state.tierRiesgo) count++;
  if (state.bandaCredito) count++;
  if (state.conSaldo) count++;
  if (state.scoreMin !== undefined) count++;
  if (state.zonaInput) count++;
  if (state.cobradorInput) count++;
  return count;
}

export function ClientesFilters({
  segmento,
  estadoPago,
  tierRiesgo,
  bandaCredito,
  conSaldo,
  scoreMin,
  zonaInput,
  cobradorInput,
  onChange,
  facets,
  className,
}: ClientesFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeCount = countActiveFilters({
    segmento,
    estadoPago,
    tierRiesgo,
    bandaCredito,
    conSaldo,
    scoreMin,
    zonaInput,
    cobradorInput,
  });

  function handleClearAll() {
    onChange({
      segmento: undefined,
      estadoPago: undefined,
      tierRiesgo: undefined,
      bandaCredito: undefined,
      conSaldo: undefined,
      scoreMin: undefined,
      zonaInput: undefined,
      cobradorInput: undefined,
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 gap-1.5 text-xs border-border/60", className)}
          aria-label="Filtros"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filtros</span>
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="h-4 min-w-4 px-1 text-[10px] tabular-nums"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Filtros avanzados</span>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-muted-foreground"
              onClick={handleClearAll}
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>

        <Separator />

        {/* Segmento */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            Segmento
          </Label>
          <Select
            value={segmento ?? ALL_VALUE}
            onValueChange={(v) =>
              onChange({ segmento: v === ALL_VALUE ? undefined : v })
            }
          >
            <SelectTrigger className="h-8 text-xs border-border/60">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos</SelectItem>
              {(Object.entries(SEGMENTO_LABELS) as [SegmentoValue, string][]).map(
                ([val, label]) => {
                  const count = facets?.["segmento"]?.[val];
                  return (
                    <SelectItem key={val} value={val}>
                      <span>{label}</span>
                      {count !== undefined && (
                        <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">
                          ({count.toLocaleString("es-MX")})
                        </span>
                      )}
                    </SelectItem>
                  );
                }
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Estado pago */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wallet className="h-3 w-3" />
            Estado pago
          </Label>
          <Select
            value={estadoPago ?? ALL_VALUE}
            onValueChange={(v) =>
              onChange({ estadoPago: v === ALL_VALUE ? undefined : v })
            }
          >
            <SelectTrigger className="h-8 text-xs border-border/60">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos</SelectItem>
              {(
                Object.entries(ESTADO_PAGO_LABELS) as [EstadoPagoValue, string][]
              ).map(([val, label]) => {
                const count = facets?.["estado_pago"]?.[val];
                return (
                  <SelectItem key={val} value={val}>
                    <span>{label}</span>
                    {count !== undefined && (
                      <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">
                        ({count.toLocaleString("es-MX")})
                      </span>
                    )}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Riesgo */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            Riesgo
          </Label>
          <Select
            value={tierRiesgo ?? ALL_VALUE}
            onValueChange={(v) =>
              onChange({ tierRiesgo: v === ALL_VALUE ? undefined : v })
            }
          >
            <SelectTrigger className="h-8 text-xs border-border/60">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos</SelectItem>
              {TIER_ORDER.map((val) => {
                const count = facets?.["tier_riesgo"]?.[val];
                return (
                  <SelectItem key={val} value={val}>
                    <span>{TIER_RIESGO_LABELS[val]}</span>
                    {count !== undefined && (
                      <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">
                        ({count.toLocaleString("es-MX")})
                      </span>
                    )}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Riesgo crédito */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CreditCard className="h-3 w-3" />
            Riesgo crédito
          </Label>
          <Select
            value={bandaCredito ?? ALL_VALUE}
            onValueChange={(v) =>
              onChange({ bandaCredito: v === ALL_VALUE ? undefined : v })
            }
          >
            <SelectTrigger className="h-8 text-xs border-border/60">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos</SelectItem>
              {BANDA_CREDITO_ORDER.map((val) => {
                const count = facets?.["banda_credito"]?.[val];
                return (
                  <SelectItem key={val} value={val}>
                    <span>{BANDA_CREDITO_LABELS[val]}</span>
                    {count !== undefined && (
                      <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">
                        ({count.toLocaleString("es-MX")})
                      </span>
                    )}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Score mínimo */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BarChart3 className="h-3 w-3" />
            Score mínimo
          </Label>
          <Select
            value={scoreMin !== undefined ? String(scoreMin) : ALL_VALUE}
            onValueChange={(v) =>
              onChange({
                scoreMin: v === ALL_VALUE ? undefined : Number(v),
              })
            }
          >
            <SelectTrigger className="h-8 text-xs border-border/60">
              <SelectValue placeholder="Cualquiera" />
            </SelectTrigger>
            <SelectContent>
              {SCORE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value ?? ALL_VALUE}
                  value={opt.value !== undefined ? String(opt.value) : ALL_VALUE}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Con saldo */}
        <div className="flex items-center justify-between">
          <Label
            htmlFor="con-saldo-switch"
            className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer"
          >
            <Wallet className="h-3 w-3" />
            Con saldo
          </Label>
          <Switch
            id="con-saldo-switch"
            checked={conSaldo ?? false}
            onCheckedChange={(checked) =>
              onChange({ conSaldo: checked || undefined })
            }
          />
        </div>

        <Separator />

        {/* Zona — Phase 1: free-text, no catalog yet */}
        <div className="space-y-1.5">
          <Label
            htmlFor="zona-input"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <MapPin className="h-3 w-3" />
            Zona
          </Label>
          <Input
            id="zona-input"
            value={zonaInput ?? ""}
            onChange={(e) =>
              onChange({ zonaInput: e.target.value || undefined })
            }
            placeholder="Ej. ZONA_NORTE"
            className="h-8 text-xs border-border/60"
          />
        </div>

        {/* Cobrador — Phase 1: free-text, no catalog yet */}
        <div className="space-y-1.5">
          <Label
            htmlFor="cobrador-input"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Users className="h-3 w-3" />
            Cobrador
          </Label>
          <Input
            id="cobrador-input"
            value={cobradorInput ?? ""}
            onChange={(e) =>
              onChange({ cobradorInput: e.target.value || undefined })
            }
            placeholder="ID o nombre"
            className="h-8 text-xs border-border/60"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
