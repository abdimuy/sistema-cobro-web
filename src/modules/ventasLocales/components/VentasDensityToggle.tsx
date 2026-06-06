import { Rows2, Rows3, Rows4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Density, DENSITY_OPTIONS } from "./columns";
import { cn } from "@/lib/utils";

// Rows4 = most rows (compact), Rows3 = medium, Rows2 = fewest rows (comfortable)
const ICONS: Record<Density, React.ElementType> = {
  compact: Rows4,
  normal: Rows3,
  comfortable: Rows2,
};

interface VentasDensityToggleProps {
  density: Density;
  onChange: (d: Density) => void;
  className?: string;
}

export function VentasDensityToggle({
  density,
  onChange,
  className,
}: VentasDensityToggleProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "inline-flex items-center rounded-md border border-border/50 p-0.5",
          className
        )}
      >
        {DENSITY_OPTIONS.map((opt) => {
          const Icon = ICONS[opt.value];
          const active = density === opt.value;
          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={opt.label}
                  className={cn(
                    "h-7 w-7 rounded-sm",
                    active && "bg-muted text-foreground",
                    !active && "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => onChange(opt.value)}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span className="text-xs">{opt.label}</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
