import axios, { AxiosError } from "axios";
import { URL_API } from "../../constants/api";

const BASE_URL = URL_API;

// ============================================================================
// Types
// ============================================================================

export interface ProductoVentaEdicion {
  articuloId: number;
  articulo: string;
  cantidad: number;
  precioLista: number;
  precioCortoPlazo: number;
  precioContado: number;
}

export interface DatosVentaLocal {
  userEmail: string;
  nombreCliente: string;
  fechaVenta: string;
  latitud: number;
  longitud: number;
  direccion: string;
  numero?: string;
  colonia?: string;
  poblacion?: string;
  ciudad?: string;
  telefono: string;
  parcialidad?: number;
  enganche?: number;
  frecPago?: string;
  diaCobranza?: string;
  avalOResponsable?: string;
  nota?: string;
  precioTotal: number;
  tiempoACortoPlazoMeses?: number;
  montoACortoPlazo?: number;
  tipoVenta?: string;
  zonaClienteId?: number;
  almacenOrigenId: number;
  almacenDestinoId: number;
  productos: ProductoVentaEdicion[];
  imagenesAEliminar?: string[];
}

export interface ImagenNueva {
  id: string;
  file: File;
  descripcion: string;
}

export interface UpdateVentaLocalRequest {
  localSaleId: string;
  datos: DatosVentaLocal;
  imagenesNuevas?: ImagenNueva[];
}

export interface CambiosProductos {
  devueltos: number;
  agregados: number;
  sinCambios: boolean;
}

export interface UpdateVentaLocalResponse {
  success: boolean;
  localSaleId: string;
  mensaje: string;
  productosActualizados: number;
  cambiosProductos: CambiosProductos;
  imagenesEliminadas: number;
  imagenesAgregadas: number;
  almacenOrigenId: number;
  almacenDestinoId: number;
}

export interface UpdateVentaLocalError {
  error: string;
  details?: string;
  tipo?: "ERROR_PARAMETROS" | "ERROR_STOCK_INSUFICIENTE" | "ERROR_ARTICULO_NO_EXISTE";
}

// ============================================================================
// API Function
// ============================================================================

export const updateVentaLocal = async (
  request: UpdateVentaLocalRequest
): Promise<UpdateVentaLocalResponse> => {
  const { localSaleId, datos, imagenesNuevas = [] } = request;

  const formData = new FormData();

  // Agregar datos JSON
  formData.append("datos", JSON.stringify(datos));

  // Agregar imágenes nuevas con sus IDs y descripciones
  imagenesNuevas.forEach((imagen, index) => {
    formData.append("imagenes", imagen.file);
    formData.append(`id_${index}`, imagen.id);
    formData.append(`descripcion_${index}`, imagen.descripcion);
  });

  try {
    const response = await axios.put<UpdateVentaLocalResponse>(
      `${BASE_URL}/ventas-locales/${localSaleId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<UpdateVentaLocalError>;
      const errorData = axiosError.response?.data;

      if (errorData?.details) {
        try {
          const detailsParsed = JSON.parse(errorData.details);
          throw new UpdateVentaError(
            errorData.error,
            detailsParsed.tipo,
            detailsParsed.detalles
          );
        } catch (parseError) {
          if (parseError instanceof UpdateVentaError) {
            throw parseError;
          }
          throw new UpdateVentaError(
            errorData?.error || "Error al actualizar la venta",
            undefined,
            undefined
          );
        }
      }

      throw new UpdateVentaError(
        errorData?.error || "Error al actualizar la venta",
        errorData?.tipo,
        undefined
      );
    }

    throw new UpdateVentaError("Error de conexión al actualizar la venta");
  }
};

// ============================================================================
// Custom Error Class
// ============================================================================

export class UpdateVentaError extends Error {
  public tipo?: string;
  public detalles?: string[];

  constructor(message: string, tipo?: string, detalles?: string[]) {
    super(message);
    this.name = "UpdateVentaError";
    this.tipo = tipo;
    this.detalles = detalles;
  }

  get isStockError(): boolean {
    return this.tipo === "ERROR_STOCK_INSUFICIENTE";
  }

  get isValidationError(): boolean {
    return this.tipo === "ERROR_PARAMETROS";
  }

  get isArticuloError(): boolean {
    return this.tipo === "ERROR_ARTICULO_NO_EXISTE";
  }
}
