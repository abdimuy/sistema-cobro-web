import axios, { AxiosRequestConfig } from "axios";
import { URL_API } from "../../constants/api";

const BASE_URL = URL_API

export interface VentaLocal {
  LOCAL_SALE_ID: string;
  USER_EMAIL: string;
  ALMACEN_ID: number;
  NOMBRE_CLIENTE: string;
  FECHA_VENTA: string;
  LATITUD: number;
  LONGITUD: number;
  DIRECCION: string;
  PRECIO_TOTAL: number;
  TELEFONO: string;
  PARCIALIDAD?: number;
  ENGANCHE?: number;
  FREC_PAGO?: string;
  AVAL_O_RESPONSABLE?: string;
  NOTA?: string;
  DIA_COBRANZA?: string;
  TIEMPO_A_CORTO_PLAZOMESES?: number;
  MONTO_A_CORTO_PLAZO?: number;
  // Nuevos campos de dirección
  NUMERO?: string;
  COLONIA?: string;
  POBLACION?: string;
  CIUDAD?: string;
  // Nuevo campo tipo de venta
  TIPO_VENTA?: string;
}

export interface ProductoVenta {
  LOCAL_SALE_ID: string;
  ARTICULO_ID: number;
  ARTICULO: string;
  CANTIDAD: number;
  PRECIO_LISTA: number;
  PRECIO_CORTO_PLAZO: number;
  PRECIO_CONTADO: number;
}

export interface ImagenVenta {
  ID: string;
  LOCAL_SALE_ID: string;
  IMG_PATH: string;
  IMG_MIME: string;
  IMG_DESC: string;
  FECHA_SUBIDA: string;
}

export interface VentaCompleta extends VentaLocal {
  productos: ProductoVenta[];
  imagenes: ImagenVenta[];
}

export interface ResumenVentas {
  TOTAL_VENTAS: number;
  MONTO_TOTAL: number;
  VENTAS_ENVIADAS: number;
  VENTAS_PENDIENTES: number;
}

interface VentasParams {
  fechaInicio?: string;
  fechaFin?: string;
  nombreCliente?: string;
  limit?: number;
  offset?: number;
}

export const getVentasLocales = async (params?: VentasParams): Promise<VentaLocal[]> => {
  const options: AxiosRequestConfig = {
    url: `${BASE_URL}/ventas-locales`,
    method: "GET",
    params,
  };
  const response = await axios.request<{ body: VentaLocal[]; error: string }>(options);
  return response.data.body;
};

export const getVentaLocalCompleta = async (ventaId: string): Promise<VentaCompleta> => {
  const options: AxiosRequestConfig = {
    url: `${BASE_URL}/ventas-locales/${ventaId}`,
    method: "GET",
  };
  const response = await axios.request<{ body: VentaCompleta; error: string }>(options);
  return response.data.body;
};

export const getImagenesVenta = async (ventaId: string): Promise<ImagenVenta[]> => {
  const options: AxiosRequestConfig = {
    url: `${BASE_URL}/ventas-locales/${ventaId}/imagenes`,
    method: "GET",
  };
  const response = await axios.request<{ body: ImagenVenta[]; error: string }>(options);
  return response.data.body;
};

export const getResumenVentas = async (fechaInicio?: string, fechaFin?: string): Promise<ResumenVentas> => {
  const options: AxiosRequestConfig = {
    url: `${BASE_URL}/ventas-locales/resumen`,
    method: "GET",
    params: { fechaInicio, fechaFin },
  };
  const response = await axios.request<{ body: ResumenVentas; error: string }>(options);
  return response.data.body;
};

export const getImageUrl = (imagePath: string): string => {
  // Si la ruta ya incluye el dominio completo, la devolvemos tal como está
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Si no, construimos la URL completa con la base
  return `${BASE_URL}${imagePath}`;
};