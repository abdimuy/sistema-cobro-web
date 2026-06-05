import dayjs from "dayjs";
import { XOctagon } from "lucide-react";
import { CancelacionV2 } from "@/services/api/ventaV2Types";

export const VentaCanceladaBanner = ({ cancelacion }: { cancelacion: CancelacionV2 }) => (
  <div className="border-l-2 border-destructive bg-destructive/5 px-6 py-5">
    <div className="flex items-start gap-3">
      <XOctagon className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <div className="flex-1 space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-destructive">
          Venta cancelada
        </p>
        <blockquote className="font-serif text-lg italic leading-snug text-foreground">
          “{cancelacion.reason}”
        </blockquote>
        <p className="font-mono text-[11px] text-muted-foreground">
          {dayjs(cancelacion.at).format("DD MMM YYYY · HH:mm")} · por{" "}
          <span className="text-foreground/70">{cancelacion.by.slice(0, 8)}</span>
        </p>
      </div>
    </div>
  </div>
);

export default VentaCanceladaBanner;
