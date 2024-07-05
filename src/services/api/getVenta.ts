import { db } from "../../../firebase";
import {
  Timestamp,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { VENTAS_COLLECTION } from "../../constants/collections";

export interface Venta {
  ID: string;
  APLICADO: string;
  CALLE: string;
  CIUDAD: string;
  CLIENTE: string;
  CLIENTE_ID: number;
  COBRADOR_ID: number;
  DIA_COBRANZA: string;
  DIA_TEMPORAL_COBRANZA: string;
  DOCTO_CC_ACR_ID: number;
  DOCTO_CC_ID: number;
  ENGANCHE: number;
  ESTADO: string;
  ESTADO_COBRANZA: string;
  FECHA: Timestamp;
  FECHA_ULT_PAGO: Timestamp;
  FOLIO: string;
  IMPORTE_PAGO_PROMEDIO: number;
  IMPTE_REST: number;
  LIMITE_CREDITO: number;
  NOMBRE_COBRADOR: string;
  NOTAS: string;
  NUM_IMPORTES: number;
  PARCIALIDAD: number;
  PRECIO_TOTAL: number;
  SALDO_REST: number;
  TELEFONO: string;
  TIEMPO_A_CORTO_PLAZOMESES: number;
  TOTAL_IMPORTE: number;
  VENDEDOR_1: string;
  VENDEDOR_2: string;
  VENDEDOR_3: string;
  ZONA_CLIENTE_ID: number;
  ZONA_NOMBRE: string;
}

export const ventaInitialData: Venta = {
  ID: "",
  APLICADO: "",
  CALLE: "",
  CIUDAD: "",
  CLIENTE: "",
  CLIENTE_ID: 0,
  COBRADOR_ID: 0,
  DIA_COBRANZA: "",
  DIA_TEMPORAL_COBRANZA: "",
  DOCTO_CC_ACR_ID: 0,
  DOCTO_CC_ID: 0,
  ENGANCHE: 0,
  ESTADO: "",
  ESTADO_COBRANZA: "",
  FECHA: Timestamp.now(),
  FECHA_ULT_PAGO: Timestamp.now(),
  FOLIO: "",
  IMPORTE_PAGO_PROMEDIO: 0,
  IMPTE_REST: 0,
  LIMITE_CREDITO: 0,
  NOMBRE_COBRADOR: "",
  NOTAS: "",
  NUM_IMPORTES: 0,
  PARCIALIDAD: 0,
  PRECIO_TOTAL: 0,
  SALDO_REST: 0,
  TELEFONO: "",
  TIEMPO_A_CORTO_PLAZOMESES: 0,
  TOTAL_IMPORTE: 0,
  VENDEDOR_1: "",
  VENDEDOR_2: "",
  VENDEDOR_3: "",
  ZONA_CLIENTE_ID: 0,
  ZONA_NOMBRE: "",
};

const getVenta = async (DOCTO_CC_ACR_ID: number) => {
  const q = query(
    collection(db, VENTAS_COLLECTION),
    where("DOCTO_CC_ACR_ID", "==", DOCTO_CC_ACR_ID)
  );
  const querySnapshot = await getDocs(q);
  let data: Venta = ventaInitialData;
  if (querySnapshot.empty) {
    return data;
  }
  data = {
    ...querySnapshot.docs[0].data(),
    ID: querySnapshot.docs[0].id,
  } as Venta;
  return data;
};

export default getVenta;
