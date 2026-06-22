import type { AxiosInstance } from "axios";
import type { RutasPort } from "../../application/ports/RutasPort";
import type { Ruta } from "../../domain/entities";
import type { RutasListResponseDTO } from "./dtos";
import { dtoToRuta } from "../mappers/dtoToRuta";
import { apperrorToDomainError } from "../mappers/errorMapper";

// HttpRutasAdapter is the production implementation of RutasPort.
// It talks to /v2/rutas via the provided axios client (which injects
// the Firebase Bearer token). All errors are funneled through
// apperrorToDomainError so callers only see DomainError instances.
export class HttpRutasAdapter implements RutasPort {
  constructor(private readonly client: AxiosInstance) {}

  async listarRutas(signal?: AbortSignal): Promise<Ruta[]> {
    try {
      const { data } = await this.client.get<RutasListResponseDTO>("/rutas", {
        signal,
      });
      return data.items.map(dtoToRuta);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }
}
