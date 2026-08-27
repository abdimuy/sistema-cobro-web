import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Cliente } from "@/modules/clientes/domain/entities";
import { useBuscarClientesMicrosip } from "./useBuscarClientesMicrosip";

interface Props {
  value: number | null;
  onChange: (clienteId: number | null, nombre?: string) => void;
  // nombreVinculado es el nombre REAL del cliente en Microsip (llega del API,
  // resuelto para el clienteID vigente). Se usa para el disparador cuando no
  // hay un Cliente cacheado en esta sesión — nunca es texto tecleado por el
  // usuario. Pásalo como undefined si el API no lo resolvió.
  nombreVinculado?: string;
}

const saldoFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function formatSaldo(saldo: string): string | null {
  const n = Number(saldo);
  if (!Number.isFinite(n)) return null;
  return saldoFormatter.format(n);
}

// SeleccionarClienteMicrosipCombobox lets the user link the venta to a
// Microsip client via full-text search (same Meili-backed endpoint as the
// clientes directory). Async twin of SeleccionarZonaCombobox: shouldFilter
// is off on <Command> and the query drives useBuscarClientesMicrosip
// (debounced, stale-request-safe) instead of filtering an in-memory list.
export const SeleccionarClienteMicrosipCombobox = ({ value, onChange, nombreVinculado }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Cache of the last picked Cliente so the trigger can show a name instead
  // of just the id. Lost across remounts/reloads — falls back to "Cliente
  // #<id>" until the user searches it up again, which is fine: the form only
  // persists the id.
  const [selected, setSelected] = useState<Cliente | null>(null);

  const { items, isLoading, error } = useBuscarClientesMicrosip(query);

  const handleSelect = (cliente: Cliente) => {
    onChange(cliente.clienteId, cliente.nombre);
    setSelected(cliente);
    setOpen(false);
  };

  const handleDesvincular = () => {
    onChange(null, undefined);
    setSelected(null);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-9 w-full items-center justify-between rounded-md border border-border/60 bg-card px-3 py-1 text-sm transition-colors hover:bg-muted/40 data-[state=open]:bg-muted/40"
            data-state={open ? "open" : "closed"}
          >
            <span className={cn("truncate", value === null && "text-muted-foreground")}>
              {value === null ? (
                "Vincular cliente Microsip"
              ) : (
                (() => {
                  // NUNCA mostrar el nombre tecleado por el usuario aquí: ese fue
                  // exactamente el defecto — el disparador pintaba el texto libre
                  // del campo Nombre como si fuera el cliente vinculado,
                  // confirmando visualmente una venta apuntando a otra persona.
                  // Solo el nombre ya resuelto (esta sesión o por Microsip); si
                  // no hay ninguno, el id a secas.
                  const nombreResuelto = selected?.nombre ?? nombreVinculado;
                  if (nombreResuelto === undefined) return `Cliente #${value}`;
                  return (
                    <>
                      {nombreResuelto}
                      <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
                        #{value}
                      </span>
                    </>
                  );
                })()
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        {/* El ancho lo dicta el disparador, no un valor fijo: Radix publica
            --radix-popover-trigger-width en el contenido. Con un ancho fijo el
            panel quedaba más angosto que el campo y los nombres largos se
            recortaban justo donde hay que distinguir a dos clientes parecidos. */}
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Buscar por nombre o ID…"
            />
            <CommandList
              onWheel={(e) => {
                // El scroll-lock del Dialog (react-remove-scroll) bloquea el
                // wheel nativo sobre este Popover portaleado; lo scrolleamos a mano.
                e.currentTarget.scrollTop += e.deltaY;
              }}
            >
              {query.trim() === "" ? (
                <CommandEmpty>Escribe para buscar…</CommandEmpty>
              ) : isLoading ? (
                <CommandEmpty>Buscando…</CommandEmpty>
              ) : error ? (
                <CommandEmpty>No se pudo buscar</CommandEmpty>
              ) : items.length === 0 ? (
                <CommandEmpty>Sin resultados</CommandEmpty>
              ) : (
                items.map((cliente) => {
                  const saldo = formatSaldo(cliente.saldo);
                  return (
                    <CommandItem
                      key={cliente.clienteId}
                      value={String(cliente.clienteId)}
                      onSelect={() => handleSelect(cliente)}
                    >
                      <Check
                        className={cn(
                          "mr-2 mt-0.5 h-3.5 w-3.5 shrink-0",
                          value === cliente.clienteId ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="flex items-baseline gap-1.5">
                          <span className="truncate font-medium">{cliente.nombre}</span>
                          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                            #{cliente.clienteId}
                          </span>
                        </span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {cliente.zona || "Sin zona"}
                          {saldo ? ` · ${saldo}` : ""}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value !== null && (
        <button
          type="button"
          onClick={handleDesvincular}
          aria-label="Desvincular cliente"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60 bg-card text-muted-foreground transition-colors hover:bg-muted/40 hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
