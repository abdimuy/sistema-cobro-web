import React, { useState } from "react";
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

interface VentasTableRowProps {
  venta: VentaLocal;
  visibleColumns: ColumnId[];
  columnWidths: ColumnWidths;
  onViewDetails: () => void;
  getAlmacenName: (id: number) => string;
}

export function VentasTableRow({
  venta,
  visibleColumns,
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
    const cellStyle = { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` };

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
