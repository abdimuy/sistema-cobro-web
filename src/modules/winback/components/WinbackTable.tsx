import React, { useState } from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WinbackItem } from "../domain/entities";
import SegmentoBadge from "./badges/SegmentoBadge";
import EstadoPagoBadge from "./badges/EstadoPagoBadge";
import TierBadge from "./badges/TierBadge";
import { formatMoney, formatRecencia } from "./lib/format";

const PAGE_SIZE = 15;
const SKELETON_ROWS = 8;

const columns: ColumnDef<WinbackItem>[] = [
  {
    accessorKey: "score",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Score
        <ArrowUpDown className="ml-1.5 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="tabular font-mono text-sm font-semibold text-foreground">
        {row.original.score}
      </span>
    ),
  },
  {
    id: "cliente",
    accessorKey: "nombre",
    header: () => (
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Cliente
      </span>
    ),
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-sm text-foreground">{row.original.nombre}</p>
        <p className="text-xs text-muted-foreground">{row.original.zona}</p>
      </div>
    ),
    enableSorting: false,
  },
  {
    id: "segmento",
    accessorKey: "segmento",
    header: () => (
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Segmento
      </span>
    ),
    cell: ({ row }) => <SegmentoBadge value={row.original.segmento.value} />,
    enableSorting: false,
  },
  {
    id: "estado_pago",
    accessorKey: "estadoPago",
    header: () => (
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Estado pago
      </span>
    ),
    cell: ({ row }) => <EstadoPagoBadge value={row.original.estadoPago.value} />,
    enableSorting: false,
  },
  {
    id: "tier",
    accessorKey: "tier",
    header: () => (
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Tier
      </span>
    ),
    cell: ({ row }) => <TierBadge value={row.original.tier.value} />,
    enableSorting: false,
  },
  {
    accessorKey: "monetary",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Valor
        <ArrowUpDown className="ml-1.5 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="tabular font-mono text-sm text-right block">
        {formatMoney(row.original.monetary)}
      </span>
    ),
    sortingFn: (a, b) =>
      Number(a.original.monetary) - Number(b.original.monetary),
  },
  {
    accessorKey: "recenciaDias",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Recencia
        <ArrowUpDown className="ml-1.5 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="tabular font-mono text-sm text-muted-foreground">
        {formatRecencia(row.original.recenciaDias)}
      </span>
    ),
  },
];

interface WinbackTableProps {
  items: ReadonlyArray<WinbackItem>;
  isLoading: boolean;
  onRowClick: (item: WinbackItem) => void;
}

const WinbackTable: React.FC<WinbackTableProps> = ({
  items,
  isLoading,
  onRowClick,
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "score", desc: true },
  ]);

  const table = useReactTable({
    data: items as WinbackItem[],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: PAGE_SIZE },
      sorting: [{ id: "score", desc: true }],
    },
  });

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border/60 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-9 px-3 bg-muted/30"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  {columns.map((_, ci) => (
                    <TableCell key={ci} className="px-3 py-2">
                      <Skeleton
                        className="h-4 w-full"
                        data-testid="winback-skeleton"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  Sin clientes para mostrar
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-border/40 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <span className="font-mono text-[11px] text-muted-foreground">
          {isLoading ? "—" : `${table.getFilteredRowModel().rows.length} clientes`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <span className="font-mono text-[11px] text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {Math.max(table.getPageCount(), 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WinbackTable;
