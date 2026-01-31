import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { VentaLocal, VentasParams } from "@/services/api/getVentasLocales";
import { VentasTableRow } from "./VentasTableRow";
import { ColumnId, COLUMNS } from "./columns";
import { cn } from "@/lib/utils";

interface VentasTableProps {
  ventas: VentaLocal[];
  visibleColumns: ColumnId[];
  sortBy: VentasParams["sortBy"];
  sortOrder: VentasParams["sortOrder"];
  onSort: (column: VentasParams["sortBy"]) => void;
  onViewDetails: (ventaId: string) => void;
  getAlmacenName: (id: number) => string;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: VentasParams["sortBy"];
  currentOrder: VentasParams["sortOrder"];
  onSort: (column: VentasParams["sortBy"]) => void;
  align?: "left" | "right" | "center";
}

function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentOrder,
  onSort,
  align,
}: SortableHeaderProps) {
  const isActive = currentSort === sortKey;

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "-ml-3 h-8 text-xs font-medium text-muted-foreground hover:text-foreground",
        isActive && "text-foreground",
        align === "right" && "ml-auto -mr-3"
      )}
      onClick={() => onSort(sortKey as VentasParams["sortBy"])}
    >
      {label}
      {isActive ? (
        currentOrder === "asc" ? (
          <ArrowUp className="ml-1.5 h-3 w-3" />
        ) : (
          <ArrowDown className="ml-1.5 h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="ml-1.5 h-3 w-3 opacity-50" />
      )}
    </Button>
  );
}

export function VentasTable({
  ventas,
  visibleColumns,
  sortBy,
  sortOrder,
  onSort,
  onViewDetails,
  getAlmacenName,
  selectedIds,
  onSelectionChange,
}: VentasTableProps) {
  const allSelected = ventas.length > 0 && selectedIds.size === ventas.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < ventas.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(ventas.map((v) => v.LOCAL_SALE_ID)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectOne = (ventaId: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(ventaId);
    } else {
      newSet.delete(ventaId);
    }
    onSelectionChange(newSet);
  };

  const renderHeader = (columnId: ColumnId) => {
    const colDef = COLUMNS.find((c) => c.id === columnId);
    if (!colDef) return null;

    const label = colDef.shortLabel || colDef.label;

    if (colDef.sortable && colDef.sortKey) {
      return (
        <TableHead key={columnId} className={colDef.width}>
          <SortableHeader
            label={label}
            sortKey={colDef.sortKey}
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={onSort}
            align={colDef.align}
          />
        </TableHead>
      );
    }

    return (
      <TableHead
        key={columnId}
        className={cn(
          colDef.width,
          colDef.align === "right" && "text-right"
        )}
      >
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </TableHead>
    );
  };

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  className="translate-y-[2px]"
                />
              </TableHead>
              {visibleColumns.map(renderHeader)}
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.map((venta) => (
              <VentasTableRow
                key={venta.LOCAL_SALE_ID}
                venta={venta}
                visibleColumns={visibleColumns}
                isSelected={selectedIds.has(venta.LOCAL_SALE_ID)}
                onSelect={(checked) =>
                  handleSelectOne(venta.LOCAL_SALE_ID, checked)
                }
                onViewDetails={() => onViewDetails(venta.LOCAL_SALE_ID)}
                getAlmacenName={getAlmacenName}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
