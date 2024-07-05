import { useState, useEffect } from "react";
import { Venta, ventaInitialData } from "../services/api/getVenta";
import getVenta from "../services/api/getVenta";

const useGetVenta = (DOCTO_CC_ACR_ID: number) => {
  const [venta, setVenta] = useState<Venta>(ventaInitialData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getVentaData = async () => {
      const data = await getVenta(DOCTO_CC_ACR_ID);
      setVenta(data);
      setIsLoading(false);
    };

    getVentaData();
  }, [DOCTO_CC_ACR_ID]);

  return { venta, isLoading };
};

export default useGetVenta;
