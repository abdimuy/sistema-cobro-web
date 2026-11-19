import { ventaV2Http } from "@/services/api/ventaV2Types";
import { rutaImagenArchivo } from "@/services/api/getVentaArchivo";

// FuenteImagen: de dónde se descarga una imagen protegida y con qué clave se
// comparte en caché. Ventas Locales, Clientes (fotos de pago) y Desempeño
// (fotos de pago y de visita) pasan su propio descargador.
export type FuenteImagen = {
  readonly cacheKey: string;
  readonly descargar: () => Promise<Blob>;
};

export function fuenteImagenVenta(ventaId: string, imagenId: string): FuenteImagen {
  return {
    cacheKey: `venta/${ventaId}/${imagenId}`,
    descargar: async () => {
      const res = await ventaV2Http.get<Blob>(`/ventas/${ventaId}/imagenes/${imagenId}`, {
        responseType: "blob",
      });
      return res.data;
    },
  };
}

// Foto de una venta de Archivo (solo lectura). La clave lleva prefijo
// `archivo:` para no chocar con la caché de ventas de la app.
export function fuenteImagenArchivo(ventaId: string, imagenId: string): FuenteImagen {
  return {
    cacheKey: `archivo:${ventaId}/${imagenId}`,
    descargar: async () => {
      const res = await ventaV2Http.get<Blob>(rutaImagenArchivo(ventaId, imagenId), {
        responseType: "blob",
      });
      return res.data;
    },
  };
}
