import {
  FilePlus,
  ImagePlus,
  ImageMinus,
  Eye,
  CheckCircle2,
  Building2,
  XCircle,
  Undo2,
  FileEdit,
  UserPen,
  Package,
  Boxes,
  Users,
  Truck,
  Circle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { VentaEvento } from "../../domain/entities/VentaEvento";

export interface EventoMeta {
  label: string;
  Icon: LucideIcon;
  detail: string;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

// traspasoDetail builds the stock-route line for traspaso events. The backend
// injects almacen_origen_nombre / almacen_destino_nombre into the payload; when
// both are present it reads "ORIGEN → DESTINO · N art.". Without names it falls
// back to the MST folio so the row still carries a usable reference.
function traspasoDetail(payload: Record<string, unknown>): string {
  const origen = asString(payload.almacen_origen_nombre);
  const destino = asString(payload.almacen_destino_nombre);
  const folio = asString(payload.folio);
  const count = asNumber(payload.detalles_count);

  const parts: string[] = [];
  if (origen && destino) {
    parts.push(`${origen} → ${destino}`);
  } else if (folio) {
    parts.push(folio);
  }
  if (count !== null) {
    parts.push(`${count} art${count === 1 ? "." : "s."}`);
  }
  return parts.join(" · ");
}

export function eventoMeta(evento: VentaEvento): EventoMeta {
  const { eventType, payload } = evento;

  switch (eventType) {
    case "venta.creada": {
      const tipoVenta = typeof payload.tipo_venta === "string" ? payload.tipo_venta : "";
      return {
        label: "Venta creada",
        Icon: FilePlus,
        detail: tipoVenta,
      };
    }

    case "venta.imagen_adjuntada": {
      const sizeBytes = typeof payload.size_bytes === "number" ? payload.size_bytes : null;
      return {
        label: "Imagen adjuntada",
        Icon: ImagePlus,
        detail: sizeBytes !== null ? formatBytes(sizeBytes) : "",
      };
    }

    case "venta.imagen_eliminada":
      return { label: "Imagen eliminada", Icon: ImageMinus, detail: "" };

    case "venta.enviada_a_revision":
      return { label: "Revisada", Icon: Eye, detail: "" };

    case "venta.aprobada":
      return { label: "Aprobada", Icon: CheckCircle2, detail: "" };

    case "venta.aplicada": {
      const folio = typeof payload.microsip_folio === "string" ? payload.microsip_folio : "";
      return {
        label: "Aplicada en Microsip",
        Icon: Building2,
        detail: folio ? `Folio ${folio}` : "",
      };
    }

    case "venta.cancelada": {
      const reason = typeof payload.reason === "string" ? payload.reason : "";
      return { label: "Cancelada", Icon: XCircle, detail: reason };
    }

    case "venta.regresada_a_borrador":
      return { label: "Regresada a borrador", Icon: Undo2, detail: "" };

    case "venta.header_actualizado":
      return { label: "Datos generales actualizados", Icon: FileEdit, detail: "" };

    case "venta.cliente_actualizado":
      return { label: "Cliente actualizado", Icon: UserPen, detail: "" };

    case "venta.productos_reemplazados": {
      const count = asNumber(payload.productos_count);
      return {
        label: "Productos actualizados",
        Icon: Package,
        detail: count !== null ? pluralize(count, "producto", "productos") : "",
      };
    }

    case "venta.combos_reemplazados": {
      const count = asNumber(payload.combos_count);
      return {
        label: "Combos actualizados",
        Icon: Boxes,
        detail: count !== null ? pluralize(count, "combo", "combos") : "",
      };
    }

    case "venta.vendedores_reemplazados": {
      const count = asNumber(payload.vendedores_count);
      return {
        label: "Vendedores actualizados",
        Icon: Users,
        detail: count !== null ? pluralize(count, "vendedor", "vendedores") : "",
      };
    }

    case "traspaso.creado":
      return {
        label: "Traspaso de inventario creado",
        Icon: Truck,
        detail: traspasoDetail(payload),
      };

    case "traspaso.reversado":
      return {
        label: "Traspaso revertido",
        Icon: Truck,
        detail: traspasoDetail(payload),
      };

    default:
      return { label: eventType, Icon: Circle, detail: "" };
  }
}
