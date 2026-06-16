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

const ICONS: Record<Density, React.ElementType> = {
  compact: Rows4,
  normal: Rows3,
  comfortable: Rows2,
};

interface Props {
  density: Density;
  onChange: (density: Density) => void;
  className?: string;
}

export function ClientesDensityToggle({ density, onChange, className }: Props) {
  return (
    <TooltipProvider>
      <div className={cn("flex items-center rounded-md border border-border/60", className)}>
        {DENSITY_OPTIONS.map((opt) => {
          const Icon = ICONS[opt.value];
          const isActive = density === opt.value;
          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 rounded-none first:rounded-l-[calc(var(--radius)-2px)] last:rounded-r-[calc(var(--radius)-2px)] border-r border-border/60 last:border-r-0",
                    isActive && "bg-muted"
                  )}
                  onClick={() => onChange(opt.value)}
                  aria-pressed={isActive}
                  aria-label={opt.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {opt.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
