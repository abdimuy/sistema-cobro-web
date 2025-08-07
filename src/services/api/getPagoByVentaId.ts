import { URL_API } from "../../constants/api";
import axios from "axios";

export interface Pago {
  IMPTE_DOCTO_CC_ID: number;
  DOCTO_CC_ID: number;
  FOLIO: string;
  CONCEPTO_CC_ID: number;
  CLIENTE_ID: number;
  CONCEPTO: string;
  FECHA: string; // ISO date string
  CANCELADO: string; // 'S' o 'N'
  APLICADO: string; // 'S' o 'N'
  ESTATUS: string; // 'N' u otros posibles valores
  DOCTO_CC_ACR_ID: number;
  IMPORTE: number;
  IMPUESTO: number;
  CANTIDAD: number;
  LAT: number;
  LON: number;
}

const getPagosByVentaId = async (id: number): Promise<Pago[]> => {
  const {
    data: { body: pagos },
  } = await axios.get<{ error: ""; body: Pago[] }>(
    URL_API + `/pagos/pagos-by-id/${id}`
  );
  console.log(pagos);

  return pagos;
};

export default getPagosByVentaId;
