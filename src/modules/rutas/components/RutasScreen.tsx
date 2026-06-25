import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useReporteUsuarios } from "../presentation/hooks/useReporteUsuarios";
import { useDesgloseCobranzaPorUsuario } from "../presentation/hooks/useDesgloseCobranzaPorUsuario";
import { formatPct, formatCuotas, formatMoneyShort } from "./lib/format";
import { filterVentas, sortVentas } from "./lib/tableOps";
import type { SortKey, SortDir } from "./lib/tableOps";
import {
  semaphoreConfig,
  aporteFillRatio,
  catchUpMarker,
  pctBarWidth,
  pctOverflowMarker,
  formatVentanaDesde,
  formatVentanaDias,
} from "./lib/desgloseUx";
import type { ReporteUsuario, VentaCobranza } from "../domain/entities";

const SKELETON_ROWS = 6;
const USER_COL_COUNT = 5;

function sortByCobertura(
  usuarios: ReadonlyArray<ReporteUsuario>,
): ReporteUsuario[] {
  return [...usuarios].sort((a, b) => {
    if (a.pctCoberturaSemanal === null && b.pctCoberturaSemanal === null) return 0;
    if (a.pctCoberturaSemanal === null) return 1;
    if (b.pctCoberturaSemanal === null) return -1;
    return Number(b.pctCoberturaSemanal) - Number(a.pctCoberturaSemanal);
  });
}

export function RutasScreen() {
  const { usuarios, isLoading, error } = useReporteUsuarios();
  const [selected, setSelected] = useState<ReporteUsuario | null>(null);

  const sorted = sortByCobertura(usuarios);

  const handleRowClick = (u: ReporteUsuario) => {
    setSelected((prev) => (prev?.uid === u.uid ? null : u));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-[32px] font-normal leading-[1.1] tracking-tight text-foreground">
          Cobranza semanal
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
          Reporte por usuario
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
            Usuarios
          </h4>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
            Usuario · Ruta · % Cuenta · % Cobro · Ventana
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="h-9 px-3 bg-muted/30">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Usuario
                  </span>
                </TableHead>
                <TableHead className="h-9 px-3 bg-muted/30">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Ruta
                  </span>
                </TableHead>
                <TableHead className="h-9 px-3 bg-muted/30 text-right">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    % Cuenta
                  </span>
                </TableHead>
                <TableHead className="h-9 px-3 bg-muted/30 text-right">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    % Cobro
                  </span>
                </TableHead>
                <TableHead className="h-9 px-3 bg-muted/30">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Ventana
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    {Array.from({ length: USER_COL_COUNT }).map((_, ci) => (
                      <TableCell key={ci} className="px-3 py-2">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sorted.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={USER_COL_COUNT}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sin usuarios
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((u) => (
                  <TableRow
                    key={u.uid}
                    className={`border-border/40 hover:bg-muted/50 transition-colors cursor-pointer ${selected?.uid === u.uid ? "bg-muted/30" : ""}`}
                    onClick={() => handleRowClick(u)}
                  >
                    <TableCell className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">
                          {u.nombre || "Sin nombre"}
                        </span>
                        {u.email && (
                          <span className="font-mono text-[11px] text-muted-foreground/70">
                            {u.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                      {u.zonaNombre}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right">
                      <div className="flex flex-col items-end">
                        <span className="tabular-nums font-mono text-sm text-foreground">
                          {formatPct(u.pctCoberturaSemanal)}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground/70 tabular-nums">
                          {u.coberturaNum}/{u.coberturaDen}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right">
                      <div className="flex flex-col items-end">
                        <span className="tabular-nums font-mono text-sm text-foreground">
                          {formatPct(u.pctPonderadoSemanal)}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground/70 tabular-nums">
                          {u.ponderadoDen} aplican
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">
                          {formatVentanaDesde(u.fechaInicioSemana)}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground/70">
                          {formatVentanaDias(u.fechaInicioSemana)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && sorted.length > 0 && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {sorted.length} usuario{sorted.length !== 1 ? "s" : ""}
          </span>
        )}
      </section>

      {/* Drill-down modal */}
      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-5xl w-full overflow-y-auto max-h-[90vh]">
          {selected !== null && <DesglosePanel usuario={selected} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return null;
  return <span className="ml-1 text-[10px]">{dir === "asc" ? "▲" : "▼"}</span>;
}

function ResumenHero({
  usuario,
  pctPonderado,
  numerador,
  denominador,
}: {
  usuario: ReporteUsuario;
  pctPonderado: string | null;
  numerador: string;
  denominador: number;
}) {
  const width = pctBarWidth(pctPonderado);
  const overflow = pctOverflowMarker(pctPonderado);

  return (
    <div className="rounded-lg border border-border/60 bg-card px-5 py-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            % Cobro
          </p>
          <p className="font-serif text-[40px] leading-none tabular-nums text-foreground">
            {formatPct(pctPonderado)}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground tabular-nums mt-1">
            Σ aporte {formatCuotas(numerador)} ÷ {denominador} aplican
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            % Cuenta
          </p>
          <p className="font-serif text-2xl leading-none tabular-nums text-foreground">
            {formatPct(usuario.pctCoberturaSemanal)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex items-center gap-2">
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width]"
            style={{ width: `${width}%` }}
          />
        </div>
        {overflow && (
          <span className="font-mono text-[11px] font-medium text-emerald-500 tabular-nums">
            {overflow}
          </span>
        )}
      </div>
    </div>
  );
}

function FrecuenciaBadge({ frecuencia }: { frecuencia: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
      {frecuencia}
    </span>
  );
}

function AporteBar({ aporte }: { aporte: string }) {
  const ratio = aporteFillRatio(aporte);
  const marker = catchUpMarker(aporte);
  const level =
    ratio >= 1 ? "bg-emerald-500" : ratio > 0 ? "bg-amber-500" : "bg-muted-foreground/30";
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${level}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="font-mono text-[11px] tabular-nums text-foreground">
        {formatCuotas(aporte)}
      </span>
      {marker && (
        <span className="font-mono text-[10px] font-medium text-emerald-500 tabular-nums">
          {marker}
        </span>
      )}
    </div>
  );
}

function AtrasoCell({ cuotas, pesos }: { cuotas: string; pesos: string }) {
  const n = Number(cuotas);
  const tone =
    !Number.isFinite(n) || n <= 0
      ? "text-muted-foreground"
      : n >= 2
        ? "text-red-500"
        : "text-amber-500";
  return (
    <div className="flex flex-col items-end">
      <span className={`tabular-nums ${tone}`}>{formatCuotas(cuotas)}</span>
      <span className="text-[11px] text-muted-foreground">{formatMoneyShort(pesos)}</span>
    </div>
  );
}

function PagoCell({ cuotas, pesos }: { cuotas: string; pesos: string }) {
  const n = Number(cuotas);
  const tone = Number.isFinite(n) && n > 0 ? "text-emerald-500" : "text-muted-foreground";
  return (
    <div className="flex flex-col items-end">
      <span className={`tabular-nums ${tone}`}>{formatCuotas(cuotas)}</span>
      <span className="text-[11px] text-muted-foreground">{formatMoneyShort(pesos)}</span>
    </div>
  );
}

function VentaRow({
  venta,
  onClienteClick,
}: {
  venta: VentaCobranza;
  onClienteClick: (clienteId: number) => void;
}) {
  const sem = semaphoreConfig(venta);
  const muted = sem.level === "neutral";

  return (
    <TableRow
      className={`border-border/40 transition-colors ${muted ? "opacity-60" : ""}`}
    >
      {/* Color rail + cliente (navigates) */}
      <TableCell className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className={`h-7 w-1 rounded-full ${sem.rail}`}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClienteClick(venta.clienteId);
            }}
            className="group flex items-center gap-1 text-left text-sm text-foreground hover:text-primary"
            aria-label={`Ver ficha de ${venta.clienteNombre || venta.clienteId}`}
          >
            <span className="underline-offset-2 group-hover:underline">
              {venta.clienteNombre || String(venta.clienteId)}
            </span>
            <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
              ›
            </span>
          </button>
        </div>
      </TableCell>
      <TableCell className="px-3 py-2 font-mono text-sm text-muted-foreground tabular-nums">
        {venta.folio}
      </TableCell>
      <TableCell className="px-3 py-2">
        <FrecuenciaBadge frecuencia={venta.frecuencia} />
      </TableCell>
      <TableCell className="px-3 py-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${sem.bg} ${sem.text} ${sem.border}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${sem.dot}`} />
          {muted ? "No aplica" : sem.label}
        </span>
      </TableCell>
      <TableCell className="px-3 py-2 text-right font-mono text-sm">
        <AtrasoCell cuotas={venta.atrasoAntesCuotas} pesos={venta.atrasoAntesPesos} />
      </TableCell>
      <TableCell className="px-3 py-2 text-right font-mono text-sm">
        <PagoCell cuotas={venta.pagoCuotas} pesos={venta.abonoSemana} />
      </TableCell>
      <TableCell className="px-3 py-2 text-right font-mono text-sm">
        <div className="flex justify-end">
          <AporteBar aporte={venta.aporte} />
        </div>
      </TableCell>
      <TableCell className="px-3 py-2 text-right font-mono text-sm">
        <AtrasoCell cuotas={venta.atrasoDespuesCuotas} pesos={venta.atrasoDespuesPesos} />
      </TableCell>
    </TableRow>
  );
}

function DesglosePanel({ usuario }: { usuario: ReporteUsuario }) {
  const navigate = useNavigate();
  const { ventas, fechaInicio, resumen, isLoading, error } =
    useDesgloseCobranzaPorUsuario(usuario.uid);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const rows = sortVentas(filterVentas(ventas, query), sortKey, sortDir);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleClienteClick = (clienteId: number) => {
    navigate(`/clientes/${clienteId}`);
  };

  const COL_COUNT = 8;

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="font-serif text-sm font-normal text-foreground">
          {usuario.nombre} · {usuario.zonaNombre}
        </DialogTitle>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
          {fechaInicio ? `Semana ${formatVentanaDesde(fechaInicio)}` : "Semana en curso"}
        </p>
      </DialogHeader>

      <ResumenHero
        usuario={usuario}
        pctPonderado={resumen.pctPonderado}
        numerador={resumen.numerador}
        denominador={resumen.denominador}
      />

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

      <div className="rounded-lg border border-border/60 bg-card max-h-[55vh] overflow-auto">
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
                  Estado
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
              rows.map((venta) => (
                <VentaRow
                  key={venta.ventaId}
                  venta={venta}
                  onClienteClick={handleClienteClick}
                />
              ))
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
