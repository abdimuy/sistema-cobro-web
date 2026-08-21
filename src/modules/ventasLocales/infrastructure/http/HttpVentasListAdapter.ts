import type { AxiosInstance } from "axios";
import type { VentasListPort } from "../../application/ports/VentasListPort";
import type { BuscarVentasInput } from "../../application/dto/BuscarVentasInput";
import type { BuscarVentasOutput } from "../../application/dto/BuscarVentasOutput";
import {
  adaptVentaV2ToLocal,
  type VentaV2DTO,
  type ListV2Response,
} from "../../../../services/api/getVentasLocales";
import { mapAxiosError } from "../mappers/errorMapper";
import { rangoDeDiasDeNegocio } from "@/utils/tiempoDeNegocio";

const VENTAS_BASE = "/ventas";

// HttpVentasListAdapter is the production implementation of VentasListPort.
// It talks to GET /v2/ventas via the provided axios client. Every field is
// mapped to its pinned snake_case backend name and only sent when defined —
// this is the fix for the original bug where getVentasLocales silently
// dropped most UI filters. almacenId (and other UI-only fields carried on
// BuscarVentasInput for compatibility) is intentionally never forwarded:
// the backend has no filter for it.
export class HttpVentasListAdapter implements VentasListPort {
  constructor(private readonly client: AxiosInstance) {}

  async buscarVentas(
    input: BuscarVentasInput,
    signal?: AbortSignal,
  ): Promise<BuscarVentasOutput> {
    try {
      const params: Record<string, string | number | boolean> = {};
      if (input.search !== undefined) params.search = input.search;
      if (input.tipoVenta !== undefined) params.tipo_venta = input.tipoVenta;
      if (input.situacion !== undefined) params.situacion = input.situacion;
      if (input.sincronizacion !== undefined) params.sincronizacion = input.sincronizacion;
      if (input.zonaClienteId !== undefined) params.zona_cliente_id = input.zonaClienteId;
      if (input.vendedorEmail !== undefined) params.vendedor_email = input.vendedorEmail;
      if (input.precioMin !== undefined) params.precio_min = input.precioMin;
      if (input.precioMax !== undefined) params.precio_max = input.precioMax;
      // El backend exige RFC3339 estricto y trata desde/hasta como
      // [desde, hasta): FECHA_VENTA >= desde (inclusivo) y < hasta (exclusivo).
      //
      // El usuario elige DÍAS DE CALENDARIO en un picker; el API compara
      // INSTANTES. Traducir entre las dos cosas es exactamente el trabajo de
      // `rangoDeDiasDeNegocio`, anclado a la zona del negocio y no a la del
      // navegador (docs/module-standards/DATETIME_HANDLING.md).
      //
      // Antes se mandaban medianoches UTC, que es medio día corrido: filtrar
      // "20 ago" devolvía 5 ventas de 7 —las de 18:15 y 18:18 caían ya en el
      // día UTC siguiente— y colaba las de la tarde-noche del día anterior.
      if (input.fechaInicio !== undefined || input.fechaFin !== undefined) {
        const primerDia = input.fechaInicio ?? input.fechaFin!;
        const ultimoDia = input.fechaFin ?? input.fechaInicio!;
        const rango = rangoDeDiasDeNegocio(primerDia, ultimoDia);
        if (input.fechaInicio !== undefined) params.desde = rango.desde;
        if (input.fechaFin !== undefined) params.hasta = rango.hasta;
      }
      if (input.incluirCanceladas !== undefined) params.incluir_canceladas = input.incluirCanceladas;
      if (input.sortBy !== undefined) params.sort_by = input.sortBy;
      if (input.sortOrder !== undefined) params.sort_order = input.sortOrder;
      if (input.cursor !== undefined) params.cursor = input.cursor;
      if (input.limit !== undefined) params.limit = input.limit;

      const { data } = await this.client.get<ListV2Response<VentaV2DTO>>(
        VENTAS_BASE,
        { params, signal },
      );

      return {
        items: data.items.map(adaptVentaV2ToLocal),
        // El backend omite next_cursor en la última página (json omitempty),
        // así que un campo ausente significa "no hay más" → "".
        nextCursor: data.next_cursor ?? "",
      };
    } catch (e) {
      throw mapAxiosError(e);
    }
  }
}
