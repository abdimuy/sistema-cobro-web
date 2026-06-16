import type { AxiosInstance } from "axios";
import type { FichaCliente, VentaDetalle } from "../../domain/entities";
import type { ClientesPort } from "../../application/ports/ClientesPort";
import type {
  BuscarClientesInput,
  BuscarClientesOutput,
  ListarVentasInput,
  ListarVentasOutput,
  ObtenerVentaDetalleInput,
  RefrescarBusquedaOutput,
} from "../../application/dto";

import { dtoToCliente } from "../mappers/dtoToCliente";
import { dtoToFichaCliente } from "../mappers/dtoToFichaCliente";
import { dtoToVentaCliente } from "../mappers/dtoToVentaCliente";
import { dtoToVentaDetalle } from "../mappers/dtoToVentaDetalle";
import { apperrorToDomainError } from "../mappers/errorMapper";
import type {
  ListResponseDTO,
  BuscarClientesResponseDTO,
  FichaDTO,
  VentaListItemDTO,
  VentaDetalleDTO,
  RefrescarBusquedaResponseDTO,
} from "./dtos";

const CLIENTES_BASE = "/clientes";

// HttpClientesAdapter is the production implementation of ClientesPort.
// It talks to /v2/clientes via the provided axios client (which injects the
// Firebase Bearer token). All errors are funnelled through apperrorToDomainError
// so callers only see DomainError instances.
export class HttpClientesAdapter implements ClientesPort {
  constructor(private readonly client: AxiosInstance) {}

  async buscarClientes(
    input: BuscarClientesInput,
    signal?: AbortSignal,
  ): Promise<BuscarClientesOutput> {
    try {
      const params: Record<string, string | number | boolean> = {};
      if (input.q !== undefined) params.q = input.q;
      if (input.zona !== undefined) params.zona = input.zona;
      if (input.cobrador !== undefined) params.cobrador = input.cobrador;
      if (input.conSaldo !== undefined) params.con_saldo = input.conSaldo;
      if (input.segmento !== undefined) params.segmento = input.segmento;
      if (input.estadoPago !== undefined) params.estado_pago = input.estadoPago;
      if (input.scoreMin !== undefined) params.score_min = input.scoreMin;
      if (input.sortBy !== undefined) params.sort_by = input.sortBy;
      if (input.sortOrder !== undefined) params.sort_order = input.sortOrder;
      if (input.cursor !== undefined) params.cursor = input.cursor;
      if (input.limit !== undefined) params.limit = input.limit;

      const { data } = await this.client.get<BuscarClientesResponseDTO>(
        CLIENTES_BASE,
        { params, signal },
      );

      return {
        items: data.items.map(dtoToCliente),
        nextCursor: data.next_cursor,
        facets: data.facets ?? {},
      };
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async obtenerFicha(
    clienteId: number,
    signal?: AbortSignal,
  ): Promise<FichaCliente> {
    try {
      const { data } = await this.client.get<FichaDTO>(
        `${CLIENTES_BASE}/${clienteId}`,
        { signal },
      );

      return dtoToFichaCliente(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async listarVentas(
    input: ListarVentasInput,
    signal?: AbortSignal,
  ): Promise<ListarVentasOutput> {
    try {
      const params: Record<string, string | number> = {};
      if (input.cursor !== undefined) params.cursor = input.cursor;
      if (input.limit !== undefined) params.limit = input.limit;

      const { data } = await this.client.get<ListResponseDTO<VentaListItemDTO>>(
        `${CLIENTES_BASE}/${input.clienteId}/ventas`,
        { params, signal },
      );

      return {
        items: data.items.map(dtoToVentaCliente),
        nextCursor: data.next_cursor,
      };
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async obtenerVentaDetalle(
    input: ObtenerVentaDetalleInput,
    signal?: AbortSignal,
  ): Promise<VentaDetalle> {
    try {
      const { data } = await this.client.get<VentaDetalleDTO>(
        `${CLIENTES_BASE}/${input.clienteId}/ventas/${input.doctoPvId}`,
        { signal },
      );

      return dtoToVentaDetalle(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async refrescarBusqueda(): Promise<RefrescarBusquedaOutput> {
    try {
      const { data } = await this.client.post<RefrescarBusquedaResponseDTO>(
        `${CLIENTES_BASE}/_search/refresh`,
      );

      return {
        reindexado: data.reindexado,
        documentos: data.documentos,
      };
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }
}
