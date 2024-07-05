import { db } from "../../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { VENTAS_COLLECTION } from "../../constants/collections";
import { Venta, ventaInitialData } from "./getVenta";

const getVentaByCliente = async (CLIENTE_ID: number) => {
  const q = query(
    collection(db, VENTAS_COLLECTION),
    where("CLIENTE_ID", "==", CLIENTE_ID)
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

export default getVentaByCliente;
