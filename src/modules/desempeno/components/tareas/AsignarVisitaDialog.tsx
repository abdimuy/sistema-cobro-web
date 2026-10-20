import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { LIMITE_NOTA_TAREA, type Tarea } from "../../domain/entities";
import { useAsignarTarea } from "../../presentation/hooks/useAsignarTarea";
import { fechaCorta, hoyDeNegocio } from "../lib/format";

// Día civil "AAAA-MM-DD" ↔ Date del calendario (medianoche local: el
// calendario trabaja con días, nunca con instantes).
function aDate(dia: string): Date {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(a, m - 1, d);
}

function aDia(f: Date): string {
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;
}

// Asignar visita (visitas P3, spec §6.2). El id de la tarea se genera AL
// ABRIR el diálogo (al montar), no al enviar: un doble clic o un reintento
// tras un error mandan el mismo id y el servidor responde la misma tarea.
// `previa` = editar: se asigna otra con id nuevo que reemplaza a la previa
// (el servidor cancela la vieja en la misma transacción).
export function AsignarVisitaDialog({
  ventaId,
  clienteNombre,
  previa = null,
  onHecho,
  onCerrar,
}: {
  ventaId: number;
  clienteNombre: string;
  previa?: Tarea | null;
  onHecho: (t: Tarea) => void;
  onCerrar: () => void;
}) {
  const [id] = useState(() => crypto.randomUUID());
  // El hoy del negocio (America/Mexico_City), no el del navegador.
  const hoy = useMemo(() => hoyDeNegocio(), []);
  const [fecha, setFecha] = useState(() => (previa && previa.fecha > hoy ? previa.fecha : hoy));
  const [hora, setHora] = useState(previa?.hora ?? "");
  const [nota, setNota] = useState(previa?.nota ?? "");
  const [calendario, setCalendario] = useState(false);
  const { estado, mensajeError, asignar } = useAsignarTarea(onHecho);

  const enviar = () => {
    void asignar({
      id,
      ventaId,
      fecha,
      hora: hora === "" ? null : hora,
      nota: nota.trim() === "" ? null : nota.trim(),
      reemplazaA: previa?.id ?? null,
    });
  };

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className="max-w-sm gap-4">
        <div>
          <DialogTitle className="text-base">{previa ? "Editar visita" : "Asignar visita"}</DialogTitle>
          <DialogDescription className="text-[13px]">{clienteNombre}</DialogDescription>
        </div>
        <div className="flex items-center gap-2">
          <Popover open={calendario} onOpenChange={setCalendario}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Fecha">
                <CalendarDays aria-hidden className="h-3.5 w-3.5" />
                {fecha === hoy ? "Hoy" : fechaCorta(fecha)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={aDate(fecha)}
                defaultMonth={aDate(fecha)}
                disabled={{ before: aDate(hoy) }}
                onSelect={(f) => {
                  if (f) setFecha(aDia(f));
                  setCalendario(false);
                }}
              />
            </PopoverContent>
          </Popover>
          <input
            type="time"
            aria-label="Hora"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          />
        </div>
        <textarea
          aria-label="Nota"
          placeholder="Nota"
          maxLength={LIMITE_NOTA_TAREA}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-[13px]"
        />
        {mensajeError && (
          <p role="alert" className="text-xs text-destructive">
            {mensajeError}
          </p>
        )}
        <div className="flex justify-end">
          <Button size="sm" onClick={enviar} disabled={estado === "enviando" || estado === "hecho"}>
            Asignar visita
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
