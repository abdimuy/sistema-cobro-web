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
import { SIN_ASIGNAR_ID, type CatalogoRef } from "../../domain/entities";

const SIN_ASIGNAR_OPTION: CatalogoRef = { id: SIN_ASIGNAR_ID, nombre: "Sin asignar" };

interface Props {
  opciones: ReadonlyArray<CatalogoRef>;
  value: number;
  onSelect: (id: number) => void;
  placeholder?: string;
}

// CatalogoCombobox is a generalized Popover+Command picker over a plain
// CatalogoRef[] catalog (caja/cajero/vendedor/cobrador). It always prepends
// a "Sin asignar" entry mapped to SIN_ASIGNAR_ID (-1) — the sentinel the
// zonas-cajas columns use for an unset slot, since they're NOT NULL.
// Mirrors IdentidadCombobox's Popover/Command wiring (vendedores slice)
// but without the v1/v2/v3 slot-resolution logic that combobox needs.
export function CatalogoCombobox({ opciones, value, onSelect, placeholder }: Props) {
  const [open, setOpen] = useState(false);

  const visibles: ReadonlyArray<CatalogoRef> = [SIN_ASIGNAR_OPTION, ...opciones];
  const selected = visibles.find((o) => o.id === value) ?? null;
  const isSinAsignar = selected === null || selected.id === SIN_ASIGNAR_ID;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-full items-center justify-between rounded-md border border-border/60 bg-card px-2.5 py-1 text-sm transition-colors hover:bg-muted/40 data-[state=open]:bg-muted/40"
          data-state={open ? "open" : "closed"}
        >
          <span className={cn("truncate", isSinAsignar && "text-muted-foreground")}>
            {selected ? selected.nombre : (placeholder ?? "Buscar…")}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder ?? "Buscar…"} />
          <CommandList
            onWheel={(e) => {
              // El scroll-lock del Dialog (react-remove-scroll) bloquea el
              // wheel nativo sobre este Popover portaleado; lo scrolleamos a mano.
              e.currentTarget.scrollTop += e.deltaY;
            }}
          >
            <CommandEmpty>Sin resultados</CommandEmpty>
            {visibles.map((opcion) => (
              <CommandItem
                key={opcion.id}
                value={opcion.nombre}
                onSelect={() => {
                  onSelect(opcion.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-3.5 w-3.5 shrink-0",
                    value === opcion.id ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="truncate">{opcion.nombre}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
