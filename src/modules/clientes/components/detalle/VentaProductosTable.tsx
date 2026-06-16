import { Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductoVenta } from "../../domain/entities";

const fmtMXN = (raw: string): string => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

const fmtQty = (raw: string): string => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return n % 1 === 0 ? String(n) : n.toFixed(2);
};

const fmtPct = (raw: string): string => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return `${(n * 100).toFixed(0)} %`;
};

interface Props {
  productos: ProductoVenta[];
}

export function VentaProductosTable({ productos }: Props) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-serif text-lg font-normal text-foreground">
          Productos
        </h3>
        <p className="font-mono text-[11px] text-muted-foreground">
          {productos.length} artículo{productos.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10 text-[10px] font-medium uppercase tracking-wider text-muted-foreground" />
              <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Artículo
              </TableHead>
              <TableHead className="w-20 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Unidades
              </TableHead>
              <TableHead className="w-28 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                P. unitario
              </TableHead>
              <TableHead className="w-20 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Descuento
              </TableHead>
              <TableHead className="w-32 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Importe
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.map((p) => (
              <TableRow key={p.articuloId}>
                <TableCell className="text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                </TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium text-foreground">
                    {p.nombre}
                  </span>
                  <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                    #{p.articuloId}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums text-right font-mono text-xs text-foreground">
                  {fmtQty(p.unidades)}
                </TableCell>
                <TableCell className="tabular-nums text-right font-mono text-sm text-foreground">
                  {fmtMXN(p.precioUnitario)}
                </TableCell>
                <TableCell className="tabular-nums text-right font-mono text-xs text-muted-foreground">
                  {fmtPct(p.pctjeDscto)}
                </TableCell>
                <TableCell className="tabular-nums text-right font-mono text-sm font-medium text-foreground">
                  {fmtMXN(p.precioTotalNeto)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export default VentaProductosTable;
