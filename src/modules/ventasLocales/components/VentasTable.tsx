import { useRef, useCallback, useEffect } from "react";
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
import { ColumnId, COLUMNS, ColumnWidths } from "./columns";
import { cn } from "@/lib/utils";

interface VentasTableProps {
  ventas: VentaLocal[];
  visibleColumns: ColumnId[];
  columnWidths: ColumnWidths;
  onColumnResize: (columnId: ColumnId, width: number) => void;
  sortBy: VentasParams["sortBy"];
  sortOrder: VentasParams["sortOrder"];
  onSort: (column: VentasParams["sortBy"]) => void;
  onViewDetails: (ventaId: string) => void;
  getAlmacenName: (id: number) => string;
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
  columnWidths,
  onColumnResize,
  sortBy,
  sortOrder,
  onSort,
  onViewDetails,
  getAlmacenName,
  infiniteScroll,
}: VentasTableProps & { infiniteScroll?: InfiniteScrollProps }) {
  const scrollContainerRef = useRef<HTMLTableElement>(null);
  const loadMoreRef = useRef<HTMLTableRowElement>(null);

  // Infinite scroll observer inside the table container
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && infiniteScroll?.hasMore && !infiniteScroll?.isLoading) {
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

    const label = colDef.shortLabel || colDef.label;
    const width = columnWidths[columnId];

    if (colDef.sortable && colDef.sortKey) {
      return (
        <TableHead
          key={columnId}
          className="relative"
          style={{ width: `${width}px`, minWidth: `${width}px` }}
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
        className={cn("relative", colDef.align === "right" && "text-right")}
        style={{ width: `${width}px`, minWidth: `${width}px` }}
      >
        <span className="text-xs font-medium text-muted-foreground">
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
        className="bg-card block overflow-auto h-[calc(100vh-140px)] [&_th]:border-r [&_th]:border-border [&_th:last-child]:border-r-0 [&_th]:py-1.5 [&_td]:border-r [&_td]:border-border [&_td:last-child]:border-r-0 [&_td]:py-0.5 [&_tbody_tr:nth-child(even)]:bg-muted"
        style={{ tableLayout: "fixed" }}
      >
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow className="hover:bg-transparent border-b border-border/50">
            {visibleColumns.map(renderHeader)}
            <TableHead className="w-[50px] bg-card" style={{ width: "50px", minWidth: "50px" }} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ventas.map((venta) => (
            <VentasTableRow
              key={venta.LOCAL_SALE_ID}
              venta={venta}
              visibleColumns={visibleColumns}
              columnWidths={columnWidths}
              onViewDetails={() => onViewDetails(venta.LOCAL_SALE_ID)}
              getAlmacenName={getAlmacenName}
            />
          ))}
          {/* Infinite scroll trigger inside table */}
          {infiniteScroll && (
            <tr ref={loadMoreRef}>
              <td colSpan={visibleColumns.length + 1} className="h-10 text-center">
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
