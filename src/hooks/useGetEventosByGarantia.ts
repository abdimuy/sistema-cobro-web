import getEventosByGarantia from "../services/api/getEventosByGarantia";
import { useState, useEffect } from "react";
import { Evento } from "../services/api/getEventosByGarantia";

const useGetEventosByGarantia = (garantiaId: number) => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEventos = async () => {
    try {
      const data = await getEventosByGarantia(garantiaId);
      setEventos(data);
    } catch (err) {
      setError("Error al obtener los eventos de la garantía.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, [garantiaId]);

  return { eventos, loading, error, refetch: fetchEventos };
};

export default useGetEventosByGarantia;
