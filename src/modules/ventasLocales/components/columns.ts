export type ColumnId =
  | "cliente"
  | "telefono"
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
    width: "w-[130px]",
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
  {
    id: "fecha",
    label: "Fecha",
    defaultVisible: true,
    sortable: true,
    sortKey: "fechaVenta",
    width: "w-[110px]",
  },
];

export const DEFAULT_VISIBLE_COLUMNS: ColumnId[] = COLUMNS
  .filter((col) => col.defaultVisible)
  .map((col) => col.id);

const STORAGE_KEY = "ventas-visible-columns";

export function loadVisibleColumns(): ColumnId[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ColumnId[];
      // Validate that all stored columns are valid
      const validColumns = parsed.filter((id) =>
        COLUMNS.some((col) => col.id === id)
      );
      if (validColumns.length > 0) {
        return validColumns;
      }
    }
  } catch {
    // Ignore errors
  }
  return DEFAULT_VISIBLE_COLUMNS;
}

export function saveVisibleColumns(columns: ColumnId[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  } catch {
    // Ignore errors
  }
}
