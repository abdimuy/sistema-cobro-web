import { useRef, useCallback, useEffect, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { VentaLocal, VentasParams } from "@/services/api/getVentasLocales";
import { VentasTableRow } from "./VentasTableRow";
import { ColumnId, COLUMNS, ColumnWidths, Density } from "./columns";
import { cn } from "@/lib/utils";

interface VentasTableProps {
  ventas: VentaLocal[];
  visibleColumns: ColumnId[];
  pinnedColumns?: ColumnId[];
  columnWidths: ColumnWidths;
  onColumnResize: (columnId: ColumnId, width: number) => void;
  sortBy: VentasParams["sortBy"];
  sortOrder: VentasParams["sortOrder"];
  onSort: (column: VentasParams["sortBy"]) => void;
  onViewDetails: (ventaId: string) => void;
  getAlmacenName: (id: number) => string;
  density?: Density;
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
        "-ml-3 h-8 min-w-0 max-w-full text-xs font-medium text-muted-foreground hover:text-foreground",
        isActive && "text-foreground",
        align === "right" && "ml-auto -mr-3"
      )}
      onClick={() => onSort(sortKey as VentasParams["sortBy"])}
    >
      <span className="truncate">{label}</span>
      {isActive ? (
        currentOrder === "asc" ? (
          <ArrowUp className="ml-1.5 h-3 w-3 flex-shrink-0" />
        ) : (
          <ArrowDown className="ml-1.5 h-3 w-3 flex-shrink-0" />
        )
      ) : (
        <ArrowUpDown className="ml-1.5 h-3 w-3 flex-shrink-0 opacity-50" />
      )}
    </Button>
  );
}

interface ResizeHandleProps {
  columnId: ColumnId;
  onResize: (columnId: ColumnId, width: number) => void;
}

function ResizeHandle({ columnId, onResize }: ResizeHandleProps) {
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const thRef = useRef<HTMLElement | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const th = (e.target as HTMLElement).closest("th");
      if (!th) return;

      thRef.current = th;
      startXRef.current = e.clientX;
      startWidthRef.current = th.offsetWidth;

      const handleMouseMove = (e: MouseEvent) => {
        const diff = e.clientX - startXRef.current;
        const newWidth = Math.max(60, startWidthRef.current + diff);
        onResize(columnId, newWidth);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [columnId, onResize]
  );

  return (
    <div
      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary"
      onMouseDown={handleMouseDown}
    />
  );
}

interface InfiniteScrollProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export function VentasTable({
  ventas,
  visibleColumns,
  pinnedColumns = [],
  columnWidths,
  onColumnResize,
  sortBy,
  sortOrder,
  onSort,
  onViewDetails,
  getAlmacenName,
  density = "normal",
  infiniteScroll,
}: VentasTableProps & { infiniteScroll?: InfiniteScrollProps }) {
  const scrollContainerRef = useRef<HTMLTableElement>(null);
  const loadMoreRef = useRef<HTMLTableRowElement>(null);

  // Ordered columns: pinned first, then the rest in user order
  const orderedColumns = useMemo(
    () => [
      ...pinnedColumns.filter((id) => visibleColumns.includes(id)),
      ...visibleColumns.filter((id) => !pinnedColumns.includes(id)),
    ],
    [pinnedColumns, visibleColumns]
  );

  // Cumulative left offsets for sticky pinned columns
  const pinnedOffsets = useMemo(() => {
    const offsets: Partial<Record<ColumnId, number>> = {};
    let acc = 0;
    for (const id of pinnedColumns) {
      offsets[id] = acc;
      acc += columnWidths[id] ?? 0;
    }
    return offsets;
  }, [pinnedColumns, columnWidths]);

  // Infinite scroll observer inside the table container
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (
        entries[0].isIntersecting &&
        infiniteScroll?.hasMore &&
        !infiniteScroll?.isLoading
      ) {
        infiniteScroll.onLoadMore();
      }
    },
    [infiniteScroll]
  );

  // Set up intersection observer
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    const scrollContainer = scrollContainerRef.current;

    if (!loadMoreElement || !infiniteScroll) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: scrollContainer,
      threshold: 0.1,
      rootMargin: "100px",
    });

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [handleObserver, infiniteScroll]);

  const renderHeader = (columnId: ColumnId) => {
    const colDef = COLUMNS.find((c) => c.id === columnId);
    if (!colDef) return null;

    const label = colDef.label;
    const width = columnWidths[columnId];
    const isPinned = pinnedColumns.includes(columnId);
    const isLastPinned =
      pinnedColumns.length > 0 &&
      pinnedColumns[pinnedColumns.length - 1] === columnId;

    const stickyStyle: React.CSSProperties = isPinned
      ? {
          width: `${width}px`,
          minWidth: `${width}px`,
          position: "sticky",
          left: pinnedOffsets[columnId] ?? 0,
          zIndex: 11,
          // `var(--card)` a secas no es un color: la variable guarda sólo los
          // canales HSL, así que la declaración se descartaba y el encabezado
          // anclado quedaba transparente.
          background: "hsl(var(--card))",
        }
      : { width: `${width}px`, minWidth: `${width}px` };

    const extraClass = cn(
      "relative",
      colDef.align === "right" && !colDef.sortable && "text-right",
      isPinned && "shadow-[1px_0_0_0_var(--border)]",
      isLastPinned && "shadow-[6px_0_8px_-4px_rgba(0,0,0,0.08)]"
    );

    if (colDef.sortable && colDef.sortKey) {
      return (
        <TableHead
          key={columnId}
          className={extraClass}
          style={stickyStyle}
          title={label}
        >
          <SortableHeader
            label={label}
            sortKey={colDef.sortKey}
            currentSort={sortBy}
            currentOrder={sortOrder}
            onSort={onSort}
            align={colDef.align}
          />
          <ResizeHandle columnId={columnId} onResize={onColumnResize} />
        </TableHead>
      );
    }

    return (
      <TableHead
        key={columnId}
        className={cn(extraClass, colDef.align === "right" && "text-right")}
        style={stickyStyle}
        title={label}
      >
        <span className="block truncate text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <ResizeHandle columnId={columnId} onResize={onColumnResize} />
      </TableHead>
    );
  };

  return (
    <>
      <Table
        ref={scrollContainerRef}
        className="bg-card block overflow-auto h-[calc(100vh-170px)] [&_th]:border-r [&_th]:border-border [&_th:last-child]:border-r-0 [&_th]:py-1.5 [&_td]:border-r [&_td]:border-border [&_td:last-child]:border-r-0 [&_td]:py-0.5"
        style={{ tableLayout: "fixed" }}
      >
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow className="hover:bg-transparent border-b border-border/50">
            {orderedColumns.map(renderHeader)}
            <TableHead
              className="w-[50px] bg-card"
              style={{ width: "50px", minWidth: "50px" }}
            />
          </TableRow>
        </TableHeader>
        <TableBody
          className={cn(
            density === "compact" && "[&_tr]:h-8 [&_td]:py-0",
            density === "normal" && "[&_tr]:h-10 [&_td]:py-1",
            density === "comfortable" && "[&_tr]:h-[52px] [&_td]:py-2"
          )}
        >
          {ventas.map((venta, index) => (
            <VentasTableRow
              key={venta.LOCAL_SALE_ID}
              zebra={index % 2 === 1}
              venta={venta}
              visibleColumns={orderedColumns}
              pinnedColumns={pinnedColumns}
              pinnedOffsets={pinnedOffsets}
              columnWidths={columnWidths}
              onViewDetails={() => onViewDetails(venta.LOCAL_SALE_ID)}
              getAlmacenName={getAlmacenName}
              density={density}
            />
          ))}
          {/* Infinite scroll trigger inside table */}
          {infiniteScroll && (
            <tr ref={loadMoreRef}>
              <td
                colSpan={orderedColumns.length + 1}
                className="h-10 text-center"
              >
                {infiniteScroll.isLoading && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Cargando más...
                  </div>
                )}
              </td>
            </tr>
          )}
        </TableBody>
      </Table>
    </>
  );
}
