import { ventaV2Http } from "./ventaV2Types";

export interface VentaArchivoArticuloDTO {
  articulo_id: number;
  nombre: string;
  /** Decimal en texto sin decimales fijos (p. ej. "1"). */
  cantidad: string;
  precio_lista: string;
  precio_corto_plazo: string;
  precio_contado: string;
  combo_id: number | null;
}

export interface VentaArchivoComboDTO {
  combo_id: number;
  nombre: string;
  precio_lista: string;
  precio_corto_plazo: string;
  precio_contado: string;
}

export interface VentaArchivoVendedorDTO {
  email: string;
  nombre: string;
}

export interface VentaArchivoImagenDTO {
  id: string;
  mime: string;
  fecha_subida: string;
}

// Contrato de GET /v2/ventas/archivo/{id}. Dinero como decimal en texto
// ("0.00"); los textos ausentes llegan como "" (nunca null).
export interface VentaArchivoDTO {
  id: string;
  nombre_cliente: string;
  telefono: string;
  direccion: string;
  numero_exterior: string;
  colonia: string;
  poblacion: string;
  ciudad: string;
  latitud: number | null;
  longitud: number | null;
  aval: string;
  nota: string;
  /** RFC3339 UTC. */
  fecha_venta: string;
  tipo_venta: "CREDITO" | "CONTADO" | null;
  plan_texto: string;
  precio_total: string;
  enganche: string;
  parcialidad: string;
  frec_pago: string;
  dia_cobranza: string;
  monto_corto_plazo: string;
  plazo_corto_meses: number;
  articulos: VentaArchivoArticuloDTO[];
  combos: VentaArchivoComboDTO[];
  vendedores: VentaArchivoVendedorDTO[];
  capturada_por: string;
  imagenes: VentaArchivoImagenDTO[];
}

export async function getVentaArchivo(id: string, signal?: AbortSignal): Promise<VentaArchivoDTO> {
  const res = await ventaV2Http.get<VentaArchivoDTO>(`/ventas/archivo/${id}`, { signal });
  return res.data;
}

export function rutaImagenArchivo(id: string, imgId: string): string {
  return `/ventas/archivo/${id}/imagenes/${imgId}`;
}
