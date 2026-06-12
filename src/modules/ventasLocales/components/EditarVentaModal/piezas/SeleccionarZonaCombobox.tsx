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

interface Props {
  value: number | null;
  onChange: (next: number | null) => void;
  zonas: ReadonlyArray<{ id: number; nombre: string }>;
  placeholder?: string;
}

export const SeleccionarZonaCombobox = ({
  value,
  onChange,
  zonas,
  placeholder,
}: Props) => {
  const [open, setOpen] = useState(false);

  const selected = zonas.find((z) => z.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 w-full items-center justify-between rounded-md border border-border/60 bg-card px-3 py-1 text-sm transition-colors hover:bg-muted/40 data-[state=open]:bg-muted/40"
          data-state={open ? "open" : "closed"}
        >
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected ? selected.nombre : (placeholder ?? "Seleccionar zona")}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar zona..." />
          <CommandList
            onWheel={(e) => {
              // El scroll-lock del Dialog (react-remove-scroll) bloquea el
              // wheel nativo sobre este Popover portaleado; lo scrolleamos a mano.
              e.currentTarget.scrollTop += e.deltaY;
            }}
          >
            <CommandEmpty>Sin resultados</CommandEmpty>
            {zonas.map((zona) => (
              <CommandItem
                key={zona.id}
                value={String(zona.id)}
                onSelect={() => {
                  onChange(zona.id === value ? null : zona.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-3.5 w-3.5",
                    value === zona.id ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="font-mono text-[11px] mr-2 text-muted-foreground">
                  {zona.id}
                </span>
                {zona.nombre}
              </CommandItem>
            ))}
            <CommandItem
              value="__sin-zona__"
              onSelect={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-3.5 w-3.5",
                  value === null ? "opacity-100" : "opacity-0",
                )}
              />
              Sin zona
            </CommandItem>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
