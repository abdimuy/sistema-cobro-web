import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { onSnapshot, query, collection } from "firebase/firestore";
import { db } from "../../firebase";
import { USERS_COLLECTION } from "../constants/collections";

export interface Cobrador {
  COBRADOR_ID: number;
  CREATED_AT: Timestamp;
  EMAIL: string;
  NOMBRE: string;
  ZONA_CLIENTE_ID: number;
  FECHA_CARGA_INICIAL: Timestamp;
  ID: string;
  TELEFONO: string;
  MODULOS?: string[];
}

export type CobradorDto = Omit<Cobrador, "ID">;

const useGetCobradores = () => {
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getCobradores = () => {
    const q = query(collection(db, USERS_COLLECTION));
    return onSnapshot(q, (querySnapshot) => {
      const data: Cobrador[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ ...doc.data(), ID: doc.id } as Cobrador);
      });
      setCobradores(data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    const unsubscribe = getCobradores();
    return unsubscribe;
  }, []);

  return { cobradores, isLoading };
};

export default useGetCobradores;
