import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { COLUMNS, ColumnId, DEFAULT_VISIBLE_COLUMNS } from "./columns";
import { cn } from "@/lib/utils";

interface VentasColumnSelectorProps {
  visibleColumns: ColumnId[];
  onChange: (columns: ColumnId[]) => void;
  className?: string;
}

export function VentasColumnSelector({
  visibleColumns,
  onChange,
  className,
}: VentasColumnSelectorProps) {
  const handleToggle = (columnId: ColumnId, checked: boolean) => {
    if (checked) {
      // Add column in the correct order
      const newColumns = COLUMNS
        .filter((col) => visibleColumns.includes(col.id) || col.id === columnId)
        .map((col) => col.id);
      onChange(newColumns);
    } else {
      // Don't allow hiding all columns
      if (visibleColumns.length <= 1) return;
      onChange(visibleColumns.filter((id) => id !== columnId));
    }
  };

  const handleReset = () => {
    onChange(DEFAULT_VISIBLE_COLUMNS);
  };

  const hasChanges =
    JSON.stringify(visibleColumns.sort()) !==
    JSON.stringify([...DEFAULT_VISIBLE_COLUMNS].sort());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-xs font-normal border-border/50",
            className
          )}
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Columnas</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Columnas visibles</span>
            {hasChanges && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleReset}
              >
                Restablecer
              </Button>
            )}
          </div>
        </div>
        <div className="p-2 max-h-[300px] overflow-y-auto">
          {COLUMNS.map((column) => (
            <label
              key={column.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer"
            >
              <Checkbox
                checked={visibleColumns.includes(column.id)}
                onCheckedChange={(checked) =>
                  handleToggle(column.id, checked as boolean)
                }
                className="h-4 w-4"
              />
              <span className="text-sm">{column.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
