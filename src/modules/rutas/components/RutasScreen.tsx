import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useRutas } from "../presentation/hooks/useRutas";
import { formatMoney } from "./lib/format";

const SKELETON_ROWS = 6;

// RutasScreen renders the read-only zona listing.
// No sorting, no filters, no actions — deliberate scope constraint.
export function RutasScreen() {
  const { rutas, isLoading, error } = useRutas();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-[32px] font-normal leading-[1.1] tracking-tight text-foreground">
          Rutas
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
          Zonas de cobranza
        </p>
      </div>

      {/* Error state */}
      {error && (
        <p className="font-mono text-[12px] text-destructive" role="alert">
          {error.message}
        </p>
      )}

      {/* Panel wrapper */}
      <section className="flex flex-col gap-4 rounded-md border border-border/60 px-5 py-5">
        <div>
          <h4 className="font-serif text-sm font-normal text-foreground">
            Zonas
          </h4>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            Zona · Cobrador · Clientes · Saldo
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="h-9 px-3 bg-muted/30">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Zona
                  </span>
                </TableHead>
                <TableHead className="h-9 px-3 bg-muted/30">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Cobrador
                  </span>
                </TableHead>
                <TableHead className="h-9 px-3 bg-muted/30 text-right">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    # Clientes
                  </span>
                </TableHead>
                <TableHead className="h-9 px-3 bg-muted/30 text-right">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Saldo total
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    {Array.from({ length: 4 }).map((_, ci) => (
                      <TableCell key={ci} className="px-3 py-2">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rutas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sin zonas
                  </TableCell>
                </TableRow>
              ) : (
                rutas.map((ruta) => (
                  <TableRow
                    key={ruta.zonaId}
                    className="border-border/40 hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="px-3 py-2 font-medium text-sm text-foreground">
                      {ruta.zonaNombre}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                      {ruta.cobradorNombre || "Sin asignar"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">
                      {ruta.numClientes}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">
                      {formatMoney(ruta.saldoTotal)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && rutas.length > 0 && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {rutas.length} zona{rutas.length !== 1 ? "s" : ""}
          </span>
        )}
      </section>
    </div>
  );
}
