import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ClientesErrorState({ message, onRetry, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-64 gap-3 text-center",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-10 w-10 text-destructive/50" />
      <div>
        <p className="text-sm font-medium text-foreground">Error al cargar clientes</p>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 mt-1"
          onClick={onRetry}
        >
          <RefreshCw className="h-3 w-3" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
