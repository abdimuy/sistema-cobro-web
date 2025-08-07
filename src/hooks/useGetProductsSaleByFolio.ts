import getProductsSaleByFolio from "../services/api/getProductsSaleByFolio";
import { useState, useEffect } from "react";
import { ProductSale } from "../services/api/getProductsSaleByFolio";

const useGetProductsSaleByFolio = (folio: string) => {
  const [products, setProducts] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!folio) {
        setProducts([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getProductsSaleByFolio(folio);
        setProducts(data);
      } catch (err) {
        setError("Error al obtener los productos de la venta.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [folio]);

  return { products, loading, error };
};

export default useGetProductsSaleByFolio;
