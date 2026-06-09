import {
  FilePlus,
  ImagePlus,
  ImageMinus,
  Send,
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
      return { label: "Enviada a revisión", Icon: Send, detail: "" };

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

    case "venta.productos_reemplazados":
      return { label: "Productos actualizados", Icon: Package, detail: "" };

    case "venta.combos_reemplazados":
      return { label: "Combos actualizados", Icon: Boxes, detail: "" };

    case "venta.vendedores_reemplazados":
      return { label: "Vendedores actualizados", Icon: Users, detail: "" };

    case "traspaso.creado":
      return { label: "Traspaso de inventario creado", Icon: Truck, detail: "" };

    case "traspaso.reversado":
      return { label: "Traspaso revertido", Icon: Truck, detail: "" };

    default:
      return { label: eventType, Icon: Circle, detail: "" };
  }
}
