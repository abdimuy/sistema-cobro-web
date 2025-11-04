import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table";
import { ArticuloAlmacen } from "../../../hooks/useGetAlmacenById";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ArrowUpDown, Package } from "lucide-react";

interface ProductosDataTableProps {
  articulos: ArticuloAlmacen[];
  loading: boolean;
  quantities: Record<number, number>;
  onQuantityChange: (articuloId: number, quantity: number) => void;
  onSelectionChange: (selectedArticulos: ArticuloAlmacen[], quantities: Record<number, number>) => void;
}

const ProductosDataTable = ({
  articulos,
  loading,
  quantities,
  onQuantityChange,
  onSelectionChange,
}: ProductosDataTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const getStockBadgeVariant = (stock: number) => {
    if (stock === 0) return "destructive";
    if (stock < 10) return "destructive";
    if (stock < 50) return "secondary";
    return "default";
  };

  const columns: ColumnDef<ArticuloAlmacen>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            // Si se deselecciona todo, limpiar cantidades
            if (!value) {
              table.getRowModel().rows.forEach((row) => {
                onQuantityChange(row.original.ARTICULO_ID, 0);
              });
            } else {
              // Si se selecciona todo, poner cantidad 1 por defecto
              table.getRowModel().rows.forEach((row) => {
                if (row.original.EXISTENCIAS > 0 && !quantities[row.original.ARTICULO_ID]) {
                  onQuantityChange(row.original.ARTICULO_ID, 1);
                }
              });
            }
          }}
          aria-label="Seleccionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value);
            if (!value) {
              onQuantityChange(row.original.ARTICULO_ID, 0);
            } else {
              // Al seleccionar, poner cantidad 1 si no tiene
              if (!quantities[row.original.ARTICULO_ID]) {
                onQuantityChange(row.original.ARTICULO_ID, 1);
              }
            }
          }}
          disabled={row.original.EXISTENCIAS === 0}
          aria-label="Seleccionar fila"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "ARTICULO",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Producto
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <div className="font-medium text-sm">{row.original.ARTICULO}</div>
          <div className="text-xs text-muted-foreground">
            ID: {row.original.ARTICULO_ID}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "EXISTENCIAS",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Stock
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant={getStockBadgeVariant(row.original.EXISTENCIAS)}>
            {row.original.EXISTENCIAS}
          </Badge>
        </div>
      ),
    },
    {
      id: "cantidad",
      header: () => <div className="text-center">Cantidad</div>,
      cell: ({ row }) => {
        const articuloId = row.original.ARTICULO_ID;
        const maxStock = row.original.EXISTENCIAS;
        const currentQuantity = quantities[articuloId] || 0;
        const isSelected = row.getIsSelected();

        return (
          <div className="flex justify-center">
            <Input
              type="number"
              min="1"
              max={maxStock}
              value={isSelected && currentQuantity > 0 ? currentQuantity : ""}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (value > 0 && value <= maxStock) {
                  onQuantityChange(articuloId, value);
                  if (!isSelected) {
                    row.toggleSelected(true);
                  }
                } else if (value === 0) {
                  onQuantityChange(articuloId, 0);
                }
              }}
              onFocus={() => {
                if (!isSelected && maxStock > 0) {
                  row.toggleSelected(true);
                  if (currentQuantity === 0) {
                    onQuantityChange(articuloId, 1);
                  }
                }
              }}
              disabled={maxStock === 0}
              placeholder={isSelected ? "0" : "-"}
              className="w-20 text-center"
            />
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "LINEA_ARTICULO",
      header: "Línea",
      cell: ({ row }) => (
        <Badge variant="outline" className="whitespace-nowrap">
          {row.original.LINEA_ARTICULO}
        </Badge>
      ),
    },
  ];

  const table = useReactTable({
    data: articulos,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
      // Notificar cambios al padre después de actualizar la selección
      setTimeout(() => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const selectedArticulos = selectedRows.map((row) => row.original);
        onSelectionChange(selectedArticulos, quantities);
      }, 0);
    },
    enableRowSelection: (row: Row<ArticuloAlmacen>) => row.original.EXISTENCIAS > 0,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar productos por nombre o ID..."
          value={(table.getColumn("ARTICULO")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("ARTICULO")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Columnas <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value: boolean) => column.toggleVisibility(!!value)}
                  >
                    {column.id === "ARTICULO" ? "Producto" :
                     column.id === "EXISTENCIAS" ? "Stock" :
                     column.id === "LINEA_ARTICULO" ? "Línea" : column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="h-8 w-8" />
                      <p>No se encontraron productos</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} producto(s) seleccionado(s)
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <div className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
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

export default ProductosDataTable;
