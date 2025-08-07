import getPagosByVentaId from "../services/api/getPagoByVentaId";
import { useState, useEffect } from "react";
import { Pago } from "../services/api/getPagoByVentaId";

const useGetPagosByVentaId = (idVenta: number) => {
  console.log(idVenta);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getPagos = () => {
    setLoading(true);
    getPagosByVentaId(idVenta)
      .then((pagos) => {
        setPagos(pagos);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (idVenta !== 0) getPagos();
  }, [idVenta]);

  return {
    pagos,
    loading,
  };
};

export default useGetPagosByVentaId;
