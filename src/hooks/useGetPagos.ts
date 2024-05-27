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
  FECHA_HORA_PAGO: Timestamp;
  IMPORTE: number;
  LAT: number;
  LNG: number;
}

const useGetPagos = (
  idCobrador: number,
  fechaInicio: Dayjs,
  fechaFin: Dayjs
) => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getPagos = () => {
    const q = query(
      collection(db, PAGOS_COLLECTION),
      where("COBRADOR_ID", "==", idCobrador),
      where("FECHA_HORA_PAGO", ">=", fechaInicio.toDate()),
      where("FECHA_HORA_PAGO", "<=", fechaFin.toDate())
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
  }, [idCobrador, fechaInicio, fechaFin]);

  return { pagos, isLoading };
};

export default useGetPagos;
