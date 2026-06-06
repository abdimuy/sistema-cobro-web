import React, { useState } from "react";
import dayjs from "dayjs";
import {
  Eye,
  Phone,
  Copy,
  MapPin,
  MoreHorizontal,
  Check,
} from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VentaLocal } from "@/services/api/getVentasLocales";
import { ColumnId, ColumnWidths, COLUMNS } from "./columns";
import { formatCurrency, formatPhone, copyToClipboard } from "./utils";
import { cn } from "@/lib/utils";

const formatDate = (iso: string): string => dayjs(iso).format("DD/MM/YYYY HH:mm");

const SITUACION_STYLES: Record<NonNullable<VentaLocal["SITUACION"]>, string> = {
  borrador: "bg-muted text-muted-foreground border-border",
  revisada: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  aprobada: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  cancelada: "bg-destructive/15 text-destructive border-destructive/30",
};

const SITUACION_LABELS: Record<NonNullable<VentaLocal["SITUACION"]>, string> = {
  borrador: "Borrador",
  revisada: "Revisada",
  aprobada: "Aprobada",
  cancelada: "Cancelada",
};

const SINCRONIZACION_STYLES: Record<NonNullable<VentaLocal["SINCRONIZACION"]>, string> = {
  pendiente: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  aplicada: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
};

interface VentasTableRowProps {
  venta: VentaLocal;
  visibleColumns: ColumnId[];
  pinnedColumns?: ColumnId[];
  pinnedOffsets?: Partial<Record<ColumnId, number>>;
  columnWidths: ColumnWidths;
  onViewDetails: () => void;
  getAlmacenName: (id: number) => string;
}

export function VentasTableRow({
  venta,
  visibleColumns,
  pinnedColumns = [],
  pinnedOffsets = {},
  columnWidths,
  onViewDetails,
  getAlmacenName,
}: VentasTableRowProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const openInMaps = () => {
    if (venta.LATITUD && venta.LONGITUD) {
      window.open(
        `https://www.google.com/maps?q=${venta.LATITUD},${venta.LONGITUD}`,
        "_blank"
      );
    }
  };

  const getColumnDef = (id: ColumnId) => COLUMNS.find((col) => col.id === id);

  const renderCell = (columnId: ColumnId) => {
    const colDef = getColumnDef(columnId);
    const alignClass = colDef?.align === "right" ? "text-right" : "";
    const width = columnWidths[columnId];
    const isPinned = pinnedColumns.includes(columnId);
    const isLastPinned =
      pinnedColumns.length > 0 &&
      pinnedColumns[pinnedColumns.length - 1] === columnId;
    const cellStyle: React.CSSProperties = isPinned
      ? {
          width: `${width}px`,
          minWidth: `${width}px`,
          maxWidth: `${width}px`,
          position: "sticky",
          left: pinnedOffsets[columnId] ?? 0,
          zIndex: 1,
          background: "inherit",
          boxShadow: isLastPinned
            ? "6px 0 8px -4px rgba(0,0,0,0.08)"
            : "1px 0 0 0 var(--border)",
        }
      : { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` };

    switch (columnId) {
      case "id":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-xs text-muted-foreground font-mono">
              #{venta.LOCAL_SALE_ID.slice(0, 8)}
            </span>
          </TableCell>
        );

      case "cliente":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="font-medium text-foreground truncate block">
              {venta.NOMBRE_CLIENTE}
            </span>
          </TableCell>
        );

      case "telefono":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            {venta.TELEFONO ? (
              <div className="flex items-center gap-1">
                <span className="text-sm tabular-nums truncate">
                  {formatPhone(venta.TELEFONO)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(venta.TELEFONO, "phone");
                  }}
                >
                  {copiedField === "phone" ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </TableCell>
        );

      case "direccion":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-sm text-muted-foreground truncate block" title={venta.DIRECCION}>
              {venta.DIRECCION || "—"}
            </span>
          </TableCell>
        );

      case "colonia":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-sm text-muted-foreground truncate block">
              {venta.COLONIA || "—"}
            </span>
          </TableCell>
        );

      case "ciudad":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-sm text-muted-foreground truncate block">
              {venta.CIUDAD || "—"}
            </span>
          </TableCell>
        );

      case "poblacion":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-sm text-muted-foreground truncate block">
              {venta.POBLACION || "—"}
            </span>
          </TableCell>
        );

      case "total":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="font-semibold tabular-nums text-foreground">
              {formatCurrency(venta.PRECIO_TOTAL)}
            </span>
          </TableCell>
        );

      case "montoCorto":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-sm tabular-nums text-muted-foreground">
              {venta.MONTO_A_CORTO_PLAZO ? formatCurrency(venta.MONTO_A_CORTO_PLAZO) : "—"}
            </span>
          </TableCell>
        );

      case "enganche":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-sm tabular-nums text-muted-foreground">
              {venta.ENGANCHE ? formatCurrency(venta.ENGANCHE) : "—"}
            </span>
          </TableCell>
        );

      case "parcialidad":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-sm tabular-nums text-muted-foreground">
              {venta.PARCIALIDAD ? formatCurrency(venta.PARCIALIDAD) : "—"}
            </span>
          </TableCell>
        );

      case "tipo":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            {venta.TIPO_VENTA ? (
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] font-medium px-1.5 py-0",
                  venta.TIPO_VENTA === "CREDITO" &&
                    "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20",
                  venta.TIPO_VENTA === "CONTADO" &&
                    "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
                )}
              >
                {venta.TIPO_VENTA}
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </TableCell>
        );

      case "frecuencia":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            {venta.FREC_PAGO ? (
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] font-medium px-1.5 py-0",
                  venta.FREC_PAGO === "SEMANAL" &&
                    "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20",
                  venta.FREC_PAGO === "QUINCENAL" &&
                    "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/20",
                  venta.FREC_PAGO === "MENSUAL" &&
                    "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/20"
                )}
              >
                {venta.FREC_PAGO.charAt(0) + venta.FREC_PAGO.slice(1).toLowerCase()}
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </TableCell>
        );

      case "zona":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-xs text-muted-foreground font-mono">
              {venta.ZONA_CLIENTE || "—"}
            </span>
          </TableCell>
        );

      case "vendedor":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            {venta.vendedores && venta.vendedores.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                {venta.vendedores.map((v, idx) => (
                  <span key={idx} className="text-xs text-muted-foreground truncate block" title={`${v.NOMBRE_VENDEDOR} (${v.VENDEDOR_EMAIL})`}>
                    {v.NOMBRE_VENDEDOR}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground truncate block" title={venta.USER_EMAIL}>
                {venta.USER_EMAIL?.split("@")[0] || "—"}
              </span>
            )}
          </TableCell>
        );

      case "creador":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-xs text-muted-foreground truncate block" title={venta.USER_EMAIL}>
              {venta.USER_EMAIL?.split("@")[0] || "—"}
            </span>
          </TableCell>
        );

      case "almacen":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-xs text-muted-foreground truncate block" title={getAlmacenName(venta.ALMACEN_ID)}>
              {getAlmacenName(venta.ALMACEN_ID)}
            </span>
          </TableCell>
        );

      case "diaCobranza":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-xs text-muted-foreground">
              {venta.DIA_COBRANZA || "—"}
            </span>
          </TableCell>
        );

      case "fecha":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-xs text-muted-foreground tabular-nums">
              {new Date(venta.FECHA_VENTA).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}{" "}
              {new Date(venta.FECHA_VENTA).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </TableCell>
        );

      case "situacion": {
        const s = venta.SITUACION;
        return (
          <TableCell className={alignClass} style={cellStyle}>
            {s ? (
              <span className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                SITUACION_STYLES[s]
              )}>
                {SITUACION_LABELS[s]}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </TableCell>
        );
      }

      case "sincronizacion": {
        const s = venta.SINCRONIZACION;
        return (
          <TableCell className={alignClass} style={cellStyle}>
            {s ? (
              <span className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                SINCRONIZACION_STYLES[s]
              )}>
                {s === "aplicada" ? "Aplicada" : "Pendiente"}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </TableCell>
        );
      }

      case "estado":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className={cn(
              "text-xs uppercase tracking-wider",
              venta.ESTADO === "deleted" ? "text-destructive" : "text-muted-foreground"
            )}>
              {venta.ESTADO ?? "—"}
            </span>
          </TableCell>
        );

      case "microsipFolio":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            {venta.MICROSIP_FOLIO ? (
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs">{venta.MICROSIP_FOLIO}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleCopy(venta.MICROSIP_FOLIO!, "folio"); }}
                >
                  {copiedField === "folio" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </TableCell>
        );

      case "microsipDoctoPvId":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {venta.MICROSIP_DOCTO_PV_ID ?? "—"}
            </span>
          </TableCell>
        );

      case "microsipAplicadaAt":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-xs text-muted-foreground tabular-nums">
              {venta.MICROSIP_APLICADA_AT ? formatDate(venta.MICROSIP_APLICADA_AT) : "—"}
            </span>
          </TableCell>
        );

      case "montoContado":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-sm tabular-nums text-muted-foreground">
              {venta.MONTO_CONTADO !== undefined ? formatCurrency(venta.MONTO_CONTADO) : "—"}
            </span>
          </TableCell>
        );

      case "plazoMeses":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-sm tabular-nums text-muted-foreground">
              {venta.PLAZO_MESES ? `${venta.PLAZO_MESES} m` : "—"}
            </span>
          </TableCell>
        );

      case "clienteId":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            {venta.CLIENTE_ID ? (
              <span className="font-mono text-xs tabular-nums">{venta.CLIENTE_ID}</span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-chart-4/15 text-chart-4 border border-chart-4/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">Nuevo</span>
            )}
          </TableCell>
        );

      case "aval":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-sm text-muted-foreground truncate block">{venta.AVAL_O_RESPONSABLE || "—"}</span>
          </TableCell>
        );

      case "referencia":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-sm text-muted-foreground truncate block" title={venta.REFERENCIA}>{venta.REFERENCIA || "—"}</span>
          </TableCell>
        );

      case "gps":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            {venta.LATITUD && venta.LONGITUD ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openInMaps(); }}
                className="font-mono text-[11px] tabular-nums text-foreground hover:underline"
              >
                {venta.LATITUD.toFixed(4)}, {venta.LONGITUD.toFixed(4)}
              </button>
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </TableCell>
        );

      case "productosCount":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="font-mono text-xs tabular-nums">{venta.PRODUCTOS_COUNT ?? 0}</span>
          </TableCell>
        );

      case "combosCount":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="font-mono text-xs tabular-nums">{venta.COMBOS_COUNT ?? 0}</span>
          </TableCell>
        );

      case "imagenesCount":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="font-mono text-xs tabular-nums">{venta.IMAGENES_COUNT ?? 0}</span>
          </TableCell>
        );

      case "nota":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-sm text-muted-foreground truncate block" title={venta.NOTA}>{venta.NOTA || "—"}</span>
          </TableCell>
        );

      case "createdAt":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-xs text-muted-foreground tabular-nums">{venta.CREATED_AT ? formatDate(venta.CREATED_AT) : "—"}</span>
          </TableCell>
        );

      case "updatedAt":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-xs text-muted-foreground tabular-nums">{venta.UPDATED_AT ? formatDate(venta.UPDATED_AT) : "—"}</span>
          </TableCell>
        );

      case "updatedBy":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="font-mono text-[10px] text-muted-foreground truncate block" title={venta.UPDATED_BY}>{venta.UPDATED_BY ? venta.UPDATED_BY.slice(0, 8) : "—"}</span>
          </TableCell>
        );

      case "aprobadoAt":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-xs text-muted-foreground tabular-nums">{venta.APROBADO_AT ? formatDate(venta.APROBADO_AT) : "—"}</span>
          </TableCell>
        );

      case "aprobadoBy":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="font-mono text-[10px] text-muted-foreground truncate block" title={venta.APROBADO_BY ?? undefined}>{venta.APROBADO_BY ? venta.APROBADO_BY.slice(0, 8) : "—"}</span>
          </TableCell>
        );

      case "canceladoAt":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-xs text-muted-foreground tabular-nums">{venta.CANCELADO_AT ? formatDate(venta.CANCELADO_AT) : "—"}</span>
          </TableCell>
        );

      case "canceladoBy":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="font-mono text-[10px] text-muted-foreground truncate block" title={venta.CANCELADO_BY ?? undefined}>{venta.CANCELADO_BY ? venta.CANCELADO_BY.slice(0, 8) : "—"}</span>
          </TableCell>
        );

      case "cancelReason":
        return (
          <TableCell className={alignClass} style={cellStyle}>
            <span className="text-sm text-destructive/80 truncate block" title={venta.CANCEL_REASON ?? undefined}>{venta.CANCEL_REASON || "—"}</span>
          </TableCell>
        );

      default:
        return null;
    }
  };

  return (
    <TableRow
      className="group cursor-pointer transition-colors hover:bg-muted/50"
      onClick={onViewDetails}
    >
      {/* Dynamic columns */}
      {visibleColumns.map((columnId) => (
        <React.Fragment key={columnId}>{renderCell(columnId)}</React.Fragment>
      ))}

      {/* Actions */}
      <TableCell className="w-[50px]" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onViewDetails}>
              <Eye className="h-4 w-4 mr-2" />
              Ver detalles
            </DropdownMenuItem>
            {venta.TELEFONO && (
              <DropdownMenuItem
                onClick={() => window.open(`tel:${venta.TELEFONO}`, "_self")}
              >
                <Phone className="h-4 w-4 mr-2" />
                Llamar
              </DropdownMenuItem>
            )}
            {venta.LATITUD && venta.LONGITUD && (
              <DropdownMenuItem onClick={openInMaps}>
                <MapPin className="h-4 w-4 mr-2" />
                Ver en mapa
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleCopy(venta.LOCAL_SALE_ID, "id")}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
