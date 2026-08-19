import { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { rowBackground } from "@/lib/rowBackground";
import { Cliente } from "../domain/entities";
import { ColumnId, ColumnWidths } from "./columns";
import ScoreBadge from "./badges/ScoreBadge";
import SegmentoBadge from "./badges/SegmentoBadge";
import EstadoPagoBadge from "./badges/EstadoPagoBadge";
import RecenciaBadge from "./badges/RecenciaBadge";
import TierRiesgoBadge from "./badges/TierRiesgoBadge";
import BandaCreditoBadge from "./badges/BandaCreditoBadge";
import BandaRecompraBadge from "./badges/BandaRecompraBadge";
import BandaClvBadge from "./badges/BandaClvBadge";
import { formatMoney } from "../../winback/components/lib/format";

interface ClientesTableRowProps {
  cliente: Cliente;
  visibleColumns: ColumnId[];
  pinnedColumns?: ColumnId[];
  pinnedOffsets?: Partial<Record<ColumnId, number>>;
  columnWidths: ColumnWidths;
  onRowClick: () => void;
  /** Fila par de la tabla (cebra). Lo decide la tabla, no el CSS. */
  zebra?: boolean;
}

function renderCell(cliente: Cliente, columnId: ColumnId): React.ReactNode {
  const c = cliente;
  switch (columnId) {
    case "score":
      return <ScoreBadge score={c.score} tienePulso={c.tienePulso} />;

    case "cliente":
      return (
        <>
          <span className="font-medium text-foreground truncate block">
            {c.nombre}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            #{c.clienteId}
          </span>
        </>
      );

    case "zona":
      return (
        <span className="text-xs text-muted-foreground">
          {c.zona || "—"}
        </span>
      );

    case "telefono":
      return (
        <span className="font-mono text-xs">{c.telefono || "—"}</span>
      );

    case "estadoPago":
      return c.estadoPago !== null ? (
        <EstadoPagoBadge value={c.estadoPago} />
      ) : (
        "—"
      );

    case "segmento":
      return c.segmento !== null ? (
        <SegmentoBadge value={c.segmento} />
      ) : (
        "—"
      );

    case "tierRiesgo":
      return c.tierRiesgo != null ? (
        <TierRiesgoBadge value={c.tierRiesgo} />
      ) : (
        "—"
      );

    case "bandaCredito":
      return c.bandaCredito ? (
        <BandaCreditoBadge value={c.bandaCredito} />
      ) : (
        "—"
      );

    case "bandaRecompra":
      return c.bandaRecompra ? (
        <BandaRecompraBadge value={c.bandaRecompra} />
      ) : (
        "—"
      );

    case "bandaClv":
      return c.bandaClv ? (
        <BandaClvBadge banda={c.bandaClv} clv={c.clv} />
      ) : (
        "—"
      );

    case "saldo":
      return (
        <span className="font-mono text-xs tabular-nums">
          {formatMoney(c.saldo)}
        </span>
      );

    case "recencia":
      return (
        <RecenciaBadge dias={c.recenciaDias} tienePulso={c.tienePulso} />
      );

    case "direccion":
      return (
        <span className="text-xs text-muted-foreground truncate block">
          {c.direccionCorta || "—"}
        </span>
      );

    case "frecuencia":
      return "—";

    case "clienteId":
      return (
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          #{c.clienteId}
        </span>
      );
  }
}

export function ClientesTableRow({
  cliente,
  visibleColumns,
  pinnedColumns = [],
  pinnedOffsets = {},
  columnWidths,
  onRowClick,
  zebra = false,
}: ClientesTableRowProps) {
  const [hovered, setHovered] = useState(false);

  // Un solo color para el <tr> y para las celdas ancladas: así coinciden en los
  // tres estados (normal, cebra, hover) y la columna fija no se queda apagada.
  const background = rowBackground(zebra, hovered);

  return (
    <TableRow
      className="group cursor-pointer transition-colors"
      style={{ background }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onRowClick}
    >
      {visibleColumns.map((columnId) => {
        const isPinned = pinnedColumns.includes(columnId);
        const isLastPinned =
          pinnedColumns.length > 0 &&
          pinnedColumns[pinnedColumns.length - 1] === columnId;
        const width = columnWidths[columnId];

        const stickyStyle: React.CSSProperties = isPinned
          ? {
              width: `${width}px`,
              minWidth: `${width}px`,
              position: "sticky",
              left: pinnedOffsets[columnId] ?? 0,
              zIndex: 1,
              background,
            }
          : { width: `${width}px`, minWidth: `${width}px` };

        return (
          <TableCell
            key={columnId}
            className={cn(
              "overflow-hidden",
              isPinned && "shadow-[1px_0_0_0_var(--border)]",
              isLastPinned && "shadow-[6px_0_8px_-4px_rgba(0,0,0,0.08)]"
            )}
            style={stickyStyle}
          >
            {renderCell(cliente, columnId)}
          </TableCell>
        );
      })}
    </TableRow>
  );
}
