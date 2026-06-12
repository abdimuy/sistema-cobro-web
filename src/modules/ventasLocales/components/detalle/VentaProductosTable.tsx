import { Layers, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { VentaV2 } from "@/services/api/ventaV2Types";

const fmtMoney = (raw: string): string => {
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

type Tier = "contado" | "corto" | "anual";

interface Row {
  key: string;
  kind: "combo" | "producto" | "combo-item";
  descripcion: string;
  cantidad: string;
  precioContado: string;
  precioCorto: string;
  precioAnual: string;
  subtotal: number;
  refId?: string;
}

// The tier the venta actually charges — drives the subtotal and which price
// column is emphasized. (CONTADO → contado, CREDITO → anual/financiado.)
const activeTier = (venta: VentaV2): Tier =>
  venta.tipo_venta === "CONTADO" ? "contado" : "anual";

const tierValue = (row: Row, tier: Tier): string =>
  tier === "contado"
    ? row.precioContado
    : tier === "corto"
      ? row.precioCorto
      : row.precioAnual;

export const VentaProductosTable = ({ venta }: { venta: VentaV2 }) => {
  const tier = activeTier(venta);
  const rows: Row[] = [];

  venta.combos.forEach((combo) => {
    const row: Row = {
      key: `combo:${combo.id}`,
      kind: "combo",
      descripcion: combo.nombre,
      cantidad: fmtQty(combo.cantidad),
      precioContado: combo.precio_contado,
      precioCorto: combo.precio_corto,
      precioAnual: combo.precio_anual,
      subtotal: 0,
    };
    row.subtotal = Number(tierValue(row, tier)) * Number(combo.cantidad);
    rows.push(row);
    venta.productos
      .filter((p) => p.combo_id === combo.id)
      .forEach((p) => {
        rows.push({
          key: `combo-item:${p.id}`,
          kind: "combo-item",
          descripcion: p.articulo,
          cantidad: fmtQty(p.cantidad),
          precioContado: "",
          precioCorto: "",
          precioAnual: "",
          subtotal: 0,
          refId: String(p.articulo_id),
        });
      });
  });

  venta.productos
    .filter((p) => !p.combo_id)
    .forEach((p) => {
      const row: Row = {
        key: `producto:${p.id}`,
        kind: "producto",
        descripcion: p.articulo,
        cantidad: fmtQty(p.cantidad),
        precioContado: p.precio_contado,
        precioCorto: p.precio_corto,
        precioAnual: p.precio_anual,
        subtotal: 0,
        refId: String(p.articulo_id),
      };
      row.subtotal = Number(tierValue(row, tier)) * Number(p.cantidad);
      rows.push(row);
    });

  const total = rows.reduce((sum, r) => sum + r.subtotal, 0);

  const priceHead = (label: string, t: Tier) => (
    <TableHead
      className={cn(
        "w-28 text-right text-[10px] font-medium uppercase tracking-wider",
        t === tier ? "text-foreground" : "text-muted-foreground"
      )}
    >
      {label}
    </TableHead>
  );

  const priceCell = (row: Row, t: Tier) => {
    const v = tierValue(row, t);
    if (v === "") return <TableCell></TableCell>;
    return (
      <TableCell
        className={cn(
          "tabular text-right font-mono text-sm",
          t === tier ? "font-medium text-foreground" : "text-muted-foreground/80"
        )}
      >
        {fmtMoney(v)}
      </TableCell>
    );
  };

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-serif text-lg font-normal text-foreground">Artículos</h3>
        <p className="font-mono text-[11px] text-muted-foreground">
          {venta.combos.length} combos · {venta.productos.length} productos
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-12"></TableHead>
              <TableHead className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Descripción
              </TableHead>
              <TableHead className="w-16 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Cant.
              </TableHead>
              {priceHead("Contado", "contado")}
              {priceHead("Corto plazo", "corto")}
              {priceHead("Anual", "anual")}
              <TableHead className="w-32 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Subtotal
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              if (row.kind === "combo-item") {
                return (
                  <TableRow key={row.key} className="bg-muted/10 hover:bg-muted/20">
                    <TableCell></TableCell>
                    <TableCell className="pl-10 text-sm text-muted-foreground">
                      <span className="text-foreground/80">{row.descripcion}</span>
                      {row.refId && (
                        <span className="ml-2 font-mono text-[10px] text-muted-foreground/60">
                          #{row.refId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="tabular text-right font-mono text-xs text-muted-foreground">
                      {row.cantidad}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                );
              }
              const isCombo = row.kind === "combo";
              return (
                <TableRow key={row.key}>
                  <TableCell className="text-muted-foreground">
                    {isCombo ? (
                      <Layers className="h-3.5 w-3.5" />
                    ) : (
                      <Package className="h-3.5 w-3.5" />
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="font-medium text-foreground">{row.descripcion}</span>
                    {row.refId && (
                      <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                        #{row.refId}
                      </span>
                    )}
                    {isCombo && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-foreground/5 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                        combo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="tabular text-right font-mono text-xs text-foreground">
                    {row.cantidad}
                  </TableCell>
                  {priceCell(row, "contado")}
                  {priceCell(row, "corto")}
                  {priceCell(row, "anual")}
                  <TableCell className="tabular text-right font-mono text-sm font-medium text-foreground">
                    {fmtMoney(String(row.subtotal))}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="border-t border-border bg-muted/30 hover:bg-muted/30">
              <TableCell></TableCell>
              <TableCell
                colSpan={5}
                className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                Total
              </TableCell>
              <TableCell className="tabular text-right font-mono text-base font-semibold text-foreground">
                {fmtMoney(String(total))}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default VentaProductosTable;
