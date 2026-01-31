import { Search, FileX, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VentasEmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
  className?: string;
}

export function VentasEmptyState({
  hasFilters,
  onClearFilters,
  className,
}: VentasEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4",
        className
      )}
    >
      <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        {hasFilters ? (
          <Search className="h-6 w-6 text-muted-foreground" />
        ) : (
          <FileX className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      <h3 className="text-base font-medium text-foreground mb-1">
        {hasFilters ? "Sin resultados" : "No hay ventas"}
      </h3>

      <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
        {hasFilters
          ? "No se encontraron ventas con los filtros aplicados. Intenta ajustar tu búsqueda."
          : "Aún no hay ventas registradas en el sistema."}
      </p>

      {hasFilters && onClearFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
