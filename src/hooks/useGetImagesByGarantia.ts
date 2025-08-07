import {
  getImagesByGarantia,
  ImageGarantia,
} from "../services/api/getImagesByGarantia";
import { useState, useEffect } from "react";

const useGetImagesByGarantia = (garantiaId: number) => {
  const [images, setImages] = useState<ImageGarantia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (garantiaId == 0) {
      return;
    }
    const fetchImages = async () => {
      try {
        setLoading(true);
        const data = await getImagesByGarantia(garantiaId);
        setImages(data);
      } catch (err) {
        setError("Error al obtener las imágenes de la garantía.");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [garantiaId]);

  return { images, loading, error };
};

export default useGetImagesByGarantia;
