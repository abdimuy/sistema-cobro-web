import type { AxiosInstance } from "axios";
import type { BandejaPort, ListarColaParams } from "../../application/ports/BandejaPort";
import type { ConversacionDetalle, ConversacionResumen, DecisionResult } from "../../domain/entities";
import type {
  ConversacionDetalleResponseDTO,
  DecisionResultDTO,
  DictarBodyDTO,
  DictarResponseDTO,
  EditarBodyDTO,
  EscalarBodyDTO,
  ListConversacionesResponseDTO,
  MensajeEntranteBodyDTO,
  OkResponseDTO,
} from "./dtos";
import { dtoToConversacionResumen } from "../mappers/dtoToConversacionResumen";
import { dtoToConversacionDetalle } from "../mappers/dtoToConversacionDetalle";
import { dtoToDecisionResult } from "../mappers/dtoToDecisionResult";
import { apperrorToDomainError } from "../mappers/errorMapper";

// HttpBandejaAdapter is the production implementation of BandejaPort. It
// talks to /v2/reactivacion/conversaciones* via the provided axios client
// (which injects the Firebase Bearer token). All errors are funneled through
// apperrorToDomainError so callers only see DomainError instances.
export class HttpBandejaAdapter implements BandejaPort {
  constructor(private readonly client: AxiosInstance) {}

  async listarCola(
    params?: ListarColaParams,
    signal?: AbortSignal,
  ): Promise<ConversacionResumen[]> {
    try {
      const { data } = await this.client.get<ListConversacionesResponseDTO>(
        "/reactivacion/conversaciones",
        {
          params: {
            estado: params?.estado,
            solo_escaladas: params?.soloEscaladas,
          },
          signal,
        },
      );
      return data.items.map(dtoToConversacionResumen);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async obtenerConversacion(
    clienteId: number,
    signal?: AbortSignal,
  ): Promise<ConversacionDetalle> {
    try {
      const { data } = await this.client.get<ConversacionDetalleResponseDTO>(
        `/reactivacion/conversaciones/${clienteId}`,
        { signal },
      );
      return dtoToConversacionDetalle(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async aprobar(clienteId: number): Promise<void> {
    try {
      await this.client.post<OkResponseDTO>(
        `/reactivacion/conversaciones/${clienteId}/aprobar`,
        undefined,
      );
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async editar(clienteId: number, texto: string): Promise<void> {
    try {
      const body: EditarBodyDTO = { texto };
      await this.client.post<OkResponseDTO>(
        `/reactivacion/conversaciones/${clienteId}/editar`,
        body,
      );
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async dictar(clienteId: number, intencion: string): Promise<{ borrador: string }> {
    try {
      const body: DictarBodyDTO = { intencion };
      const { data } = await this.client.post<DictarResponseDTO>(
        `/reactivacion/conversaciones/${clienteId}/dictar`,
        body,
      );
      return { borrador: data.borrador ?? "" };
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async escalar(clienteId: number, asignadoA: string): Promise<void> {
    try {
      const body: EscalarBodyDTO = { asignado_a: asignadoA };
      await this.client.post<OkResponseDTO>(
        `/reactivacion/conversaciones/${clienteId}/escalar`,
        body,
      );
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }

  async simularEntrante(clienteId: number, mensaje: string): Promise<DecisionResult> {
    try {
      const body: MensajeEntranteBodyDTO = { mensaje };
      const { data } = await this.client.post<DecisionResultDTO>(
        `/reactivacion/conversaciones/${clienteId}/mensaje-entrante`,
        body,
      );
      return dtoToDecisionResult(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }
}
