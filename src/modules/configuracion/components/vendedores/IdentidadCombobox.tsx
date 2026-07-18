import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { IdentidadMicrosip } from "../../domain/entities";

type Slot = "v1" | "v2" | "v3";

interface Props {
  opciones: ReadonlyArray<IdentidadMicrosip>;
  value: number | null;
  onSelect: (identidad: IdentidadMicrosip) => void;
  // When set, only identities that have that slot filled are selectable —
  // used for the per-slot manual override on an incomplete identity.
  slot?: Slot;
  placeholder?: string;
}

function listaIdFor(identidad: IdentidadMicrosip, slot?: Slot): number | null {
  if (slot === "v1") return identidad.v1ListaId;
  if (slot === "v2") return identidad.v2ListaId;
  if (slot === "v3") return identidad.v3ListaId;
  return identidad.v1ListaId ?? identidad.v2ListaId ?? identidad.v3ListaId;
}

// IdentidadCombobox is a Popover+Command picker over the already-loaded
// `opciones` list (fetched once, small). shouldFilter stays ON — cmdk's
// default — since we're filtering an in-memory list; unlike the debounced
// async client-search combobox used elsewhere, there's no per-keystroke
// network call here.
export function IdentidadCombobox({ opciones, value, onSelect, slot, placeholder }: Props) {
  const [open, setOpen] = useState(false);

  const visibles = slot ? opciones.filter((o) => listaIdFor(o, slot) !== null) : opciones;
  const selected = visibles.find((o) => listaIdFor(o, slot) === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-full items-center justify-between rounded-md border border-border/60 bg-card px-2.5 py-1 text-sm transition-colors hover:bg-muted/40 data-[state=open]:bg-muted/40"
          data-state={open ? "open" : "closed"}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.nombre : (placeholder ?? "Buscar vendedor…")}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar vendedor…" />
          <CommandList
            onWheel={(e) => {
              // El scroll-lock del Dialog (react-remove-scroll) bloquea el
              // wheel nativo sobre este Popover portaleado; lo scrolleamos a mano.
              e.currentTarget.scrollTop += e.deltaY;
            }}
          >
            <CommandEmpty>Sin resultados</CommandEmpty>
            {visibles.map((identidad) => {
              const listaId = listaIdFor(identidad, slot);
              return (
                <CommandItem
                  key={`${identidad.nombre}-${listaId}`}
                  value={identidad.nombre}
                  onSelect={() => {
                    onSelect(identidad);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5 shrink-0",
                      value === listaId ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{identidad.nombre}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {identidad.matchCount}/3 slots
                    </span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
