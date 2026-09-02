import { Fragment } from "react";
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

const TIERS: ReadonlyArray<{ tier: Tier; label: string }> = [
  { tier: "contado", label: "Contado" },
  { tier: "corto", label: "Corto plazo" },
  { tier: "anual", label: "Anual" },
];

interface Row {
  key: string;
  kind: "combo" | "producto" | "combo-item";
  descripcion: string;
  cantidad: string;
  // Precios UNITARIOS. Cadena vacía en las piezas de un combo, que no llevan
  // precio propio: su valor vive en el precio del combo.
  precioContado: string;
  precioCorto: string;
  precioAnual: string;
  // Cantidad por la que se multiplica el unitario para dar el importe. 0 en
  // las piezas de un combo, que no aportan importe.
  multiplicador: number;
  refId?: string;
}

// The tier the venta actually charges — drives which column is emphasized.
// (CONTADO → contado, CREDITO → anual/financiado.) Ya NO decide qué importes
// se muestran: se muestran los tres.
//
// Mostrar sólo el del nivel cobrado fue parte de un defecto caro. Una venta
// de 8 sillas se capturó con el TOTAL ($7,700) en los campos de contado y
// corto plazo y el UNITARIO ($1,400) en el de anual; el servidor multiplica
// los tres por la cantidad y la venta quedó con $61,600 de contado sobre una
// deuda de $11,200, que es lo que se escribió en Microsip. La pantalla no
// calculaba mal: es que el $61,600 no aparecía por ningún lado, así que no
// había forma de ver que un precio iba cinco veces sobre el otro.
const activeTier = (venta: VentaV2): Tier =>
  venta.tipo_venta === "CONTADO" ? "contado" : "anual";

const tierValue = (row: Row, tier: Tier): string =>
  tier === "contado"
    ? row.precioContado
    : tier === "corto"
      ? row.precioCorto
      : row.precioAnual;

// El importe del renglón en un nivel: unitario × cantidad.
const tierImporte = (row: Row, tier: Tier): number | null => {
  const unitario = tierValue(row, tier);
  if (unitario === "") return null;
  return Number(unitario) * row.multiplicador;
};

export const VentaProductosTable = ({ venta }: { venta: VentaV2 }) => {
  const tier = activeTier(venta);
  const rows: Row[] = [];

  venta.combos.forEach((combo) => {
    rows.push({
      key: `combo:${combo.id}`,
      kind: "combo",
      descripcion: combo.nombre,
      cantidad: fmtQty(combo.cantidad),
      precioContado: combo.precio_contado,
      precioCorto: combo.precio_corto,
      precioAnual: combo.precio_anual,
      multiplicador: Number(combo.cantidad),
    });
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
          multiplicador: 0,
          refId: String(p.articulo_id),
        });
      });
  });

  venta.productos
    .filter((p) => !p.combo_id)
    .forEach((p) => {
      rows.push({
        key: `producto:${p.id}`,
        kind: "producto",
        descripcion: p.articulo,
        cantidad: fmtQty(p.cantidad),
        precioContado: p.precio_contado,
        precioCorto: p.precio_corto,
        precioAnual: p.precio_anual,
        multiplicador: Number(p.cantidad),
        refId: String(p.articulo_id),
      });
    });

  const totalDe = (t: Tier): number =>
    rows.reduce((sum, r) => sum + (tierImporte(r, t) ?? 0), 0);

  // Encabezado en dos pisos: el nivel arriba, y debajo qué es cada columna.
  // "Contado" a secas nombraba un unitario aquí y un total en el encabezado
  // de la venta, y nada decía cuál era cuál.
  const tierGroupHead = (label: string, t: Tier) => (
    <TableHead
      key={t}
      colSpan={2}
      className={cn(
        "border-l border-border/40 text-center text-[10px] font-medium uppercase tracking-wider",
        t === tier ? "text-foreground" : "text-muted-foreground"
      )}
    >
      {label}
    </TableHead>
  );

  const subHead = (label: string, primera: boolean) => (
    <TableHead
      className={cn(
        "w-28 text-right text-[10px] font-normal uppercase tracking-wider text-muted-foreground",
        primera && "border-l border-border/40"
      )}
    >
      {label}
    </TableHead>
  );

  const unitarioCell = (row: Row, t: Tier) => {
    const v = tierValue(row, t);
    return (
      <TableCell className="tabular border-l border-border/40 text-right font-mono text-xs text-muted-foreground">
        {v === "" ? "" : fmtMoney(v)}
      </TableCell>
    );
  };

  const importeCell = (row: Row, t: Tier) => {
    const importe = tierImporte(row, t);
    return (
      <TableCell
        className={cn(
          "tabular text-right font-mono text-sm",
          t === tier ? "font-medium text-foreground" : "text-muted-foreground/80"
        )}
      >
        {importe === null ? "" : fmtMoney(String(importe))}
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
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-12" rowSpan={2}></TableHead>
              <TableHead
                rowSpan={2}
                className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                Descripción
              </TableHead>
              <TableHead
                rowSpan={2}
                className="w-16 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                Cant.
              </TableHead>
              {TIERS.map(({ tier: t, label }) => tierGroupHead(label, t))}
            </TableRow>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {TIERS.map(({ tier: t }) => (
                <Fragment key={t}>
                  {subHead("P. unitario", true)}
                  {subHead("Importe", false)}
                </Fragment>
              ))}
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
                    {/* Las piezas de un combo no llevan precio ni importe
                        propios: su valor ya está en el precio del combo. */}
                    <TableCell colSpan={6}></TableCell>
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
                  {TIERS.map(({ tier: t }) => (
                    <Fragment key={t}>
                      {unitarioCell(row, t)}
                      {importeCell(row, t)}
                    </Fragment>
                  ))}
                </TableRow>
              );
            })}
            <TableRow className="border-t border-border bg-muted/30 hover:bg-muted/30">
              <TableCell></TableCell>
              <TableCell
                colSpan={2}
                className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                Total
              </TableCell>
              {TIERS.map(({ tier: t }) => (
                <Fragment key={t}>
                  <TableCell className="border-l border-border/40"></TableCell>
                  <TableCell
                    className={cn(
                      "tabular text-right font-mono text-base",
                      t === tier
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {fmtMoney(String(totalDe(t)))}
                  </TableCell>
                </Fragment>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default VentaProductosTable;
