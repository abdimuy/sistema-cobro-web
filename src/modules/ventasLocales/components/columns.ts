export type ColumnGroup =
  | "Estado"
  | "Identificación"
  | "Cliente"
  | "Ubicación"
  | "Plan"
  | "Montos"
  | "Microsip"
  | "Conteos"
  | "Auditoría"
  | "Otros";

export const COLUMN_GROUPS: ColumnGroup[] = [
  "Estado",
  "Identificación",
  "Cliente",
  "Ubicación",
  "Plan",
  "Montos",
  "Microsip",
  "Conteos",
  "Auditoría",
  "Otros",
];

export type ColumnId =
  | "fase"
  | "id"
  | "cliente"
  | "telefono"
  | "montoCorto"
  | "direccion"
  | "colonia"
  | "ciudad"
  | "poblacion"
  | "total"
  | "enganche"
  | "parcialidad"
  | "tipo"
  | "frecuencia"
  | "zona"
  | "vendedor"
  | "creador"
  | "almacen"
  | "diaCobranza"
  | "fecha"
  | "situacion"
  | "sincronizacion"
  | "estado"
  | "microsipFolio"
  | "microsipDoctoPvId"
  | "microsipAplicadaAt"
  | "montoContado"
  | "plazoMeses"
  | "clienteId"
  | "aval"
  | "referencia"
  | "gps"
  | "productosCount"
  | "combosCount"
  | "imagenesCount"
  | "nota"
  | "createdAt"
  | "updatedAt"
  | "updatedBy"
  | "aprobadoAt"
  | "aprobadoBy"
  | "canceladoAt"
  | "canceladoBy"
  | "cancelReason";

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
  // El ORDEN de este arreglo es el orden por omisión de la tabla: la vista
  // arranca con las columnas `defaultVisible` en la secuencia en que aparecen
  // aquí. Hoy: Fase, Cliente, Fecha, Ciudad, Zona, Vendedor, Teléfono, Tipo,
  // Total, Situación, Folio Microsip.
  {
    id: "fase",
    label: "Fase",
    defaultVisible: true,
    width: "w-[186px]",
    group: "Estado",
  },
  {
    id: "cliente",
    label: "Cliente",
    defaultVisible: true,
    sortable: true,
    sortKey: "nombreCliente",
    width: "min-w-[180px]",
    group: "Cliente",
  },
  {
    id: "fecha",
    label: "Fecha",
    defaultVisible: true,
    sortable: true,
    sortKey: "fechaVenta",
    width: "w-[150px]",
    group: "Identificación",
  },
  {
    id: "ciudad",
    label: "Ciudad",
    defaultVisible: true,
    sortable: true,
    sortKey: "ciudad",
    width: "w-[130px]",
    group: "Ubicación",
  },
  {
    id: "zona",
    label: "Zona",
    defaultVisible: true,
    width: "w-[70px]",
    group: "Ubicación",
  },
  {
    id: "vendedor",
    label: "Vendedor",
    defaultVisible: true,
    width: "w-[140px]",
    group: "Otros",
  },
  {
    id: "telefono",
    label: "Teléfono",
    defaultVisible: true,
    width: "w-[100px]",
    group: "Cliente",
  },
  {
    id: "tipo",
    label: "Tipo",
    defaultVisible: true,
    sortable: true,
    sortKey: "tipoVenta",
    width: "w-[90px]",
    group: "Plan",
  },
  {
    id: "total",
    label: "Total",
    defaultVisible: true,
    sortable: true,
    sortKey: "precioTotal",
    align: "right",
    width: "w-[110px]",
    group: "Montos",
  },
  { id: "situacion", label: "Situación", defaultVisible: true, width: "w-[110px]", group: "Estado" as ColumnGroup },
  { id: "microsipFolio", label: "Folio Microsip", defaultVisible: true, width: "w-[130px]", group: "Microsip" as ColumnGroup },

  // ─── Fuera de la vista por omisión (siguen en el selector) ─────────────────
  // El ID es un UUID: no se lee de un vistazo y ocupa una columna entera.
  {
    id: "id",
    label: "ID",
    defaultVisible: false,
    width: "w-[90px]",
    group: "Identificación",
  },
  {
    id: "direccion",
    label: "Dirección",
    defaultVisible: false,
    width: "min-w-[200px]",
    group: "Ubicación",
  },
  {
    id: "colonia",
    label: "Colonia",
    defaultVisible: false,
    width: "w-[120px]",
    group: "Ubicación",
  },
  {
    id: "poblacion",
    label: "Población",
    defaultVisible: false,
    width: "w-[120px]",
    group: "Ubicación",
  },
  {
    id: "montoCorto",
    label: "Corto plazo",
    defaultVisible: false,
    align: "right",
    width: "w-[110px]",
    group: "Montos",
  },
  {
    id: "enganche",
    label: "Enganche",
    defaultVisible: false,
    align: "right",
    width: "w-[100px]",
    group: "Montos",
  },
  {
    id: "parcialidad",
    label: "Parcialidad",
    defaultVisible: false,
    align: "right",
    width: "w-[100px]",
    group: "Montos",
  },
  {
    id: "frecuencia",
    label: "Frecuencia",
    defaultVisible: false,
    width: "w-[110px]",
    group: "Plan",
  },
  {
    id: "creador",
    label: "Creador",
    defaultVisible: false,
    width: "w-[140px]",
    group: "Otros",
  },
  {
    id: "almacen",
    label: "Almacén",
    defaultVisible: false,
    width: "w-[130px]",
    group: "Otros",
  },
  {
    id: "diaCobranza",
    label: "Día cobranza",
    defaultVisible: false,
    width: "w-[120px]",
    group: "Plan",
  },
  // Estado del workflow. `sincronizacion` sale de la vista por omisión: el
  // cuarto arco de la columna Fase ya dice si la venta llegó a Microsip.
  { id: "sincronizacion", label: "Sincronización", defaultVisible: false, width: "w-[130px]", group: "Estado" as ColumnGroup },
  { id: "estado", label: "Estado", defaultVisible: false, width: "w-[90px]", group: "Estado" as ColumnGroup },
  // Microsip
  { id: "microsipDoctoPvId", label: "Docto PV ID", defaultVisible: false, align: "right" as const, width: "w-[110px]", group: "Microsip" as ColumnGroup },
  { id: "microsipAplicadaAt", label: "Aplicada en", defaultVisible: false, width: "w-[150px]", group: "Microsip" as ColumnGroup },
  // Montos / plan extra
  { id: "montoContado", label: "Contado", defaultVisible: false, align: "right" as const, width: "w-[110px]", group: "Montos" as ColumnGroup },
  { id: "plazoMeses", label: "Plazo", defaultVisible: false, align: "right" as const, width: "w-[70px]", group: "Plan" as ColumnGroup },
  // Cliente
  { id: "clienteId", label: "Cliente ID", defaultVisible: false, align: "right" as const, width: "w-[100px]", group: "Identificación" as ColumnGroup },
  { id: "aval", label: "Aval", defaultVisible: false, width: "w-[140px]", group: "Cliente" as ColumnGroup },
  { id: "referencia", label: "Referencia", defaultVisible: false, width: "w-[150px]", group: "Cliente" as ColumnGroup },
  // Ubicación
  { id: "gps", label: "GPS", defaultVisible: false, width: "w-[140px]", group: "Ubicación" as ColumnGroup },
  // Conteos
  { id: "productosCount", label: "Productos", defaultVisible: false, align: "right" as const, width: "w-[100px]", group: "Conteos" as ColumnGroup },
  { id: "combosCount", label: "Combos", defaultVisible: false, align: "right" as const, width: "w-[100px]", group: "Conteos" as ColumnGroup },
  { id: "imagenesCount", label: "Imágenes", defaultVisible: false, align: "right" as const, width: "w-[100px]", group: "Conteos" as ColumnGroup },
  // Otros
  { id: "nota", label: "Nota", defaultVisible: false, width: "w-[200px]", group: "Otros" as ColumnGroup },
  // Auditoría
  { id: "createdAt", label: "Creada", defaultVisible: false, width: "w-[150px]", group: "Auditoría" as ColumnGroup },
  { id: "updatedAt", label: "Actualizada", defaultVisible: false, width: "w-[150px]", group: "Auditoría" as ColumnGroup },
  { id: "updatedBy", label: "Actualizada por", defaultVisible: false, width: "w-[150px]", group: "Auditoría" as ColumnGroup },
  // Aprobación / cancelación
  { id: "aprobadoAt", label: "Aprobada en", defaultVisible: false, width: "w-[150px]", group: "Auditoría" as ColumnGroup },
  { id: "aprobadoBy", label: "Aprobada por", defaultVisible: false, width: "w-[140px]", group: "Auditoría" as ColumnGroup },
  { id: "canceladoAt", label: "Cancelada en", defaultVisible: false, width: "w-[150px]", group: "Auditoría" as ColumnGroup },
  { id: "canceladoBy", label: "Cancelada por", defaultVisible: false, width: "w-[150px]", group: "Auditoría" as ColumnGroup },
  { id: "cancelReason", label: "Motivo cancelación", defaultVisible: false, width: "w-[200px]", group: "Auditoría" as ColumnGroup },
] as ColumnDef[];

export const DEFAULT_VISIBLE_COLUMNS: ColumnId[] = COLUMNS
  .filter((col) => col.defaultVisible)
  .map((col) => col.id);

// v3: la vista por omisión cambió (entra Fase, sale Sincronización). Subir la
// llave es lo que hace que el cambio llegue a quien ya tenía columnas guardadas.
const STORAGE_KEY = "ventas-visible-columns-v3";
const WIDTHS_STORAGE_KEY = "ventas-column-widths";

export function loadVisibleColumns(): ColumnId[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ColumnId[];
      // Get valid stored columns
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
  fase: 186,
  id: 90,
  cliente: 180,
  telefono: 100,
  montoCorto: 110,
  direccion: 200,
  colonia: 120,
  ciudad: 130,
  poblacion: 120,
  total: 110,
  enganche: 100,
  parcialidad: 100,
  tipo: 90,
  frecuencia: 110,
  zona: 70,
  vendedor: 140,
  creador: 140,
  almacen: 130,
  diaCobranza: 120,
  fecha: 150,
  situacion: 110,
  sincronizacion: 130,
  estado: 90,
  microsipFolio: 130,
  microsipDoctoPvId: 110,
  microsipAplicadaAt: 150,
  montoContado: 110,
  plazoMeses: 70,
  clienteId: 100,
  aval: 140,
  referencia: 150,
  gps: 140,
  productosCount: 100,
  combosCount: 100,
  imagenesCount: 100,
  nota: 200,
  createdAt: 150,
  updatedAt: 150,
  updatedBy: 150,
  aprobadoAt: 150,
  aprobadoBy: 140,
  canceladoAt: 150,
  canceladoBy: 150,
  cancelReason: 200,
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

const DENSITY_STORAGE_KEY = "ventas-density";

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
const PINNED_STORAGE_KEY = "ventas-pinned-columns-v2";

/** Fase se ancla y va ANTES de cliente en el grupo de columnas fijas. */
export const DEFAULT_PINNED_COLUMNS: ColumnId[] = ["fase", "cliente"];

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
  return [...DEFAULT_PINNED_COLUMNS];
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
