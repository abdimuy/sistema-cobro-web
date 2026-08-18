import { useMemo, useState } from "react";
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
import { normalizarCiudad } from "../../../domain/values/normalizarCiudad";

export interface CiudadOpcion {
  id: number;
  nombre: string;
  estado: string;
}

interface Props {
  value: string;
  onChange: (next: string) => void;
  ciudades: ReadonlyArray<CiudadOpcion>;
  cargando?: boolean;
}

// SeleccionarCiudadCombobox reemplaza la captura de ciudad como texto libre.
// Gemelo sincrónico de SeleccionarZonaCombobox: la lista llega ya cargada por
// props y el filtrado es en memoria, pero con `shouldFilter={false}` porque el
// filtro por defecto de cmdk no ignora acentos y "TEHUACAN" no encontraría
// "Tehuacán".
//
// Diferencia deliberada con el selector de la app Android: aquí NO hay salida
// a texto libre ("mi ciudad no está"). La venta nunca inserta en CIUDADES —es
// tabla de Microsip compartida con la oficina— así que la única salida es dar
// de alta la ciudad en Microsip.
export const SeleccionarCiudadCombobox = ({
  value,
  onChange,
  ciudades,
  cargando,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const seleccionada = useMemo(() => {
    const objetivo = normalizarCiudad(value);
    if (objetivo === "") return undefined;
    return ciudades.find((c) => normalizarCiudad(c.nombre) === objetivo);
  }, [ciudades, value]);

  // Sólo se marca como no reconocida con el catálogo ya cargado: mientras la
  // lista viene vacía (carga o fallo de red) no se puede afirmar que la ciudad
  // guardada esté mal, y marcarla ahí sería un falso positivo.
  const noReconocida =
    value.trim() !== "" && ciudades.length > 0 && seleccionada === undefined;

  const catalogoVacio = ciudades.length === 0;

  const filtradas = useMemo(() => {
    const q = normalizarCiudad(query);
    if (q === "") return ciudades;
    return ciudades.filter(
      (c) =>
        normalizarCiudad(c.nombre).includes(q) ||
        normalizarCiudad(c.estado).includes(q),
    );
  }, [ciudades, query]);

  const etiquetaTrigger = () => {
    if (seleccionada) return seleccionada.nombre;
    if (value.trim() !== "") return value;
    if (cargando) return "Cargando…";
    if (catalogoVacio) return "Catálogo no disponible";
    return "Seleccionar ciudad";
  };

  return (
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
          disabled={catalogoVacio}
          className={cn(
            "inline-flex h-9 w-full items-center justify-between rounded-md border bg-card px-3 py-1 text-sm transition-colors hover:bg-muted/40 data-[state=open]:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50",
            noReconocida ? "border-destructive/60" : "border-border/60",
          )}
          data-state={open ? "open" : "closed"}
        >
          <span
            className={cn(
              "flex min-w-0 items-baseline gap-1.5",
              !seleccionada && value.trim() === "" && "text-muted-foreground",
            )}
          >
            <span className="truncate">{etiquetaTrigger()}</span>
            {seleccionada && (
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {seleccionada.estado}
              </span>
            )}
            {noReconocida && (
              <span className="shrink-0 text-[11px] text-destructive">
                no reconocida
              </span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar ciudad..."
          />
          <CommandList
            onWheel={(e) => {
              // El scroll-lock del Dialog (react-remove-scroll) bloquea el
              // wheel nativo sobre este Popover portaleado; lo scrolleamos a mano.
              e.currentTarget.scrollTop += e.deltaY;
            }}
          >
            {filtradas.length === 0 ? (
              <CommandEmpty>
                <span className="block">Sin resultados</span>
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  Créala en Microsip
                </span>
              </CommandEmpty>
            ) : (
              filtradas.map((ciudad) => (
                <CommandItem
                  key={ciudad.id}
                  value={String(ciudad.id)}
                  onSelect={() => {
                    onChange(ciudad.nombre);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5 shrink-0",
                      seleccionada?.id === ciudad.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex min-w-0 items-baseline gap-1.5">
                    <span className="truncate">{ciudad.nombre}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {ciudad.estado}
                    </span>
                  </span>
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
