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
  almacenes: ReadonlyArray<{ id: number; nombre: string }>;
  placeholder?: string;
  disabled?: boolean;
}

export const SeleccionarAlmacenCombobox = ({
  value,
  onChange,
  almacenes,
  placeholder,
  disabled,
}: Props) => {
  const [open, setOpen] = useState(false);

  const selected = almacenes.find((a) => a.id === value);
  const isEmpty = almacenes.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled || isEmpty}
          className="inline-flex h-9 w-full items-center justify-between rounded-md border border-border/60 bg-card px-3 py-1 text-sm transition-colors hover:bg-muted/40 data-[state=open]:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
          data-state={open ? "open" : "closed"}
        >
          <span className={cn(!selected && "text-muted-foreground")}>
            {isEmpty
              ? "No hay almacenes"
              : selected
                ? selected.nombre
                : (placeholder ?? "Seleccionar almacén")}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar almacén..." />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            {almacenes.map((almacen) => (
              <CommandItem
                key={almacen.id}
                value={String(almacen.id)}
                onSelect={() => {
                  onChange(almacen.id === value ? null : almacen.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-3.5 w-3.5",
                    value === almacen.id ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="font-mono text-[11px] mr-2 text-muted-foreground">
                  {almacen.id}
                </span>
                {almacen.nombre}
              </CommandItem>
            ))}
            <CommandItem
              value="__sin-almacen__"
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
              Sin almacén
            </CommandItem>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
