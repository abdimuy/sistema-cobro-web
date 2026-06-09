import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { cn } from "@/lib/utils";
import { useVentaEventos } from "../../presentation/hooks/useVentaEventos";
import { eventoMeta } from "./eventoMeta";
import type { VentaEvento } from "../../domain/entities/VentaEvento";

dayjs.extend(relativeTime);
dayjs.locale("es");

interface Props {
  ventaID: string;
}

export function VentaEventosTimeline({ ventaID }: Props) {
  const { eventos, isLoading, error } = useVentaEventos(ventaID);

  if (isLoading) return <TimelineSkeleton />;

  if (error) {
    return (
      <p className="text-[12px] text-muted-foreground/70 py-2">
        No se pudo cargar el historial
      </p>
    );
  }

  if (eventos.length === 0) {
    return (
      <p className="text-[12px] text-muted-foreground/70 py-2">
        Sin eventos registrados
      </p>
    );
  }

  // Oldest first, top to bottom — reads as the venta's story (creada →
  // aprobada → aplicada) and matches the direction of the workflow timeline
  // shown on the same screen.
  return (
    <ol className="space-y-0" aria-label="Historial de eventos">
      {eventos.map((evento, idx) => (
        <EventoRow key={evento.id} evento={evento} isLast={idx === eventos.length - 1} />
      ))}
    </ol>
  );
}

const EventoRow = ({ evento, isLast }: { evento: VentaEvento; isLast: boolean }) => {
  const { label, Icon, detail } = eventoMeta(evento);
  const ts = dayjs(evento.occurredAt);

  return (
    <li className="flex gap-3">
      {/* Rail + icon column */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            "border border-border/60 bg-muted/40 text-muted-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </div>
        {!isLast && (
          <div className="mt-1 flex-1 w-px bg-border/50 min-h-[16px]" aria-hidden />
        )}
      </div>

      {/* Content column */}
      <div className={cn("pb-4 min-w-0", isLast && "pb-0")}>
        <p className="text-sm font-medium text-foreground leading-none">{label}</p>
        {evento.actorNombre && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            por <span className="text-foreground/80">{evento.actorNombre}</span>
          </p>
        )}
        {detail && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
        )}
        <p
          className="mt-1 text-[11px] text-muted-foreground/70 cursor-default"
          title={ts.format("DD MMM YYYY · HH:mm:ss")}
        >
          {ts.fromNow()}
        </p>
      </div>
    </li>
  );
};

const TimelineSkeleton = () => (
  <ol className="space-y-0 animate-pulse" aria-label="Cargando historial">
    {[1, 2, 3].map((n) => (
      <li key={n} className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="h-7 w-7 rounded-full bg-muted" />
          {n < 3 && <div className="mt-1 flex-1 w-px bg-border/40 min-h-[16px]" />}
        </div>
        <div className="pb-4 space-y-1.5 flex-1">
          <div className="h-3.5 w-36 rounded bg-muted" />
          <div className="h-2.5 w-20 rounded bg-muted/60" />
        </div>
      </li>
    ))}
  </ol>
);

export default VentaEventosTimeline;
