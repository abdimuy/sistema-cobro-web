import { useState } from "react";
import { Settings2, GripVertical } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
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
      // Append to end to preserve user order
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const src = result.source.index;
    const dst = result.destination.index;
    if (src === dst) return;

    const next = [...visibleColumns];
    const [moved] = next.splice(src, 1);
    next.splice(dst, 0, moved);
    onChange(next);
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

        {/* Content */}
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
            // No search: show drag-to-reorder section + grouped picker
            <div className="p-2">
              {/* Drag-to-reorder: visible columns */}
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                Orden actual
              </div>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="visible-columns">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="mb-2"
                    >
                      {visibleColumns.map((id, index) => {
                        const col = COLUMNS.find((c) => c.id === id);
                        if (!col) return null;
                        return (
                          <Draggable key={id} draggableId={id} index={index}>
                            {(dragProvided, snapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className={cn(
                                  "flex items-center gap-2 px-2 py-1.5 rounded-md",
                                  snapshot.isDragging
                                    ? "bg-muted shadow-sm"
                                    : "hover:bg-muted/50"
                                )}
                              >
                                <div
                                  {...dragProvided.dragHandleProps}
                                  className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="h-3 w-3 text-muted-foreground/60" />
                                </div>
                                <Checkbox
                                  checked
                                  onCheckedChange={() =>
                                    handleToggle(id, false)
                                  }
                                  className="h-4 w-4"
                                />
                                <span className="text-sm">{col.label}</span>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Grouped picker: all columns */}
              <div className="border-t border-border/40 pt-1 mt-1">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                  Todas las columnas
                </div>
                {COLUMN_GROUPS.map((group) => {
                  const groupColumns = COLUMNS.filter((c) => c.group === group);
                  if (groupColumns.length === 0) return null;
                  return (
                    <div key={group}>
                      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 px-2 py-1 mt-1">
                        {group}
                      </div>
                      {groupColumns.map((column) => {
                        const isVisible = visibleColumns.includes(column.id);
                        if (isVisible) return null; // already shown in order section
                        return (
                          <label
                            key={column.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={false}
                              onCheckedChange={(checked) =>
                                handleToggle(column.id, checked as boolean)
                              }
                              className="h-4 w-4"
                            />
                            <span className="text-sm">{column.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
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
