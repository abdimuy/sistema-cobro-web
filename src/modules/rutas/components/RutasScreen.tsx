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
import { Input } from "@/components/ui/input";
import { useRutas } from "../presentation/hooks/useRutas";
import { useDesgloseCobranza } from "../presentation/hooks/useDesgloseCobranza";
import { formatMoney, formatPct, formatCuotas, formatMoneyShort } from "./lib/format";
import { filterVentas, sortVentas } from "./lib/tableOps";
import type { SortKey, SortDir } from "./lib/tableOps";
import type { ProductoVenta, Ruta } from "../domain/entities";
import { obtenerProductosVenta } from "../application/usecases/obtenerProductosVenta";
import { useRutasPort } from "../presentation/context/RutasContext";

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

type ProductosCache = Record<
  number,
  { loading: boolean; error: boolean; productos: ProductoVenta[] }
>;

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return null;
  return <span className="ml-1 text-[10px]">{dir === "asc" ? "▲" : "▼"}</span>;
}

function DesglosePanel({ zonaId }: { zonaId: number }) {
  const port = useRutasPort();
  const { ventas, fechaInicio, resumen, isLoading, error } = useDesgloseCobranza(zonaId);
  const [expandedVentaId, setExpandedVentaId] = useState<number | null>(null);
  const [productosCache, setProductosCache] = useState<ProductosCache>({});
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const rows = sortVentas(filterVentas(ventas, query), sortKey, sortDir);

  const handleVentaClick = async (ventaId: number, clienteId: number, doctoPvId: number) => {
    if (doctoPvId === 0) return;

    if (expandedVentaId === ventaId) {
      setExpandedVentaId(null);
      return;
    }

    setExpandedVentaId(ventaId);

    if (productosCache[ventaId]) return;

    setProductosCache((prev) => ({
      ...prev,
      [ventaId]: { loading: true, error: false, productos: [] },
    }));

    try {
      const productos = await obtenerProductosVenta(port, clienteId, doctoPvId);
      setProductosCache((prev) => ({
        ...prev,
        [ventaId]: { loading: false, error: false, productos },
      }));
    } catch {
      setProductosCache((prev) => ({
        ...prev,
        [ventaId]: { loading: false, error: true, productos: [] },
      }));
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const COL_COUNT = 8;

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
            Σ aporte {formatCuotas(resumen.numerador)} ÷ {resumen.denominador} aplican = {formatPct(resumen.pctPonderado)}
          </p>
        )}
      </DialogHeader>

      {error && (
        <p className="font-mono text-[12px] text-destructive" role="alert">
          Error al cargar
        </p>
      )}

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar cliente o folio"
        className="h-8 font-mono text-[12px]"
      />

      <div className="rounded-lg border border-border/60 bg-card max-h-[60vh] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent sticky top-0 z-10">
              <TableHead
                className="h-9 px-3 bg-muted/30 cursor-pointer select-none"
                onClick={() => handleSort("clienteNombre")}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Cliente<SortIndicator active={sortKey === "clienteNombre"} dir={sortDir} />
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
              <TableHead
                className="h-9 px-3 bg-muted/30 text-right cursor-pointer select-none"
                onClick={() => handleSort("atrasoAntesCuotas")}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Atraso antes<SortIndicator active={sortKey === "atrasoAntesCuotas"} dir={sortDir} />
                </span>
              </TableHead>
              <TableHead
                className="h-9 px-3 bg-muted/30 text-right cursor-pointer select-none"
                onClick={() => handleSort("pagoCuotas")}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Pago<SortIndicator active={sortKey === "pagoCuotas"} dir={sortDir} />
                </span>
              </TableHead>
              <TableHead
                className="h-9 px-3 bg-muted/30 text-right cursor-pointer select-none"
                onClick={() => handleSort("aporte")}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Aporte<SortIndicator active={sortKey === "aporte"} dir={sortDir} />
                </span>
              </TableHead>
              <TableHead
                className="h-9 px-3 bg-muted/30 text-right cursor-pointer select-none"
                onClick={() => handleSort("atrasoDespuesCuotas")}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Atraso después<SortIndicator active={sortKey === "atrasoDespuesCuotas"} dir={sortDir} />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  {Array.from({ length: COL_COUNT }).map((_, ci) => (
                    <TableCell key={ci} className="px-3 py-2">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COL_COUNT}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  {ventas.length === 0 ? "Sin ventas" : "Sin resultados"}
                </TableCell>
              </TableRow>
            ) : (
              rows.flatMap((venta) => {
                const isExpanded = expandedVentaId === venta.ventaId;
                const cache = productosCache[venta.ventaId];
                const canExpand = venta.doctoPvId > 0;

                const mainRow = (
                  <TableRow
                    key={venta.ventaId}
                    className={`border-border/40 transition-colors ${canExpand ? "hover:bg-muted/50 cursor-pointer" : "cursor-default"} ${isExpanded ? "bg-muted/20" : ""}`}
                    onClick={() => handleVentaClick(venta.ventaId, venta.clienteId, venta.doctoPvId)}
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
                      <div className="flex flex-col items-end">
                        <span className="tabular-nums">{formatCuotas(venta.atrasoAntesCuotas)}</span>
                        <span className="text-[11px] text-muted-foreground">{formatMoneyShort(venta.atrasoAntesPesos)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">
                      <div className="flex flex-col items-end">
                        <span className="tabular-nums">{formatCuotas(venta.pagoCuotas)}</span>
                        <span className="text-[11px] text-muted-foreground">{formatMoneyShort(venta.abonoSemana)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">
                      {formatCuotas(venta.aporte)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right tabular-nums font-mono text-sm text-foreground">
                      <div className="flex flex-col items-end">
                        <span className="tabular-nums">{formatCuotas(venta.atrasoDespuesCuotas)}</span>
                        <span className="text-[11px] text-muted-foreground">{formatMoneyShort(venta.atrasoDespuesPesos)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );

                if (!isExpanded || !cache) return [mainRow];

                const subRow = (
                  <TableRow key={`${venta.ventaId}-productos`} className="border-border/40 bg-muted/10">
                    <TableCell colSpan={COL_COUNT} className="px-4 py-2">
                      {cache.loading ? (
                        <div className="flex flex-col gap-1.5 py-1">
                          <Skeleton className="h-3 w-3/4" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      ) : cache.error ? (
                        <p className="font-mono text-[11px] text-destructive">
                          Error al cargar
                        </p>
                      ) : cache.productos.length === 0 ? (
                        <p className="font-mono text-[11px] text-muted-foreground">
                          Sin artículos
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-0.5">
                          {cache.productos.map((p, idx) => (
                            <li key={idx} className="font-mono text-[11px] text-foreground tabular-nums">
                              {p.nombre}
                              <span className="text-muted-foreground"> · {p.cantidad} · {formatMoney(p.importe)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                  </TableRow>
                );

                return [mainRow, subRow];
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && ventas.length > 0 && (
        <span className="font-mono text-[11px] text-muted-foreground">
          {query || sortKey
            ? `${rows.length} de ${ventas.length} venta${ventas.length !== 1 ? "s" : ""}`
            : `${ventas.length} venta${ventas.length !== 1 ? "s" : ""}`}
        </span>
      )}
    </div>
  );
}
