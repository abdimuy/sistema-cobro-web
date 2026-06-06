import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  COLUMNS,
  COLUMN_GROUPS,
  ColumnId,
  DEFAULT_VISIBLE_COLUMNS,
} from "./columns";
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
  const [query, setQuery] = useState("");

  const handleToggle = (columnId: ColumnId, checked: boolean) => {
    if (checked) {
      // Append to end — preserves user's custom order (fixed in commit 2)
      onChange([...visibleColumns, columnId]);
    } else {
      if (visibleColumns.length <= 1) return;
      onChange(visibleColumns.filter((id) => id !== columnId));
    }
  };

  const handleReset = () => {
    onChange([...DEFAULT_VISIBLE_COLUMNS]);
    setQuery("");
  };

  const handleShowAll = () => {
    onChange(COLUMNS.map((c) => c.id));
  };

  const handleHideAll = () => {
    onChange(["cliente"]);
  };

  const allVisible = visibleColumns.length === COLUMNS.length;

  const filteredColumns = query
    ? COLUMNS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : COLUMNS;

  const visibleCount = visibleColumns.length;
  const totalCount = COLUMNS.length;

  return (
    <Popover onOpenChange={(open) => { if (!open) setQuery(""); }}>
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
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
          <span className="text-sm font-medium">Mostrar columnas</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {visibleCount} de {totalCount}
          </span>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border/50">
          <Input
            placeholder="Buscar columna..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-7 text-sm"
          />
        </div>

        {/* Grouped list */}
        <div className="max-h-[420px] overflow-y-auto">
          {filteredColumns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Sin resultados
            </p>
          ) : query ? (
            // Flat list when searching
            <div className="p-2">
              {filteredColumns.map((column) => (
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
          ) : (
            // Grouped list when not searching
            <div className="p-2">
              {COLUMN_GROUPS.map((group) => {
                const groupColumns = COLUMNS.filter((c) => c.group === group);
                if (groupColumns.length === 0) return null;
                return (
                  <div key={group}>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-2 py-1.5 sticky top-0 bg-popover z-10">
                      {group}
                    </div>
                    {groupColumns.map((column) => (
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
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 px-3 py-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleReset}
          >
            Restablecer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={allVisible ? handleHideAll : handleShowAll}
          >
            {allVisible ? "Ocultar todas" : "Mostrar todas"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
