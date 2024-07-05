import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  Timestamp,
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { VISITAS_COLLECTION } from "../constants/collections";
import { Dayjs } from "dayjs";

export interface Visita {
  ID: string;
  CLIENTE_ID: number;
  COBRADOR: string;
  COBRADOR_ID: number;
  FECHA_HORA_VISITA: Timestamp;
  FORMA_COBRO_ID: number;
  LAT: number;
  LNG: number;
  NOTA: string;
  TIPO_VISITA: string;
  ZONA_CLIENTE_ID: number;
}

const useGetVisitas = (
  zonaClienteId: number,
  fechaInicio: Dayjs,
  fechaFin: Dayjs
) => {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getVisitas = () => {
    const q = query(
      collection(db, VISITAS_COLLECTION),
      where("ZONA_CLIENTE_ID", "==", zonaClienteId),
      where(
        "FECHA_HORA_VISITA",
        ">=",
        Timestamp.fromDate(fechaInicio.toDate())
      ),
      where("FECHA_HORA_VISITA", "<=", Timestamp.fromDate(fechaFin.toDate()))
    );
    return onSnapshot(q, (querySnapshot) => {
      const data: Visita[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ ...doc.data(), ID: doc.id } as Visita);
      });
      setVisitas(data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    const unsubscribe = getVisitas();

    return unsubscribe;
  }, [zonaClienteId, fechaInicio, fechaFin]);

  return { visitas, isLoading };
};

export default useGetVisitas;
