import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ALL = "__all__";

export type FilterOption = { value: string; label: string };

interface CarteraFiltersProps {
  zona?: string;
  cobrador?: string;
  periodo?: string;
  zonaOptions: FilterOption[];
  cobradorOptions: FilterOption[];
  onZonaChange: (v: string | undefined) => void;
  onCobradorChange: (v: string | undefined) => void;
  onPeriodoChange: (v: string | undefined) => void;
}

const CarteraFilters: React.FC<CarteraFiltersProps> = ({
  zona,
  cobrador,
  periodo,
  zonaOptions,
  cobradorOptions,
  onZonaChange,
  onCobradorChange,
  onPeriodoChange,
}) => {
  const zonaValue = zona === undefined ? ALL : zona;
  const cobradorValue = cobrador === undefined ? ALL : cobrador;

  function handleZonaChange(v: string) {
    onZonaChange(v === ALL ? undefined : v);
  }

  function handleCobradorChange(v: string) {
    onCobradorChange(v === ALL ? undefined : v);
  }

  function handlePeriodoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.trim();
    onPeriodoChange(v === "" ? undefined : v);
  }

  return (
    <div data-testid="cartera-filters" className="flex flex-wrap items-center gap-3">
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
            <SelectItem value={ALL}>Todas</SelectItem>
            {zonaOptions.map((z) => (
              <SelectItem key={z.value} value={z.value}>
                {z.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cobrador filter */}
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Cobrador
        </span>
        <Select value={cobradorValue} onValueChange={handleCobradorChange}>
          <SelectTrigger className="h-8 w-[160px] text-xs border-border/60">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {cobradorOptions.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Periodo filter */}
      <div className="flex flex-col gap-1">
        <Label
          htmlFor="periodo-cartera"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
        >
          Periodo
        </Label>
        <Input
          id="periodo-cartera"
          className="h-8 w-[130px] text-xs border-border/60"
          placeholder="YYYY-MM"
          value={periodo ?? ""}
          onChange={handlePeriodoChange}
        />
      </div>
    </div>
  );
};

export default CarteraFilters;
