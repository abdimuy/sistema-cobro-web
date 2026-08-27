import type { AxiosInstance } from "axios";
import type {
  VentaEditPort,
  HeaderInput,
  ClienteInput,
  LineasInput,
  VendedoresInput,
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
  toReemplazarLineasBody,
  toReemplazarVendedoresBody,
} from "../mappers/domainToV2Dto";
import { mapAxiosError } from "../mappers/errorMapper";
import type { VentaV2, ImagenV2 } from "../../../../services/api/ventaV2Types";

export class HttpVentaEditAdapter implements VentaEditPort {
  // El cliente se inyecta para que las pruebas puedan apuntar a un baseURL
  // propio (mismo patrón que HttpVentasListAdapter). En producción sigue
  // siendo el apiClient del módulo, con su interceptor de Firebase.
  constructor(private readonly client: AxiosInstance = apiClient) {}

  async obtenerVenta(ventaID: string): Promise<Venta> {
    try {
      const res = await this.client.get<VentaV2>(`/ventas/${ventaID}`);
      return ventaV2ToDomain(res.data);
    } catch (err) {
      throw mapAxiosError(err);
    }
  }

  async actualizarHeader(input: HeaderInput): Promise<Venta> {
    try {
      const res = await this.client.patch<VentaV2>(`/ventas/${input.ventaID}`, toActualizarHeaderBody(input));
      return ventaV2ToDomain(res.data);
    } catch (err) {
      throw mapAxiosError(err);
    }
  }

  async actualizarCliente(input: ClienteInput): Promise<Venta> {
    try {
      const res = await this.client.patch<VentaV2>(`/ventas/${input.ventaID}/cliente`, toActualizarClienteBody(input));
      return ventaV2ToDomain(res.data);
    } catch (err) {
      throw mapAxiosError(err);
    }
  }

  // PUT /v2/ventas/{id}/lineas — reemplaza combos y productos en una sola
  // transacción. Sustituye a los dos PUT separados (/combos y /productos),
  // que no podían expresar "borrar un combo y crear otro" en ningún orden.
  async reemplazarLineas(input: LineasInput): Promise<Venta> {
    try {
      const res = await this.client.put<VentaV2>(`/ventas/${input.ventaID}/lineas`, toReemplazarLineasBody(input));
      return ventaV2ToDomain(res.data);
    } catch (err) {
      throw mapAxiosError(err);
    }
  }

  async reemplazarVendedores(input: VendedoresInput): Promise<Venta> {
    try {
      const res = await this.client.put<VentaV2>(`/ventas/${input.ventaID}/vendedores`, toReemplazarVendedoresBody(input));
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
      const res = await this.client.post<ImagenV2>(`/ventas/${input.ventaID}/imagenes`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return imagenV2ToDomain(res.data);
    } catch (err) {
      throw mapAxiosError(err);
    }
  }

  async eliminarImagen(input: EliminarImagenInput): Promise<void> {
    try {
      await this.client.delete(`/ventas/${input.ventaID}/imagenes/${input.imagenID}`);
    } catch (err) {
      throw mapAxiosError(err);
    }
  }
}
