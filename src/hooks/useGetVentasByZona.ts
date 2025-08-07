import { useEffect, useState } from "react";
import getVentasByRuta, { Sale } from "../services/api/getVentasByRuta";

const useGetVentasByZona = (zonaClienteId: number = 0) => {
  const [ventas, setVentas] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const getVentas = () => {
    setLoading(true);
    getVentasByRuta(zonaClienteId)
      .then((ventas) => {
        setVentas(ventas);
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (zonaClienteId !== 0) {
      getVentas();
    }
  }, [zonaClienteId]);

  return { ventas, loading };
};

export default useGetVentasByZona;
