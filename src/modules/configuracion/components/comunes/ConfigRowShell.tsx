import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";

interface Props {
  onOpen: () => void;
  ariaLabel: string;
  children: ReactNode;
}

// ConfigRowShell is the uniform, fixed-height, whole-row-clickable list item
// shared by both Configuración worklists. It owns the click/keyboard
// affordance and the trailing chevron; each screen supplies its own cells
// (name/summary/meter) as children so the row is always exactly the same
// height no matter how long the underlying names are.
export function ConfigRowShell({ onOpen, ariaLabel, children }: Props) {
  return (
    <TableRow
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="h-14 cursor-pointer border-border/40 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
    >
      {children}
      <TableCell className="w-12 px-3 py-0 align-middle">
        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
      </TableCell>
    </TableRow>
  );
}
