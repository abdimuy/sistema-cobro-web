import axios, { AxiosRequestConfig } from "axios";
import { URL_API } from "../../constants/api";

export interface Sale {
  DOCTO_CC_ACR_ID: number;
  DOCTO_CC_ID: number;
  FOLIO: string;
  CLIENTE_ID: number;
  CLIENTE: string;
  RUTA: string;
  DOMICILIO: string;
  LOCALIDAD_ID: number;
  LOCALIDAD: string;
  IMPORTE_PAGO_PROMEDIO: number;
  TOTAL_IMPORTE: number;
  NUM_IMPORTES: number;
  FECHA: string;
  PARCIALIDAD: number;
  ENGANCHE: number;
  VENDEDOR_1: number;
  VENDEDOR_2: string;
  VENDEDOR_3: string;
  FREC_PAGO_ID: number;
  FREC_PAGO: string;
  PRECIO_TOTAL: number;
  IMPTE_REST: number;
  SALDO_REST: number;
  PORCETAJE_PAGADO: number;
  FECHA_ULT_PAGO: string;
  PLAZOS_TRANS: number;
  IMPTE_ACTUAL_ESTIMADO: number;
  IMPTE_ATRASADO: number;
  NUM_PLAZOS_ATRASADOS_BY_SALDO: number;
}

const getVentasByRuta = async (zonaClienteId: number): Promise<Sale[]> => {
  const options: AxiosRequestConfig = {
    url: URL_API + "/ventas/get-ventas-by-zona-cliente/" + zonaClienteId,
  };
  const response = await axios.request<{ body: Sale[]; error: "" }>(options);
  return response.data.body;
};

export default getVentasByRuta;
