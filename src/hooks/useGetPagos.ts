import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { Timestamp, where } from "firebase/firestore";
import { PAGOS_COLLECTION } from "../constants/collections";
import { onSnapshot, query, collection } from "firebase/firestore";
import { Dayjs } from "dayjs";

export interface Pago {
  ID: string;
  CLIENTE_ID: number;
  COBRADOR: string;
  COBRADOR_ID: number;
  DOCTO_CC_ID: number;
  DOCTO_CC_ACR_ID: number;
  FECHA_HORA_PAGO: Timestamp;
  FORMA_COBRO_ID: number;
  IMPORTE: number;
  LAT: number;
  LNG: number;
}

const useGetPagos = (
  idZonaCliente: number,
  fechaInicio: Dayjs,
  fechaFin: Dayjs
) => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getPagos = () => {
    const q = query(
      collection(db, PAGOS_COLLECTION),
      where("ZONA_CLIENTE_ID", "==", idZonaCliente),
      where("FECHA_HORA_PAGO", ">=", Timestamp.fromDate(fechaInicio.toDate())),
      where("FECHA_HORA_PAGO", "<=", Timestamp.fromDate(fechaFin.toDate()))
    );
    return onSnapshot(q, (querySnapshot) => {
      const data: Pago[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ ...doc.data(), ID: doc.id } as Pago);
      });
      setPagos(data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    const unsubscribe = getPagos();
    return unsubscribe;
  }, [idZonaCliente, fechaInicio, fechaFin]);

  return { pagos, isLoading };
};

export default useGetPagos;
