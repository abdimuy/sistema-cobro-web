import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EstadoTarea, TareaConEstado } from "../../domain/entities";
import { textoEstadoTarea } from "../lib/tarea";
import { useTareas } from "../../presentation/hooks/useTareas";
import { fechaCorta } from "../lib/format";
import { AsignarVisitaDialog } from "./AsignarVisitaDialog";

const TONO: Record<EstadoTarea, string> = {
  pendiente: "text-foreground",
  atendida: "text-dsm-ok",
  no_atendida: "text-dsm-ambar",
  cancelada: "text-muted-foreground line-through",
};

// Visitas asignadas de la zona (visitas P3, spec §6). Solo la pendiente se
// edita (cancelar + asignar otra) o se cancela.
export function ListaTareas({
  zonaId,
  nombreDeCobrador,
  nombreDeVenta,
}: {
  zonaId: number | null;
  nombreDeCobrador?: (cobradorId: number) => string | null;
  nombreDeVenta?: (ventaId: number) => string | null;
}) {
  const { tareas, isLoading, error, cancelar, cancelando, mensajeErrorCancelar } = useTareas(zonaId);
  const [editando, setEditando] = useState<TareaConEstado | null>(null);
  if (zonaId === null) return null;

  return (
    <section aria-label="visitas asignadas" className="rounded-[14px] bg-dsm-tarjeta px-4 py-3 shadow-sm ring-1 ring-border">
      <h3 className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
        visitas asignadas
      </h3>
      {error && !tareas ? (
        <p className="text-[12px] text-muted-foreground">{error.message}</p>
      ) : isLoading && !tareas ? (
        <div className="h-8 animate-pulse rounded bg-muted" />
      ) : tareas && tareas.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">sin visitas asignadas</p>
      ) : tareas ? (
        <ul className="divide-y divide-border">
          {tareas.map((t) => (
            <li key={t.id} data-testid="fila-tarea" className="flex items-center gap-3 py-1.5 text-[13px]">
              <span className="w-28 shrink-0 font-mono text-[12px]">
                {fechaCorta(t.fecha)}
                {t.hora && ` ${t.hora}`}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {nombreDeVenta?.(t.ventaId) ?? `venta ${t.ventaId}`}
                {t.nota && <span className="text-muted-foreground">{` · ${t.nota}`}</span>}
              </span>
              <span className={cn("shrink-0 text-[12px]", TONO[t.estado])}>
                {textoEstadoTarea(t, nombreDeCobrador)}
              </span>
              {t.estado === "pendiente" && (
                <span className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditando(t)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cancelando.has(t.id)}
                    onClick={() => void cancelar(t.id)}
                  >
                    Cancelar
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {mensajeErrorCancelar && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {mensajeErrorCancelar}
        </p>
      )}
      {editando && (
        <AsignarVisitaDialog
          ventaId={editando.ventaId}
          clienteNombre={nombreDeVenta?.(editando.ventaId) ?? `venta ${editando.ventaId}`}
          previa={editando}
          onHecho={() => setEditando(null)}
          onCerrar={() => setEditando(null)}
        />
      )}
    </section>
  );
}
