import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoHintProps {
  text: string;
  label?: string;
  className?: string;
}

export function InfoHint({ text, label, className }: InfoHintProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label ? `Qué significa: ${label}` : "Más información"}
            className={`inline-flex shrink-0 cursor-help items-center justify-center focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm ${className ?? ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CircleHelp className="h-3 w-3 text-muted-foreground/50 transition-colors hover:text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[220px] text-xs font-normal leading-snug"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
