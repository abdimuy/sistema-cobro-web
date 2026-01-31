import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Store,
  CreditCard,
  MapPin,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
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
import { Separator } from "@/components/ui/separator";
import { VentasParams } from "@/services/api/getVentasLocales";
import { Almacen } from "@/hooks/useGetAlmacenes";
import { ZonaCliente } from "@/services/api/getZonasCliente";
import { cn } from "@/lib/utils";

interface VentasFiltersProps {
  params: VentasParams;
  onParamsChange: (params: Partial<VentasParams>) => void;
  almacenes: Almacen[];
  zonas: ZonaCliente[];
  className?: string;
}

export function VentasFilters({
  params,
  onParamsChange,
  almacenes,
  zonas,
  className,
}: VentasFiltersProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Count active filters
  const activeFilterCount = [
    params.fechaInicio,
    params.fechaFin,
    params.tipoVenta,
    params.almacenId,
    params.zonaClienteId,
    params.precioMin,
    params.precioMax,
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    onParamsChange({
      fechaInicio: undefined,
      fechaFin: undefined,
      tipoVenta: undefined,
      almacenId: undefined,
      zonaClienteId: undefined,
      precioMin: undefined,
      precioMax: undefined,
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Date Range Filter */}
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs font-normal border-border/50",
              (params.fechaInicio || params.fechaFin) &&
                "border-primary/50 bg-primary/5 text-primary"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {params.fechaInicio || params.fechaFin ? (
              <span className="hidden sm:inline">
                {params.fechaInicio
                  ? format(new Date(params.fechaInicio + "T00:00:00"), "dd MMM", { locale: es })
                  : "..."}{" "}
                -{" "}
                {params.fechaFin
                  ? format(new Date(params.fechaFin + "T00:00:00"), "dd MMM", { locale: es })
                  : "..."}
              </span>
            ) : (
              <span className="hidden sm:inline">Fecha</span>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{
              from: params.fechaInicio ? new Date(params.fechaInicio + "T00:00:00") : undefined,
              to: params.fechaFin ? new Date(params.fechaFin + "T00:00:00") : undefined,
            }}
            onSelect={(range) => {
              onParamsChange({
                fechaInicio: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
                fechaFin: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
              });
            }}
            locale={es}
            numberOfMonths={2}
            initialFocus
          />
          {(params.fechaInicio || params.fechaFin) && (
            <div className="p-2 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() =>
                  onParamsChange({
                    fechaInicio: undefined,
                    fechaFin: undefined,
                  })
                }
              >
                Limpiar fechas
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Advanced Filters */}
      <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs font-normal border-border/50",
              activeFilterCount > 0 &&
                "border-primary/50 bg-primary/5 text-primary"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-4 px-1 text-[10px] bg-primary/10 text-primary border-0"
              >
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filtros avanzados</span>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleClearFilters}
                >
                  Limpiar todo
                </Button>
              )}
            </div>
          </div>

          <div className="p-3 space-y-4">
            {/* Tipo de Venta */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="h-3 w-3" />
                Tipo de venta
              </Label>
              <Select
                value={params.tipoVenta || "all"}
                onValueChange={(v) =>
                  onParamsChange({
                    tipoVenta: v === "all" ? undefined : (v as "CONTADO" | "CREDITO"),
                  })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="CONTADO">Contado</SelectItem>
                  <SelectItem value="CREDITO">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Almacén */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Store className="h-3 w-3" />
                Almacén
              </Label>
              <Select
                value={params.almacenId?.toString() || "all"}
                onValueChange={(v) =>
                  onParamsChange({
                    almacenId: v === "all" ? undefined : parseInt(v),
                  })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los almacenes</SelectItem>
                  {almacenes.map((a) => (
                    <SelectItem key={a.ALMACEN_ID} value={a.ALMACEN_ID.toString()}>
                      {a.ALMACEN}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zona */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                Zona
              </Label>
              <Select
                value={params.zonaClienteId?.toString() || "all"}
                onValueChange={(v) =>
                  onParamsChange({
                    zonaClienteId: v === "all" ? undefined : parseInt(v),
                  })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las zonas</SelectItem>
                  {zonas.map((z) => (
                    <SelectItem
                      key={z.ZONA_CLIENTE_ID}
                      value={z.ZONA_CLIENTE_ID.toString()}
                    >
                      {z.ZONA_CLIENTE}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="!my-3" />

            {/* Price Range */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Rango de precio
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Mín"
                  value={params.precioMin || ""}
                  onChange={(e) =>
                    onParamsChange({
                      precioMin: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  className="h-8 text-sm"
                />
                <span className="text-muted-foreground text-xs">-</span>
                <Input
                  type="number"
                  placeholder="Máx"
                  value={params.precioMax || ""}
                  onChange={(e) =>
                    onParamsChange({
                      precioMax: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear All Filters Button */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Limpiar filtros</span>
          <Badge
            variant="secondary"
            className="ml-0.5 h-4 px-1 text-[10px] bg-muted border-0"
          >
            {activeFilterCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}
