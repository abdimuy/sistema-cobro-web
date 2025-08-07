import { useState, useEffect } from "react";
import getZonasCliente, {
  ZonaCliente,
} from "../../services/api/getZonasCliente";

const useGetZonasCliente = () => {
  const [zonasCliente, setZonasCliente] = useState<ZonaCliente[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchRutas = async () => {
    try {
      const data = await getZonasCliente();
      setZonasCliente(data);
    } catch (error) {
      setError("Error al obtener las zonas de los clientes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRutas();
  }, []);

  return { zonasCliente, error, isLoading };
};

export default useGetZonasCliente;
