import { ColumnId, ColumnWidths, Density } from "./columns";

export interface VentaView {
  id: string;
  name: string;
  visibleColumns: ColumnId[];
  pinnedColumns: ColumnId[];
  columnWidths: Partial<ColumnWidths>;
  density: Density;
  isPreset?: boolean;
}

const VIEWS_STORAGE_KEY = "ventas-saved-views-v1";
const ACTIVE_VIEW_STORAGE_KEY = "ventas-active-view";

export const PRESET_VIEWS: VentaView[] = [
  {
    id: "preset-operacion",
    name: "Operación diaria",
    visibleColumns: [
      "cliente",
      "fecha",
      "tipo",
      "total",
      "situacion",
      "sincronizacion",
    ],
    pinnedColumns: ["cliente"],
    columnWidths: {},
    density: "normal",
    isPreset: true,
  },
  {
    id: "preset-auditoria",
    name: "Auditoría",
    visibleColumns: [
      "id",
      "cliente",
      "situacion",
      "sincronizacion",
      "microsipFolio",
      "createdAt",
      "updatedAt",
      "aprobadoAt",
    ],
    pinnedColumns: ["cliente"],
    columnWidths: {},
    density: "compact",
    isPreset: true,
  },
  {
    id: "preset-cobranza",
    name: "Cobranza",
    visibleColumns: [
      "cliente",
      "telefono",
      "ciudad",
      "total",
      "parcialidad",
      "diaCobranza",
      "frecuencia",
    ],
    pinnedColumns: ["cliente"],
    columnWidths: {},
    density: "normal",
    isPreset: true,
  },
  {
    id: "preset-microsip",
    name: "Cross-check Microsip",
    visibleColumns: [
      "id",
      "cliente",
      "microsipFolio",
      "microsipDoctoPvId",
      "microsipAplicadaAt",
      "total",
    ],
    pinnedColumns: ["cliente"],
    columnWidths: {},
    density: "normal",
    isPreset: true,
  },
];

export function loadCustomViews(): VentaView[] {
  try {
    const stored = localStorage.getItem(VIEWS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as VentaView[];
      return parsed.filter((v) => !v.isPreset);
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
