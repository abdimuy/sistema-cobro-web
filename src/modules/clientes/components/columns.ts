export type ColumnGroup =
  | "Pulso"
  | "Cliente"
  | "Ubicación"
  | "Montos"
  | "Identificación";

export const COLUMN_GROUPS: ColumnGroup[] = [
  "Pulso",
  "Cliente",
  "Ubicación",
  "Montos",
  "Identificación",
];

export type ColumnId =
  | "score"
  | "cliente"
  | "zona"
  | "telefono"
  | "estadoPago"
  | "segmento"
  | "tierRiesgo"
  | "bandaCredito"
  | "bandaRecompra"
  | "bandaClv"
  | "saldo"
  | "recencia"
  | "direccion"
  | "frecuencia"
  | "clienteId";

export interface ColumnDef {
  id: ColumnId;
  label: string;
  defaultVisible: boolean;
  sortable?: boolean;
  sortKey?: string;
  align?: "left" | "right" | "center";
  width?: string;
  group?: ColumnGroup;
}

export const COLUMNS: ColumnDef[] = [
  {
    id: "score",
    label: "Reactivación",
    defaultVisible: true,
    sortable: true,
    sortKey: "score",
    align: "center",
    width: "w-[80px]",
    group: "Pulso",
  },
  {
    id: "cliente",
    label: "Cliente",
    defaultVisible: true,
    sortable: true,
    sortKey: "nombre",
    align: "left",
    width: "min-w-[200px]",
    group: "Cliente",
  },
  {
    id: "zona",
    label: "Zona",
    defaultVisible: true,
    sortable: true,
    sortKey: "zona",
    align: "left",
    width: "w-[90px]",
    group: "Ubicación",
  },
  {
    id: "telefono",
    label: "Teléfono",
    defaultVisible: true,
    align: "left",
    width: "w-[120px]",
    group: "Cliente",
  },
  {
    id: "estadoPago",
    label: "Estado pago",
    defaultVisible: true,
    sortable: true,
    sortKey: "estado_pago",
    align: "left",
    width: "w-[140px]",
    group: "Pulso",
  },
  {
    id: "segmento",
    label: "Segmento",
    defaultVisible: true,
    sortable: true,
    sortKey: "segmento",
    align: "left",
    width: "w-[170px]",
    group: "Pulso",
  },
  {
    id: "tierRiesgo",
    label: "Riesgo",
    defaultVisible: false,
    sortable: false,
    align: "left",
    width: "w-[130px]",
    group: "Pulso",
  },
  {
    id: "bandaCredito",
    label: "Riesgo crédito",
    defaultVisible: false,
    sortable: true,
    sortKey: "score_credito",
    align: "left",
    width: "w-[160px]",
    group: "Pulso",
  },
  {
    id: "bandaRecompra",
    label: "Recompra",
    defaultVisible: false,
    sortable: true,
    sortKey: "score_recompra",
    align: "left",
    width: "w-[160px]",
    group: "Pulso",
  },
  {
    id: "bandaClv",
    label: "CLV",
    defaultVisible: false,
    sortable: true,
    sortKey: "clv",
    align: "left",
    width: "w-[170px]",
    group: "Pulso",
  },
  {
    id: "saldo",
    label: "Saldo",
    defaultVisible: true,
    sortable: true,
    sortKey: "saldo",
    align: "right",
    width: "w-[110px]",
    group: "Montos",
  },
  {
    id: "recencia",
    label: "Recencia",
    defaultVisible: true,
    sortable: true,
    sortKey: "recencia",
    align: "right",
    width: "w-[100px]",
    group: "Pulso",
  },
  {
    id: "direccion",
    label: "Dirección",
    defaultVisible: false,
    align: "left",
    width: "min-w-[200px]",
    group: "Ubicación",
  },
  {
    id: "frecuencia",
    label: "Frecuencia",
    defaultVisible: false,
    align: "right",
    width: "w-[100px]",
    group: "Pulso",
  },
  {
    id: "clienteId",
    label: "Cliente ID",
    defaultVisible: false,
    align: "right",
    width: "w-[100px]",
    group: "Identificación",
  },
];

export const DEFAULT_VISIBLE_COLUMNS: ColumnId[] = COLUMNS
  .filter((col) => col.defaultVisible)
  .map((col) => col.id);

const STORAGE_KEY = "clientes-visible-columns-v1";
const WIDTHS_STORAGE_KEY = "clientes-column-widths";

export function loadVisibleColumns(): ColumnId[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ColumnId[];
      // Preserve user's custom order — only drop unknown ids
      const filtered = parsed.filter((id) =>
        COLUMNS.some((col) => col.id === id)
      );
      if (filtered.length > 0) {
        return filtered;
      }
    }
  } catch {
    // Ignore errors
  }
  return [...DEFAULT_VISIBLE_COLUMNS];
}

export function saveVisibleColumns(columns: ColumnId[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  } catch {
    // Ignore errors
  }
}

// Default widths in pixels
export const DEFAULT_COLUMN_WIDTHS: Record<ColumnId, number> = {
  score: 80,
  cliente: 200,
  zona: 90,
  telefono: 120,
  estadoPago: 140,
  segmento: 170,
  tierRiesgo: 130,
  bandaCredito: 160,
  bandaRecompra: 160,
  bandaClv: 170,
  saldo: 110,
  recencia: 100,
  direccion: 200,
  frecuencia: 100,
  clienteId: 100,
};

export type ColumnWidths = Record<ColumnId, number>;

export function loadColumnWidths(): ColumnWidths {
  try {
    const stored = localStorage.getItem(WIDTHS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ColumnWidths>;
      return { ...DEFAULT_COLUMN_WIDTHS, ...parsed };
    }
  } catch {
    // Ignore errors
  }
  return { ...DEFAULT_COLUMN_WIDTHS };
}

export function saveColumnWidths(widths: ColumnWidths): void {
  try {
    localStorage.setItem(WIDTHS_STORAGE_KEY, JSON.stringify(widths));
  } catch {
    // Ignore errors
  }
}

// ─── Density ─────────────────────────────────────────────────────────────────

export type Density = "compact" | "normal" | "comfortable";

export const DENSITY_OPTIONS: ReadonlyArray<{
  value: Density;
  label: string;
  rowHeight: number;
}> = [
  { value: "compact", label: "Compacta", rowHeight: 32 },
  { value: "normal", label: "Normal", rowHeight: 40 },
  { value: "comfortable", label: "Cómoda", rowHeight: 52 },
];

const DENSITY_STORAGE_KEY = "clientes-density";

export function loadDensity(): Density {
  try {
    const stored = localStorage.getItem(DENSITY_STORAGE_KEY);
    if (stored === "compact" || stored === "normal" || stored === "comfortable")
      return stored;
  } catch {
    /* ignore */
  }
  return "normal";
}

export function saveDensity(d: Density): void {
  try {
    localStorage.setItem(DENSITY_STORAGE_KEY, d);
  } catch {
    /* ignore */
  }
}

// ─── Pinned columns ──────────────────────────────────────────────────────────

export const MAX_PINNED = 2;
const PINNED_STORAGE_KEY = "clientes-pinned-columns";

export function loadPinnedColumns(): ColumnId[] {
  try {
    const stored = localStorage.getItem(PINNED_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ColumnId[];
      return parsed
        .filter((id) => COLUMNS.some((col) => col.id === id))
        .slice(0, MAX_PINNED);
    }
  } catch {
    /* ignore */
  }
  return ["cliente"];
}

export function savePinnedColumns(pinned: ColumnId[]): void {
  try {
    localStorage.setItem(
      PINNED_STORAGE_KEY,
      JSON.stringify(pinned.slice(0, MAX_PINNED))
    );
  } catch {
    /* ignore */
  }
}
