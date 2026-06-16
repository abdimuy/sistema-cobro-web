import { Users, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  hasFilters: boolean;
  onClearFilters?: () => void;
  className?: string;
}

export function ClientesEmptyState({ hasFilters, onClearFilters, className }: Props) {
  if (hasFilters) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-64 gap-3 text-center",
          className
        )}
      >
        <SearchX className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium text-foreground">Sin resultados</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ningún cliente coincide con los filtros activos
          </p>
        </div>
        {onClearFilters && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs mt-1"
            onClick={onClearFilters}
          >
            Limpiar filtros
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-64 gap-3 text-center",
        className
      )}
    >
      <Users className="h-10 w-10 text-muted-foreground/40" />
      <div>
        <p className="text-sm font-medium text-foreground">No hay clientes</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          El directorio no tiene clientes registrados
        </p>
      </div>
    </div>
  );
}
