import { ColumnId, ColumnWidths, Density } from "./columns";
import type { SituacionVenta } from "@/services/api/ventaV2Types";
import type { VentasParams } from "@/services/api/getVentasLocales";

export interface VentaViewFilters {
  // Server-side (pasan al API como params)
  tipoVenta?: "CONTADO" | "CREDITO";
  incluirCanceladas?: boolean;
  // Client-side (se aplican al array después del fetch)
  situacion?: SituacionVenta[];
  sincronizacion?: ("pendiente" | "aplicada")[];
}

export interface VentaViewSort {
  by: VentasParams["sortBy"];
  order: VentasParams["sortOrder"];
}

export interface VentaView {
  id: string;
  name: string;
  visibleColumns: ColumnId[];
  pinnedColumns: ColumnId[];
  columnWidths: Partial<ColumnWidths>;
  density: Density;
  filters?: VentaViewFilters;
  sort?: VentaViewSort;
  isPreset?: boolean;
}

const VIEWS_STORAGE_KEY = "ventas-saved-views-v1";
const ACTIVE_VIEW_STORAGE_KEY = "ventas-active-view";

export const PRESET_VIEWS: VentaView[] = [
  {
    id: "preset-operacion",
    name: "Operación diaria",
    visibleColumns: ["cliente", "fecha", "vendedor", "ciudad", "tipo", "total", "situacion", "sincronizacion", "microsipFolio", "productosCount"],
    pinnedColumns: ["cliente"],
    columnWidths: {},
    density: "normal",
    sort: { by: "fechaVenta", order: "desc" },
    filters: { incluirCanceladas: false },
    isPreset: true,
  },
  {
    id: "preset-cobranza",
    name: "Cobranza",
    visibleColumns: ["cliente", "telefono", "ciudad", "direccion", "total", "enganche", "parcialidad", "plazoMeses", "frecuencia", "diaCobranza", "aval"],
    pinnedColumns: ["cliente"],
    columnWidths: {},
    density: "normal",
    sort: { by: "nombreCliente", order: "asc" },
    filters: { tipoVenta: "CREDITO", incluirCanceladas: false },
    isPreset: true,
  },
  {
    id: "preset-microsip-pendientes",
    name: "Aplicar en Microsip",
    visibleColumns: ["fecha", "cliente", "clienteId", "ciudad", "tipo", "total", "situacion", "sincronizacion", "microsipFolio", "microsipDoctoPvId", "microsipAplicadaAt"],
    pinnedColumns: ["cliente"],
    columnWidths: {},
    density: "compact",
    sort: { by: "fechaVenta", order: "desc" },
    filters: { incluirCanceladas: false, sincronizacion: ["pendiente"] },
    isPreset: true,
  },
  {
    id: "preset-aprobaciones",
    name: "Cola de aprobaciones",
    visibleColumns: ["fecha", "cliente", "ciudad", "vendedor", "creador", "tipo", "total", "situacion", "imagenesCount", "productosCount", "nota"],
    pinnedColumns: ["cliente"],
    columnWidths: {},
    density: "normal",
    sort: { by: "fechaVenta", order: "asc" },
    filters: { incluirCanceladas: false, situacion: ["revisada"] },
    isPreset: true,
  },
  {
    id: "preset-auditoria",
    name: "Auditoría",
    visibleColumns: ["id", "fecha", "cliente", "vendedor", "creador", "situacion", "sincronizacion", "createdAt", "updatedAt", "updatedBy", "aprobadoAt", "aprobadoBy"],
    pinnedColumns: ["cliente"],
    columnWidths: {},
    density: "compact",
    sort: { by: "fechaVenta", order: "desc" },
    filters: { incluirCanceladas: true },
    isPreset: true,
  },
  {
    id: "preset-canceladas",
    name: "Canceladas",
    visibleColumns: ["fecha", "cliente", "ciudad", "vendedor", "tipo", "total", "canceladoAt", "canceladoBy", "cancelReason", "microsipFolio"],
    pinnedColumns: ["cliente"],
    columnWidths: {},
    density: "normal",
    sort: { by: "fechaVenta", order: "desc" },
    filters: { incluirCanceladas: true, situacion: ["cancelada"] },
    isPreset: true,
  },
];

export function loadCustomViews(): VentaView[] {
  try {
    const stored = localStorage.getItem(VIEWS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as VentaView[];
      return parsed.filter((v) => !v.isPreset).map((v) => ({
        ...v,
        pinnedColumns: v.pinnedColumns ?? [],
        columnWidths: v.columnWidths ?? {},
        density: v.density ?? "normal",
        visibleColumns: v.visibleColumns ?? [],
      }));
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveCustomViews(views: VentaView[]): void {
  try {
    localStorage.setItem(
      VIEWS_STORAGE_KEY,
      JSON.stringify(views.filter((v) => !v.isPreset))
    );
  } catch {
    /* ignore */
  }
}

export function loadActiveViewId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_VIEW_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveViewId(id: string | null): void {
  try {
    if (id === null) localStorage.removeItem(ACTIVE_VIEW_STORAGE_KEY);
    else localStorage.setItem(ACTIVE_VIEW_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getAllViews(): VentaView[] {
  return [...PRESET_VIEWS, ...loadCustomViews()];
}
