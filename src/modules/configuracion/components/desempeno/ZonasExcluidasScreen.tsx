import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ConfirmActionDialog } from "@/modules/ventasLocales";
import { useZonasExcluidasDesempeno } from "../../presentation/hooks/useZonasExcluidasDesempeno";
import { useOpcionesZonasCajas } from "../../presentation/hooks/useOpcionesZonasCajas";
import { usePuedeAdministrarConfig } from "../../presentation/hooks/usePuedeAdministrarConfig";
import type { ZonaExcluidaDesempeno } from "../../domain/entities";

const SKELETON_ROWS = 3;

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

// ZonasExcluidasScreen administra las zonas que no aparecen en Desempeño de
// cobradores (D20). Agregar/quitar sólo se ofrece con config:administrar; el
// servidor lo hace cumplir de todos modos. La lista se refresca únicamente
// tras la respuesta del servidor.
export function ZonasExcluidasScreen() {
  const { zonas, isLoading, error, guardando, errorAccion, excluir, quitar, limpiarErrorAccion } =
    useZonasExcluidasDesempeno();
  const { opciones, refresh: refrescarOpciones } = useOpcionesZonasCajas();
  const puedeAdministrar = usePuedeAdministrarConfig();

  const [agregando, setAgregando] = useState(false);
  const [elegida, setElegida] = useState<number | null>(null);
  const [porQuitar, setPorQuitar] = useState<ZonaExcluidaDesempeno | null>(null);

  const disponibles = useMemo(() => {
    const excluidas = new Set(zonas.map((z) => z.zonaId));
    return opciones.zonas.filter((z) => !excluidas.has(z.id));
  }, [zonas, opciones.zonas]);

  // Si la zona elegida ya no existe, se relee el catálogo para que salga del combobox.
  const codigoErrorAccion = errorAccion?.code;
  useEffect(() => {
    if (codigoErrorAccion === "zona_no_existe") {
      setElegida(null);
      refrescarOpciones();
    }
  }, [codigoErrorAccion, errorAccion, refrescarOpciones]);

  const cerrarAgregar = () => {
    setAgregando(false);
    setElegida(null);
    limpiarErrorAccion();
  };

  const confirmarExcluir = async () => {
    if (elegida === null) return;
    if (await excluir(elegida)) cerrarAgregar();
  };

  const confirmarQuitar = async () => {
    if (!porQuitar) return;
    const zona = porQuitar;
    setPorQuitar(null);
    await quitar(zona.zonaId);
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-normal text-foreground">Zonas fuera de desempeño</h2>
        {puedeAdministrar && (
          <Button type="button" size="sm" onClick={() => setAgregando(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Excluir zona
          </Button>
        )}
      </div>

      {error && (
        <p className="font-mono text-[12px] text-destructive" role="alert">
          Error al cargar
        </p>
      )}
      {!agregando && errorAccion && (
        <p className="font-mono text-[12px] text-destructive" role="alert">
          {errorAccion.message}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="h-9 bg-muted/30 px-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Zona
                </span>
              </TableHead>
              <TableHead className="h-9 w-40 bg-muted/30 px-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Desde
                </span>
              </TableHead>
              {puedeAdministrar && <TableHead className="h-9 w-12 bg-muted/30 px-3" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i} className="h-12 border-border/40">
                  <TableCell colSpan={3} className="px-3 py-3">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : zonas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                  Sin zonas excluidas
                </TableCell>
              </TableRow>
            ) : (
              zonas.map((z) => (
                <TableRow key={z.zonaId} className="h-12 border-border/40">
                  <TableCell className="px-3 py-0 text-sm font-medium text-foreground">{z.zonaNombre}</TableCell>
                  <TableCell className="px-3 py-0 text-sm text-muted-foreground">
                    {fechaCorta(z.createdAt)}
                  </TableCell>
                  {puedeAdministrar && (
                    <TableCell className="px-3 py-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Quitar ${z.zonaNombre}`}
                        disabled={guardando}
                        onClick={() => setPorQuitar(z)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={agregando} onOpenChange={(open) => !open && cerrarAgregar()}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-normal">Excluir zona</DialogTitle>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Buscar zona…" />
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              {disponibles.map((z) => (
                <CommandItem key={z.id} value={z.nombre} onSelect={() => setElegida(z.id)}>
                  <span className={cn("truncate", elegida === z.id && "font-medium")}>{z.nombre}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
          {errorAccion && (
            <p className="font-mono text-[12px] text-destructive" role="alert">
              {errorAccion.message}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={guardando} onClick={cerrarAgregar}>
              Cancelar
            </Button>
            <Button type="button" disabled={guardando || elegida === null} onClick={() => void confirmarExcluir()}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={porQuitar !== null}
        onOpenChange={(open) => {
          if (!open) setPorQuitar(null);
        }}
        title="Quitar zona"
        description={porQuitar ? `${porQuitar.zonaNombre} vuelve a Desempeño.` : ""}
        confirmLabel="Quitar"
        loading={guardando}
        onConfirm={() => void confirmarQuitar()}
      />
    </div>
  );
}
