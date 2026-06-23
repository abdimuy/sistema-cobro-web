import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRutas } from "../presentation/hooks/useRutas";
import { useDesgloseCobranza } from "../presentation/hooks/useDesgloseCobranza";
import { formatMoney, formatPct } from "./lib/format";
import type { Ruta } from "../domain/entities";

const SKELETON_ROWS = 6;

function sortByCobertura(rutas: ReadonlyArray<Ruta>): Ruta[] {
  return [...rutas].sort((a, b) => {
    if (a.pctCoberturaSemanal === null && b.pctCoberturaSemanal === null) return 0;
    if (a.pctCoberturaSemanal === null) return 1;
    if (b.pctCoberturaSemanal === null) return -1;
    return Number(b.pctCoberturaSemanal) - Number(a.pctCoberturaSemanal);
  });
}

export function RutasScreen() {
  const { rutas, isLoading, error } = useRutas();
  const [selectedZonaId, setSelectedZonaId] = useState<number | null>(null);

  const sorted = sortByCobertura(rutas);

  const handleRowClick = (zonaId: number) => {
    setSelectedZonaId((prev) => (prev === zonaId ? null : zonaId));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-[32px] font-normal leading-[1.1] tracking-tight text-foreground">
          Cobranza semanal
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
          Reporte por cobrador
        </p>
      </div>

      {/* Error state */}
      {error && (
        <p className="font-mono text-[12px] text-destructive" role="alert">
          Error al cargar
        </p>
      )}

      {/* Panel wrapper */}
      <section className="flex flex-col gap-4 rounded-md border border-border/60 px-5 py-5">
        <div>
          <h4 className="font-serif text-sm font-normal text-foreground">
            Zonas
          </h4>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            Cobrador · Zona · Clientes · Saldo · Cobertura
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="h-9 px-3 bg-muted/30">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Cobrador
                  </span>
                </TableHead>
                <TableHead className="h-9 px-3 bg-muted/30">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Zona
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
                <TableHead className="h-9 px-3 bg-muted/30 text-right">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    % Cobertura
                  </span>
                </TableHead>
                <TableHead className="h-9 px-3 bg-muted/30 text-right">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    % Ponderado
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    {Array.from({ length: 6 }).map((_, ci) => (
                      <TableCell key={ci} className="px-3 py-2">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sorted.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sin zonas
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((ruta) => (
                  <TableRow
                    key={ruta.zonaId}
                    className={`border-border/40 hover:bg-muted/50 transition-colors cursor-pointer ${selectedZonaId === ruta.zonaId ? "bg-muted/30" : ""}`}
                    onClick={() => handleRowClick(ruta.zonaId)}
                  >
                    <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                      {ruta.cobradorNombre || "Sin asignar"}
                    </TableCell>
                    <TableCell className="px-3 py-2 font-medium text-sm text-foreground">
                      {ruta.zonaNombre}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">
                      {ruta.numClientes}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">
                      {formatMoney(ruta.saldoTotal)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">
                      {formatPct(ruta.pctCoberturaSemanal)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">
                      {formatPct(ruta.pctPonderadoSemanal)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && sorted.length > 0 && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {sorted.length} zona{sorted.length !== 1 ? "s" : ""}
          </span>
        )}
      </section>

      {/* Drill-down modal */}
      <Dialog open={selectedZonaId !== null} onOpenChange={(o) => !o && setSelectedZonaId(null)}>
        <DialogContent className="max-w-5xl w-full overflow-y-auto max-h-[90vh]">
          {selectedZonaId !== null && (
            <DesglosePanel zonaId={selectedZonaId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DesglosePanel({ zonaId }: { zonaId: number }) {
  const { ventas, fechaInicio, resumen, isLoading, error } = useDesgloseCobranza(zonaId);

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="font-serif text-sm font-normal text-foreground">
          Desglose por venta
        </DialogTitle>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          {fechaInicio ? `Semana ${fechaInicio}` : "Semana en curso"}
        </p>
        {!isLoading && (
          <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
            Σ aporte {resumen.numerador} ÷ {resumen.denominador} aplican = {formatPct(resumen.pctPonderado)}
          </p>
        )}
      </DialogHeader>

      {error && (
        <p className="font-mono text-[12px] text-destructive" role="alert">
          Error al cargar
        </p>
      )}

      <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="h-9 px-3 bg-muted/30">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Cliente
                </span>
              </TableHead>
              <TableHead className="h-9 px-3 bg-muted/30">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Folio
                </span>
              </TableHead>
              <TableHead className="h-9 px-3 bg-muted/30">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Frecuencia
                </span>
              </TableHead>
              <TableHead className="h-9 px-3 bg-muted/30">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Aplica
                </span>
              </TableHead>
              <TableHead className="h-9 px-3 bg-muted/30 text-right">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Atraso antes
                </span>
              </TableHead>
              <TableHead className="h-9 px-3 bg-muted/30 text-right">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Pago
                </span>
              </TableHead>
              <TableHead className="h-9 px-3 bg-muted/30 text-right">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Aporte
                </span>
              </TableHead>
              <TableHead className="h-9 px-3 bg-muted/30 text-right">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Atraso después
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  {Array.from({ length: 8 }).map((_, ci) => (
                    <TableCell key={ci} className="px-3 py-2">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : ventas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  Sin ventas
                </TableCell>
              </TableRow>
            ) : (
              ventas.map((venta) => (
                <TableRow
                  key={venta.ventaId}
                  className="border-border/40 hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="px-3 py-2 text-sm text-foreground">
                    {venta.clienteNombre || String(venta.clienteId)}
                  </TableCell>
                  <TableCell className="px-3 py-2 font-mono text-sm text-muted-foreground tabular-nums">
                    {venta.folio}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                    {venta.frecuencia}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm">
                    <span
                      className={
                        venta.aplicaPonderado
                          ? "font-mono text-[11px] text-foreground"
                          : "font-mono text-[11px] text-muted-foreground/60"
                      }
                    >
                      {venta.aplicaPonderado ? "Sí" : "No"}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">
                    {Number(venta.atrasoAntesCuotas).toFixed(2)} · {formatMoney(venta.atrasoAntesPesos)}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">
                    {Number(venta.pagoCuotas).toFixed(2)} · {formatMoney(venta.abonoSemana)}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">
                    {Number(venta.aporte).toFixed(2)}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">
                    {Number(venta.atrasoDespuesCuotas).toFixed(2)} · {formatMoney(venta.atrasoDespuesPesos)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && ventas.length > 0 && (
        <span className="font-mono text-[11px] text-muted-foreground">
          {ventas.length} venta{ventas.length !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
