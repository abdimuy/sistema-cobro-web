import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Columns3, GripVertical, Pin, PinOff, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  COLUMNS,
  COLUMN_GROUPS,
  ColumnId,
  DEFAULT_VISIBLE_COLUMNS,
  MAX_PINNED,
  ColumnGroup,
} from "./columns";
import { cn } from "@/lib/utils";

interface Props {
  visibleColumns: ColumnId[];
  onChange: (columns: ColumnId[]) => void;
  pinnedColumns: ColumnId[];
  onTogglePin: (id: ColumnId) => void;
  className?: string;
}

export function ClientesColumnSelector({
  visibleColumns,
  onChange,
  pinnedColumns,
  onTogglePin,
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  // Build ordered list for drag-and-drop: pinned first, then the rest in user order.
  const orderedIds: ColumnId[] = [
    ...pinnedColumns.filter((id) => visibleColumns.includes(id)),
    ...visibleColumns.filter((id) => !pinnedColumns.includes(id)),
  ];

  function handleToggleVisible(id: ColumnId) {
    if (visibleColumns.includes(id)) {
      // Don't allow hiding the last visible column
      if (visibleColumns.length <= 1) return;
      onChange(visibleColumns.filter((c) => c !== id));
    } else {
      // Add at end
      onChange([...visibleColumns, id]);
    }
  }

  function handleHideAll() {
    // Keep the minimum — "cliente" is always the anchor pinned column
    onChange(["cliente"]);
  }

  function handleShowAll() {
    // Show all columns in their default order
    const defaultOrder = COLUMNS.map((c) => c.id);
    onChange(defaultOrder);
  }

  function handleReset() {
    onChange([...DEFAULT_VISIBLE_COLUMNS]);
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const src = result.source.index;
    const dst = result.destination.index;
    if (src === dst) return;

    const newOrder = [...orderedIds];
    const [moved] = newOrder.splice(src, 1);
    newOrder.splice(dst, 0, moved);
    onChange(newOrder);
  }

  const hiddenCount = COLUMNS.length - visibleColumns.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-7 gap-1.5 text-xs border-border/60", className)}
          aria-label="Configurar columnas"
        >
          <Columns3 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Columnas</span>
          {hiddenCount > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              -{hiddenCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium">Columnas visibles</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-muted-foreground"
              onClick={handleShowAll}
            >
              <Eye className="h-3 w-3 mr-1" />
              Todas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-muted-foreground"
              onClick={handleHideAll}
            >
              <EyeOff className="h-3 w-3 mr-1" />
              Ocultar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-muted-foreground"
              onClick={handleReset}
            >
              Restaurar
            </Button>
          </div>
        </div>

        <Separator className="mb-2" />

        {/* Groups */}
        {(COLUMN_GROUPS as ColumnGroup[]).map((group) => {
          const groupCols = COLUMNS.filter((c) => c.group === group);
          if (groupCols.length === 0) return null;
          return (
            <div key={group} className="mb-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                {group}
              </p>
              {groupCols.map((col) => {
                const isVisible = visibleColumns.includes(col.id);
                const isPinned = pinnedColumns.includes(col.id);
                const canPin =
                  isPinned || pinnedColumns.length < MAX_PINNED;

                return (
                  <div
                    key={col.id}
                    className="flex items-center gap-2 py-0.5"
                  >
                    <Checkbox
                      id={`col-${col.id}`}
                      checked={isVisible}
                      onCheckedChange={() => handleToggleVisible(col.id)}
                      className="h-3.5 w-3.5"
                    />
                    <label
                      htmlFor={`col-${col.id}`}
                      className="flex-1 text-xs cursor-pointer select-none"
                    >
                      {col.label}
                    </label>
                    {isVisible && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-5 w-5",
                          isPinned
                            ? "text-primary"
                            : "text-muted-foreground opacity-50 hover:opacity-100",
                          !canPin && !isPinned && "cursor-not-allowed opacity-30"
                        )}
                        onClick={() => canPin && onTogglePin(col.id)}
                        title={
                          isPinned
                            ? "Desanclar columna"
                            : canPin
                            ? "Anclar columna"
                            : `Máximo ${MAX_PINNED} ancladas`
                        }
                        disabled={!canPin && !isPinned}
                      >
                        {isPinned ? (
                          <PinOff className="h-3 w-3" />
                        ) : (
                          <Pin className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        <Separator className="my-2" />

        {/* Drag-to-reorder visible columns */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Orden
          </p>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="clientes-columns">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {orderedIds.map((id, index) => {
                    const colDef = COLUMNS.find((c) => c.id === id);
                    if (!colDef) return null;
                    const isPinned = pinnedColumns.includes(id);
                    return (
                      <Draggable key={id} draggableId={id} index={index}>
                        {(drag, snap) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            className={cn(
                              "flex items-center gap-1.5 py-0.5 px-1 rounded text-xs select-none",
                              snap.isDragging && "bg-muted shadow-sm"
                            )}
                          >
                            <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="flex-1 truncate">{colDef.label}</span>
                            {isPinned && (
                              <Pin className="h-2.5 w-2.5 text-primary flex-shrink-0" />
                            )}
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
