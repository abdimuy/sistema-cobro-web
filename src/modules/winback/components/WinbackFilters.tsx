import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Segmento } from "../domain/values";
import type { SegmentoValue } from "../domain/values";

const segmentoLabels: Record<SegmentoValue, string> = {
  DORMIDO_VALIOSO: "Dormido valioso",
  LEAL_POR_LIQUIDAR: "Leal por liquidar",
  ACTIVO: "Activo",
  NUEVO: "Nuevo",
  FRIO: "Frío",
  PERDIDO: "Perdido",
};

interface WinbackFiltersProps {
  segmento?: SegmentoValue | "ALL";
  zona?: string | "ALL";
  incluirActivos: boolean;
  zonaOptions: string[];
  onSegmentoChange: (v: SegmentoValue | undefined) => void;
  onZonaChange: (v: string | undefined) => void;
  onIncluirActivosChange: (v: boolean) => void;
}

const ALL_SEGMENTOS = "__all__";
const ALL_ZONAS = "__all__";

const WinbackFilters: React.FC<WinbackFiltersProps> = ({
  segmento,
  zona,
  incluirActivos,
  zonaOptions,
  onSegmentoChange,
  onZonaChange,
  onIncluirActivosChange,
}) => {
  const segmentoValue = !segmento || segmento === "ALL" ? ALL_SEGMENTOS : segmento;
  const zonaValue = !zona || zona === "ALL" ? ALL_ZONAS : zona;

  function handleSegmentoChange(v: string) {
    onSegmentoChange(v === ALL_SEGMENTOS ? undefined : (v as SegmentoValue));
  }

  function handleZonaChange(v: string) {
    onZonaChange(v === ALL_ZONAS ? undefined : v);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Segmento filter */}
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Segmento
        </span>
        <Select value={segmentoValue} onValueChange={handleSegmentoChange}>
          <SelectTrigger className="h-8 w-[180px] text-xs border-border/60">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SEGMENTOS}>Todos</SelectItem>
            {Segmento.values().map((s) => (
              <SelectItem key={s} value={s}>
                {segmentoLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Zona filter */}
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Zona
        </span>
        <Select value={zonaValue} onValueChange={handleZonaChange}>
          <SelectTrigger className="h-8 w-[160px] text-xs border-border/60">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ZONAS}>Todas</SelectItem>
            {zonaOptions.map((z) => (
              <SelectItem key={z} value={z}>
                {z}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Incluir activos checkbox */}
      <div className="flex items-center gap-2 self-end pb-1">
        <Checkbox
          id="incluir-activos"
          checked={incluirActivos}
          onCheckedChange={(checked) =>
            onIncluirActivosChange(checked === true)
          }
        />
        <Label
          htmlFor="incluir-activos"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground cursor-pointer"
        >
          Incluir activos
        </Label>
      </div>
    </div>
  );
};

export default WinbackFilters;
