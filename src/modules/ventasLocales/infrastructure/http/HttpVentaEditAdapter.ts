import type {
  VentaEditPort,
  HeaderInput,
  ClienteInput,
  ProductosInput,
  CombosInput,
  AdjuntarImagenInput,
  EliminarImagenInput,
} from "../../application/ports/VentaEditPort";
import type { Venta } from "../../domain/entities/Venta";
import type { ImagenExistente } from "../../domain/entities/Imagen";
import { apiClient } from "./apiClient";
import { ventaV2ToDomain, imagenV2ToDomain } from "../mappers/ventaV2ToDomain";
import {
  toActualizarHeaderBody,
  toActualizarClienteBody,
  toReemplazarProductosBody,
  toReemplazarCombosBody,
} from "../mappers/domainToV2Dto";
import { mapAxiosError } from "../mappers/errorMapper";
import type { VentaV2, ImagenV2 } from "../../../../services/api/ventaV2Types";

export class HttpVentaEditAdapter implements VentaEditPort {
  async obtenerVenta(ventaID: string): Promise<Venta> {
    try {
      const res = await apiClient.get<VentaV2>(`/ventas/${ventaID}`);
      return ventaV2ToDomain(res.data);
    } catch (err) {
      throw mapAxiosError(err);
    }
  }

  async actualizarHeader(input: HeaderInput): Promise<Venta> {
    try {
      const res = await apiClient.patch<VentaV2>(`/ventas/${input.ventaID}`, toActualizarHeaderBody(input));
      return ventaV2ToDomain(res.data);
    } catch (err) {
      throw mapAxiosError(err);
    }
  }

  async actualizarCliente(input: ClienteInput): Promise<Venta> {
    try {
      const res = await apiClient.patch<VentaV2>(`/ventas/${input.ventaID}/cliente`, toActualizarClienteBody(input));
      return ventaV2ToDomain(res.data);
    } catch (err) {
      throw mapAxiosError(err);
    }
  }

  async reemplazarProductos(input: ProductosInput): Promise<Venta> {
    try {
      const res = await apiClient.put<VentaV2>(`/ventas/${input.ventaID}/productos`, toReemplazarProductosBody(input));
      return ventaV2ToDomain(res.data);
    } catch (err) {
      throw mapAxiosError(err);
    }
  }

  async reemplazarCombos(input: CombosInput): Promise<Venta> {
    try {
      const res = await apiClient.put<VentaV2>(`/ventas/${input.ventaID}/combos`, toReemplazarCombosBody(input));
      return ventaV2ToDomain(res.data);
    } catch (err) {
      throw mapAxiosError(err);
    }
  }

  async adjuntarImagen(input: AdjuntarImagenInput): Promise<ImagenExistente> {
    const fd = new FormData();
    fd.append("file", input.imagen.file);
    if (input.imagen.descripcion) {
      fd.append("descripcion", input.imagen.descripcion);
    }
    try {
      const res = await apiClient.post<ImagenV2>(`/ventas/${input.ventaID}/imagenes`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return imagenV2ToDomain(res.data);
    } catch (err) {
      throw mapAxiosError(err);
    }
  }

  async eliminarImagen(input: EliminarImagenInput): Promise<void> {
    try {
      await apiClient.delete(`/ventas/${input.ventaID}/imagenes/${input.imagenID}`);
    } catch (err) {
      throw mapAxiosError(err);
    }
  }
}
