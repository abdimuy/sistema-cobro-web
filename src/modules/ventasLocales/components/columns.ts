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
  shortLabel?: string;
  defaultVisible: boolean;
  sortable?: boolean;
  sortKey?: string;
  align?: "left" | "right" | "center";
  width?: string;
  group?: ColumnGroup;
}

export const COLUMNS: ColumnDef[] = [
  {
    id: "id",
    label: "ID",
    defaultVisible: true,
    width: "w-[90px]",
    group: "Identificación",
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
    id: "cliente",
    label: "Cliente",
    defaultVisible: true,
    sortable: true,
    sortKey: "nombreCliente",
    width: "min-w-[180px]",
    group: "Cliente",
  },
  {
    id: "telefono",
    label: "Teléfono",
    defaultVisible: true,
    width: "w-[100px]",
    group: "Cliente",
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
    id: "ciudad",
    label: "Ciudad",
    defaultVisible: true,
    sortable: true,
    sortKey: "ciudad",
    width: "w-[130px]",
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
    id: "total",
    label: "Total",
    defaultVisible: true,
    sortable: true,
    sortKey: "precioTotal",
    align: "right",
    width: "w-[110px]",
    group: "Montos",
  },
  {
    id: "montoCorto",
    label: "Monto C.P.",
    shortLabel: "M. C.P.",
    defaultVisible: true,
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
    id: "tipo",
    label: "Tipo",
    defaultVisible: true,
    sortable: true,
    sortKey: "tipoVenta",
    width: "w-[90px]",
    group: "Plan",
  },
  {
    id: "frecuencia",
    label: "Frecuencia",
    shortLabel: "Frec.",
    defaultVisible: true,
    width: "w-[90px]",
    group: "Plan",
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
    defaultVisible: false,
    width: "w-[140px]",
    group: "Otros",
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
    label: "Día Cobranza",
    shortLabel: "Día Cob.",
    defaultVisible: false,
    width: "w-[100px]",
    group: "Plan",
  },
  // Estado del workflow
  { id: "situacion", label: "Situación", defaultVisible: true, width: "w-[110px]", group: "Estado" as ColumnGroup },
  { id: "sincronizacion", label: "Sincronización", shortLabel: "Sinc.", defaultVisible: true, width: "w-[110px]", group: "Estado" as ColumnGroup },
  { id: "estado", label: "Estado", defaultVisible: false, width: "w-[90px]", group: "Estado" as ColumnGroup },
  // Microsip
  { id: "microsipFolio", label: "Folio Microsip", shortLabel: "Folio", defaultVisible: true, width: "w-[110px]", group: "Microsip" as ColumnGroup },
  { id: "microsipDoctoPvId", label: "Docto PV ID", defaultVisible: false, align: "right" as const, width: "w-[110px]", group: "Microsip" as ColumnGroup },
  { id: "microsipAplicadaAt", label: "Aplicada en", defaultVisible: false, width: "w-[150px]", group: "Microsip" as ColumnGroup },
  // Montos / plan extra
  { id: "montoContado", label: "Monto Contado", shortLabel: "M. Cont.", defaultVisible: false, align: "right" as const, width: "w-[110px]", group: "Montos" as ColumnGroup },
  { id: "plazoMeses", label: "Plazo", defaultVisible: false, align: "right" as const, width: "w-[70px]", group: "Plan" as ColumnGroup },
  // Cliente
  { id: "clienteId", label: "Cliente ID", defaultVisible: false, align: "right" as const, width: "w-[100px]", group: "Identificación" as ColumnGroup },
  { id: "aval", label: "Aval", defaultVisible: false, width: "w-[140px]", group: "Cliente" as ColumnGroup },
  { id: "referencia", label: "Referencia", defaultVisible: false, width: "w-[150px]", group: "Cliente" as ColumnGroup },
  // Ubicación
  { id: "gps", label: "GPS", defaultVisible: false, width: "w-[140px]", group: "Ubicación" as ColumnGroup },
  // Conteos
  { id: "productosCount", label: "# Productos", shortLabel: "# Prod.", defaultVisible: false, align: "right" as const, width: "w-[90px]", group: "Conteos" as ColumnGroup },
  { id: "combosCount", label: "# Combos", defaultVisible: false, align: "right" as const, width: "w-[90px]", group: "Conteos" as ColumnGroup },
  { id: "imagenesCount", label: "# Imágenes", shortLabel: "# Img.", defaultVisible: false, align: "right" as const, width: "w-[90px]", group: "Conteos" as ColumnGroup },
  // Otros
  { id: "nota", label: "Nota", defaultVisible: false, width: "w-[200px]", group: "Otros" as ColumnGroup },
  // Auditoría
  { id: "createdAt", label: "Creada", defaultVisible: false, width: "w-[150px]", group: "Auditoría" as ColumnGroup },
  { id: "updatedAt", label: "Actualizada", defaultVisible: false, width: "w-[150px]", group: "Auditoría" as ColumnGroup },
  { id: "updatedBy", label: "Actualizada por", shortLabel: "Act. por", defaultVisible: false, width: "w-[140px]", group: "Auditoría" as ColumnGroup },
  // Aprobación / cancelación
  { id: "aprobadoAt", label: "Aprobada en", defaultVisible: false, width: "w-[150px]", group: "Auditoría" as ColumnGroup },
  { id: "aprobadoBy", label: "Aprobada por", shortLabel: "Apr. por", defaultVisible: false, width: "w-[140px]", group: "Auditoría" as ColumnGroup },
  { id: "canceladoAt", label: "Cancelada en", defaultVisible: false, width: "w-[150px]", group: "Auditoría" as ColumnGroup },
  { id: "canceladoBy", label: "Cancelada por", shortLabel: "Canc. por", defaultVisible: false, width: "w-[140px]", group: "Auditoría" as ColumnGroup },
  { id: "cancelReason", label: "Motivo cancelación", shortLabel: "Motivo", defaultVisible: false, width: "w-[200px]", group: "Auditoría" as ColumnGroup },
] as ColumnDef[];

export const DEFAULT_VISIBLE_COLUMNS: ColumnId[] = COLUMNS
  .filter((col) => col.defaultVisible)
  .map((col) => col.id);

const STORAGE_KEY = "ventas-visible-columns-v2";
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
  frecuencia: 90,
  zona: 70,
  vendedor: 140,
  creador: 140,
  almacen: 130,
  diaCobranza: 100,
  fecha: 150,
  situacion: 110,
  sincronizacion: 110,
  estado: 90,
  microsipFolio: 110,
  microsipDoctoPvId: 110,
  microsipAplicadaAt: 150,
  montoContado: 110,
  plazoMeses: 70,
  clienteId: 100,
  aval: 140,
  referencia: 150,
  gps: 140,
  productosCount: 90,
  combosCount: 90,
  imagenesCount: 90,
  nota: 200,
  createdAt: 150,
  updatedAt: 150,
  updatedBy: 140,
  aprobadoAt: 150,
  aprobadoBy: 140,
  canceladoAt: 150,
  canceladoBy: 140,
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
