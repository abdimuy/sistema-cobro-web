import { useState } from "react";
import { Bookmark, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VistaGuardada } from "../../presentation/actividadPreferencias";

const PILDORA =
  "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] ring-1 ring-border";

export function VistasActividad({
  predefinidas,
  guardadas,
  activa,
  onAplicar,
  onEliminar,
  onGuardar,
}: {
  predefinidas: ReadonlyArray<{ id: string; nombre: string }>;
  guardadas: readonly VistaGuardada[];
  activa: string | null;
  onAplicar: (id: string) => void;
  onEliminar: (id: string) => void;
  onGuardar: (nombre: string) => void;
}) {
  const [nombrando, setNombrando] = useState(false);
  const [nombre, setNombre] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
        Vistas
      </span>
      {predefinidas.map((v) => (
        <button
          key={v.id}
          type="button"
          aria-pressed={activa === v.id}
          onClick={() => onAplicar(v.id)}
          className={cn(
            PILDORA,
            activa === v.id ? "bg-foreground text-background" : "bg-dsm-tarjeta hover:bg-muted",
          )}
        >
          {v.nombre}
        </button>
      ))}
      {guardadas.map((v) => (
        <span
          key={v.id}
          className={cn(
            PILDORA,
            "pr-1",
            activa === v.id ? "bg-foreground text-background" : "bg-dsm-tarjeta",
          )}
        >
          <button
            type="button"
            aria-pressed={activa === v.id}
            onClick={() => onAplicar(v.id)}
            className="inline-flex items-center gap-1.5"
          >
            <Bookmark aria-hidden className="h-3 w-3" />
            {v.nombre}
          </button>
          <button
            type="button"
            aria-label={`Quitar vista ${v.nombre}`}
            onClick={() => onEliminar(v.id)}
            className="rounded-full p-1 hover:bg-muted"
          >
            <X aria-hidden className="h-3 w-3" />
          </button>
        </span>
      ))}
      {nombrando ? (
        <form
          className="inline-flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            onGuardar(nombre);
            setNombre("");
            setNombrando(false);
          }}
        >
          <input
            aria-label="Nombre de la vista"
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setNombrando(false);
            }}
            placeholder={`Mi vista ${guardadas.length + 1}`}
            className="h-8 w-44 rounded-full bg-dsm-tarjeta px-3 text-[12.5px] outline-none ring-1 ring-border"
          />
          <button type="submit" className={cn(PILDORA, "bg-foreground text-background")}>
            Guardar
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setNombrando(true)}
          className={cn(PILDORA, "border border-dashed border-border bg-transparent ring-0")}
        >
          <Plus aria-hidden className="h-3 w-3" />
          Guardar vista
        </button>
      )}
    </div>
  );
}
