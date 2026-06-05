import dayjs from "dayjs";
import { CheckCircle2 } from "lucide-react";
import { VentaV2 } from "@/services/api/ventaV2Types";

export const VentaAplicadaCard = ({ venta }: { venta: VentaV2 }) => {
  if (!venta.microsip_folio) return null;
  return (
    <div className="rounded-lg border border-emerald-600/20 bg-emerald-500/5 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
              Aplicada a Microsip
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta venta ya quedó registrada en el libro mayor de Microsip.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3">
            <Field label="Folio Microsip" value={venta.microsip_folio} highlight />
            {venta.microsip_docto_pv_id != null && (
              <Field label="Docto PV ID" value={String(venta.microsip_docto_pv_id)} />
            )}
            {venta.microsip_aplicada_at && (
              <Field
                label="Aplicada"
                value={dayjs(venta.microsip_aplicada_at).format("DD MMM YYYY HH:mm")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div>
    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
      {label}
    </p>
    <p
      className={
        highlight
          ? "mt-1 font-mono text-base font-semibold tracking-tight text-foreground"
          : "mt-1 font-mono text-sm text-foreground/90"
      }
    >
      {value}
    </p>
  </div>
);

export default VentaAplicadaCard;
