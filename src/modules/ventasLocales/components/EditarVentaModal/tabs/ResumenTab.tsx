import { Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  FinancieroFormData,
  ProductoFormData,
  VendedorFormData,
} from "../../../presentation/hooks/useVentaEditState";

const fmtMoney = (n: number): string =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

// Section mapping — same as footer
function fieldToSection(field: string): string {
  if (field.startsWith("cliente.") || field === "cliente" || field === "gps") return "Cliente";
  if (
    field.startsWith("financiero.") ||
    field === "financiero" ||
    /^(monto|plan|dia_cobranza|nota|fecha_venta)/.test(field)
  ) return "Plan";
  if (field.startsWith("productos")) return "Productos";
  if (field.startsWith("combos")) return "Productos";
  if (field.startsWith("vendedores")) return "Vendedores";
  if (field.startsWith("imagen")) return "Imágenes";
  return "Otros";
}

interface SubCardProps {
  title: string;
  children: React.ReactNode;
}

const SubCard = ({ title, children }: SubCardProps) => (
  <div className="rounded-lg border border-border/60 bg-card">
    <div className="border-b border-border/60 px-5 py-3">
      <h3 className="font-serif text-lg font-normal text-foreground">{title}</h3>
    </div>
    <div className="px-5 py-5 space-y-4">{children}</div>
  </div>
);

interface DiffSection {
  label: string;
  differs: boolean;
}

interface Props {
  tipoVenta: "CONTADO" | "CREDITO";
  financiero: FinancieroFormData;
  productos: ProductoFormData[];
  vendedores: VendedorFormData[];
  diffSections: DiffSection[];
  errors: { field: string; message: string }[];
}

export const ResumenTab = ({
  tipoVenta,
  financiero,
  productos,
  vendedores,
  diffSections,
  errors,
}: Props) => {
  const activeProductos = productos.filter((p) => !p.isDeleted);
  const activeVendedores = vendedores.filter((v) => !v.isDeleted);

  const anual = parseFloat(financiero.montoAnual) || 0;
  const enganche = parseFloat(financiero.enganche) || 0;
  const parcialidad = parseFloat(financiero.parcialidad) || 0;
  const diferencia = anual - enganche - parcialidad * financiero.plazoMeses;
  const diffPct = anual > 0 ? Math.abs(diferencia / anual) : 0;

  const changedSections = diffSections.filter((s) => s.differs);
  const errorSections = new Set(errors.map((e) => fieldToSection(e.field)));

  const sameAlmacenWarning = activeProductos.some(
    (p) =>
      p.comboID === null &&
      p.almacenOrigenID !== null &&
      p.almacenDestinoID !== null &&
      p.almacenOrigenID === p.almacenDestinoID,
  );

  return (
    <div className="space-y-6">
      {/* Cuenta del crédito */}
      {tipoVenta === "CREDITO" && (
        <SubCard title="Cuenta del crédito">
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-[11px] text-muted-foreground">Precio anual</dt>
              <dd className="font-mono text-[14px] tabular-nums">{fmtMoney(anual)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[11px] text-muted-foreground">Enganche</dt>
              <dd className="font-mono text-[14px] tabular-nums">{fmtMoney(enganche)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[11px] text-muted-foreground">
                Parcialidad × plazo
              </dt>
              <dd className="font-mono text-[14px] tabular-nums">
                {fmtMoney(parcialidad)} × {financiero.plazoMeses}
              </dd>
            </div>
            <div
              className={cn(
                "flex justify-between border-t border-border/60 pt-2",
                diffPct > 0.05 && "text-chart-4",
              )}
            >
              <dt className="text-[11px] text-muted-foreground">Diferencia</dt>
              <dd className="font-mono text-[14px] tabular-nums">
                {fmtMoney(diferencia)}
                {diffPct > 0.05 && (
                  <span className="ml-2 text-[10px] text-chart-4">
                    ({(diffPct * 100).toFixed(1)}%)
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </SubCard>
      )}

      {/* Cambios pendientes */}
      <SubCard title="Cambios pendientes">
        {changedSections.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">Sin cambios todavía.</p>
        ) : (
          <ul className="space-y-1.5">
            {changedSections.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-[12px]">
                <span
                  className={cn(
                    "inline-block h-1.5 w-1.5 rounded-full",
                    errorSections.has(s.label)
                      ? "bg-destructive"
                      : "bg-chart-4/70",
                  )}
                />
                <span className="text-foreground">{s.label}</span>
                {errorSections.has(s.label) && (
                  <span className="text-[10px] text-destructive">con errores</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </SubCard>

      {/* Advertencias */}
      <SubCard title="Advertencias">
        <ul className="space-y-3">
          {/* Always: tipo de venta */}
          <li className="flex items-start gap-2 text-[12px]">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">
              El tipo de venta no se puede modificar desde el editor.
            </span>
          </li>

          {/* Conditional: almacén mismos */}
          {sameAlmacenWarning && (
            <li className="flex items-start gap-2 text-[12px]">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
              <span className="text-destructive">
                Hay productos con almacén origen igual al destino.
              </span>
            </li>
          )}

          {/* Conditional: sin productos */}
          {activeProductos.length === 0 && (
            <li className="flex items-start gap-2 text-[12px]">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
              <span className="text-destructive">
                La venta requiere al menos un producto.
              </span>
            </li>
          )}

          {/* Conditional: sin vendedores */}
          {activeVendedores.length === 0 && (
            <li className="flex items-start gap-2 text-[12px]">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
              <span className="text-destructive">
                La venta requiere al menos un vendedor.
              </span>
            </li>
          )}
        </ul>
      </SubCard>
    </div>
  );
};
