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
  | "fecha";

export interface ColumnDef {
  id: ColumnId;
  label: string;
  shortLabel?: string;
  defaultVisible: boolean;
  sortable?: boolean;
  sortKey?: string;
  align?: "left" | "right" | "center";
  width?: string;
}

export const COLUMNS: ColumnDef[] = [
  {
    id: "id",
    label: "ID",
    defaultVisible: true,
    width: "w-[90px]",
  },
  {
    id: "fecha",
    label: "Fecha",
    defaultVisible: true,
    sortable: true,
    sortKey: "fechaVenta",
    width: "w-[150px]",
  },
  {
    id: "cliente",
    label: "Cliente",
    defaultVisible: true,
    sortable: true,
    sortKey: "nombreCliente",
    width: "min-w-[180px]",
  },
  {
    id: "telefono",
    label: "Teléfono",
    defaultVisible: true,
    width: "w-[100px]",
  },
  {
    id: "direccion",
    label: "Dirección",
    defaultVisible: false,
    width: "min-w-[200px]",
  },
  {
    id: "colonia",
    label: "Colonia",
    defaultVisible: false,
    width: "w-[120px]",
  },
  {
    id: "ciudad",
    label: "Ciudad",
    defaultVisible: true,
    sortable: true,
    sortKey: "ciudad",
    width: "w-[130px]",
  },
  {
    id: "poblacion",
    label: "Población",
    defaultVisible: false,
    width: "w-[120px]",
  },
  {
    id: "total",
    label: "Total",
    defaultVisible: true,
    sortable: true,
    sortKey: "precioTotal",
    align: "right",
    width: "w-[110px]",
  },
  {
    id: "montoCorto",
    label: "Monto C.P.",
    shortLabel: "M. C.P.",
    defaultVisible: true,
    align: "right",
    width: "w-[110px]",
  },
  {
    id: "enganche",
    label: "Enganche",
    defaultVisible: false,
    align: "right",
    width: "w-[100px]",
  },
  {
    id: "parcialidad",
    label: "Parcialidad",
    defaultVisible: false,
    align: "right",
    width: "w-[100px]",
  },
  {
    id: "tipo",
    label: "Tipo",
    defaultVisible: true,
    sortable: true,
    sortKey: "tipoVenta",
    width: "w-[90px]",
  },
  {
    id: "frecuencia",
    label: "Frecuencia",
    shortLabel: "Frec.",
    defaultVisible: true,
    width: "w-[90px]",
  },
  {
    id: "zona",
    label: "Zona",
    defaultVisible: true,
    width: "w-[70px]",
  },
  {
    id: "vendedor",
    label: "Vendedor",
    defaultVisible: false,
    width: "w-[140px]",
  },
  {
    id: "creador",
    label: "Creador",
    defaultVisible: false,
    width: "w-[140px]",
  },
  {
    id: "almacen",
    label: "Almacén",
    defaultVisible: false,
    width: "w-[130px]",
  },
  {
    id: "diaCobranza",
    label: "Día Cobranza",
    shortLabel: "Día Cob.",
    defaultVisible: false,
    width: "w-[100px]",
  },
];

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
      const validStoredIds = new Set(
        parsed.filter((id) => COLUMNS.some((col) => col.id === id))
      );
      if (validStoredIds.size > 0) {
        // Return columns in COLUMNS order, filtered by what was stored
        return COLUMNS
          .filter((col) => validStoredIds.has(col.id))
          .map((col) => col.id);
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
