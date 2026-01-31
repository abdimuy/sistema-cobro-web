import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VentasErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function VentasErrorState({
  message,
  onRetry,
  className,
}: VentasErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4",
        className
      )}
    >
      <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>

      <h3 className="text-base font-medium text-foreground mb-1">
        Error al cargar
      </h3>

      <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
        {message}
      </p>

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
