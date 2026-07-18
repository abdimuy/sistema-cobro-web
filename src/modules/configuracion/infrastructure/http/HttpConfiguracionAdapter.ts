import type { AxiosInstance } from "axios";
import type {
  AsignarVendedorInput,
  AsignarZonaCajaInput,
  ConfiguracionPort,
} from "../../application/ports/ConfiguracionPort";
import type {
  IdentidadMicrosip,
  OpcionesZonasCajas,
  VendedorAsignacion,
  ZonaCajaAsignacion,
} from "../../domain/entities";
import type {
  AsignarVendedorResponseDTO,
  AsignarZonaCajaResponseDTO,
  OpcionesVendedorResponseDTO,
  OpcionesZonasCajasDTO,
  VendedoresListResponseDTO,
  ZonasCajasListResponseDTO,
} from "./dtos";
import { dtoToVendedorAsignacion } from "../mappers/dtoToVendedorAsignacion";
import { dtoToIdentidadMicrosip } from "../mappers/dtoToIdentidadMicrosip";
import { domainToAsignarBody } from "../mappers/domainToAsignarBody";
import { dtoToZonaCajaAsignacion } from "../mappers/dtoToZonaCajaAsignacion";
import { dtoToOpcionesZonasCajas } from "../mappers/dtoToOpcionesZonasCajas";
import { domainToAsignarZonaCajaBody } from "../mappers/domainToAsignarZonaCajaBody";
import { apperrorToDomainError } from "../mappers/errorMapper";

// HttpConfiguracionAdapter is the production implementation of
// ConfiguracionPort. It talks to /v2/config/vendedores* via the provided
// axios client (which injects the Firebase Bearer token). All errors are
// funneled through apperrorToDomainError so callers only see DomainError
// instances.
export class HttpConfiguracionAdapter implements ConfiguracionPort {
  constructor(private readonly client: AxiosInstance) {}

  async listarVendedores(signal?: AbortSignal): Promise<VendedorAsignacion[]> {
    try {
      const { data } = await this.client.get<VendedoresListResponseDTO>(
        "/config/vendedores",
        { signal },
      );
      return data.items.map(dtoToVendedorAsignacion);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async listarOpciones(signal?: AbortSignal): Promise<IdentidadMicrosip[]> {
    try {
      const { data } = await this.client.get<OpcionesVendedorResponseDTO>(
        "/config/vendedores/opciones",
        { signal },
      );
      return data.items.map(dtoToIdentidadMicrosip);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async asignarVendedor(
    input: AsignarVendedorInput,
    signal?: AbortSignal,
  ): Promise<VendedorAsignacion> {
    try {
      const body = domainToAsignarBody(input);
      const { data } = await this.client.put<AsignarVendedorResponseDTO>(
        `/config/vendedores/${encodeURIComponent(input.usuarioId)}`,
        body,
        { signal },
      );
      return dtoToVendedorAsignacion(data.item);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async eliminarVendedor(usuarioId: string, signal?: AbortSignal): Promise<void> {
    try {
      await this.client.delete(
        `/config/vendedores/${encodeURIComponent(usuarioId)}`,
        { signal },
      );
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async listarZonasCajas(signal?: AbortSignal): Promise<ZonaCajaAsignacion[]> {
    try {
      const { data } = await this.client.get<ZonasCajasListResponseDTO>(
        "/config/zonas-cajas",
        { signal },
      );
      return data.items.map(dtoToZonaCajaAsignacion);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async listarOpcionesZonasCajas(signal?: AbortSignal): Promise<OpcionesZonasCajas> {
    try {
      const { data } = await this.client.get<OpcionesZonasCajasDTO>(
        "/config/zonas-cajas/opciones",
        { signal },
      );
      return dtoToOpcionesZonasCajas(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async asignarZonaCaja(
    input: AsignarZonaCajaInput,
    signal?: AbortSignal,
  ): Promise<ZonaCajaAsignacion> {
    try {
      const body = domainToAsignarZonaCajaBody(input);
      const { data } = await this.client.put<AsignarZonaCajaResponseDTO>(
        `/config/zonas-cajas/${encodeURIComponent(String(input.zonaClienteId))}`,
        body,
        { signal },
      );
      return dtoToZonaCajaAsignacion(data.item);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }
}
