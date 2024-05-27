import { useState, useEffect } from "react";
import getRutas, { Ruta } from "../../services/api/getRutas";

const useGetRutas = () => {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchRutas = async () => {
    try {
      const data = await getRutas();
      setRutas(data);
    } catch (error) {
      setError("Error al obtener las rutas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRutas();
  }, []);

  return { rutas, error, isLoading };
};

export default useGetRutas;
