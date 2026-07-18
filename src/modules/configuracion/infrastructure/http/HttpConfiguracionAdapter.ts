import type { AxiosInstance } from "axios";
import type {
  AsignarVendedorInput,
  ConfiguracionPort,
} from "../../application/ports/ConfiguracionPort";
import type { IdentidadMicrosip, VendedorAsignacion } from "../../domain/entities";
import type {
  AsignarVendedorResponseDTO,
  OpcionesVendedorResponseDTO,
  VendedoresListResponseDTO,
} from "./dtos";
import { dtoToVendedorAsignacion } from "../mappers/dtoToVendedorAsignacion";
import { dtoToIdentidadMicrosip } from "../mappers/dtoToIdentidadMicrosip";
import { domainToAsignarBody } from "../mappers/domainToAsignarBody";
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
}
