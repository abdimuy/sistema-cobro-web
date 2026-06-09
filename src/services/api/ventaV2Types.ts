import axios, { AxiosInstance } from "axios";
import { URL_API_V2 } from "../../constants/api";
import { auth } from "../../../firebase";

export interface CancelacionV2 { at: string; by: string; by_nombre?: string; reason: string }
export interface AprobacionV2 { at: string; by: string; by_nombre?: string }
export interface ClienteSnapshotV2 { cliente_id: number | null; nombre: string; telefono: string | null; aval: string | null; referencia: string | null }
export interface DireccionV2 { calle: string; numero_exterior: string | null; colonia: string; poblacion: string; ciudad: string; zona_cliente_id: number | null }
export interface GPSV2 { latitud: number; longitud: number }
export interface MontosV2 { anual: string; corto_plazo: string; contado: string }
export interface PlanCreditoV2 { plazo_meses: number; enganche: string; parcialidad: string; frec_pago: string }
export interface DiaCobranzaV2 { semana: string | null; mes: number | null }
export interface ProductoV2 { id: string; articulo_id: number; articulo: string; cantidad: string; precio_anual: string; precio_corto: string; precio_contado: string; combo_id: string | null; almacen_origen_id: number | null; almacen_destino_id: number | null }
export interface ComboV2 { id: string; nombre: string; precio_anual: string; precio_corto: string; precio_contado: string; cantidad: string; almacen_origen_id: number; almacen_destino_id: number }
export interface VendedorV2 { id: string; usuario_id: string; email: string; nombre: string }
export interface ImagenV2 { id: string; storage_kind: string; storage_key: string; mime: string; size_bytes: number; descripcion: string | null; created_at: string; updated_at: string; created_by: string; updated_by: string }

export type SituacionVenta = "borrador" | "revisada" | "aprobada" | "cancelada";

export interface VentaV2 {
  id: string;
  cliente: ClienteSnapshotV2;
  direccion: DireccionV2;
  gps: GPSV2;
  fecha_venta: string;
  tipo_venta: "CONTADO" | "CREDITO";
  estado: "active" | "deleted";
  situacion: SituacionVenta;
  sincronizacion: "pendiente" | "aplicada";
  microsip_folio: string | null;
  microsip_docto_pv_id: number | null;
  microsip_aplicada_at: string | null;
  montos: MontosV2;
  plan_credito: PlanCreditoV2 | null;
  dia_cobranza: DiaCobranzaV2 | null;
  nota: string | null;
  combos: ComboV2[];
  productos: ProductoV2[];
  vendedores: VendedorV2[];
  imagenes: ImagenV2[];
  cancelacion: CancelacionV2 | null;
  aprobacion: AprobacionV2 | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_nombre?: string;
  updated_by: string;
  updated_by_nombre?: string;
}

export const ventaV2Http: AxiosInstance = axios.create({
  baseURL: `${URL_API_V2}/v2`,
});

ventaV2Http.interceptors.request.use(async (config) => {
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getVentaV2 = async (id: string): Promise<VentaV2> => {
  const res = await ventaV2Http.get<VentaV2>(`/ventas/${id}`);
  return res.data;
};
