import { useState, useEffect } from "react";
import { Venta, ventaInitialData } from "../services/api/getVenta";
import getVentaByCliente from "../services/api/getVentaByCliente";

const useGetVentaByCliente = (CLIENTE_ID: number) => {
  const [venta, setVenta] = useState<Venta>(ventaInitialData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getVentaData = async () => {
      const data = await getVentaByCliente(CLIENTE_ID);
      setVenta(data);
      setIsLoading(false);
    };

    getVentaData();
  }, [CLIENTE_ID]);

  return { venta, isLoading };
};

export default useGetVentaByCliente;
