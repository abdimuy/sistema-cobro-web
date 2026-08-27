import type { AxiosInstance } from "axios";
import type { CrearUsuarioInput, UserPort } from "../../application/ports/UserPort";
import type { Usuario } from "../../domain/entities";
import type { UsuarioResponseDTO } from "./dtos";
import { domainToCrearUsuarioBody } from "../mappers/domainToCrearUsuarioBody";
import { dtoToUsuario } from "../mappers/dtoToUsuario";
import { apperrorToDomainError } from "../mappers/errorMapper";

// HttpUserAdapter is the production implementation of UserPort. It talks to
// POST /v2/usuarios via the provided axios client (which injects the Firebase
// Bearer token del ADMIN que opera la pantalla, no el del usuario recién
// creado). All errors are funnelled through apperrorToDomainError so callers
// only see DomainError instances.
export class HttpUserAdapter implements UserPort {
  constructor(private readonly client: AxiosInstance) {}

  async crearUsuario(
    input: CrearUsuarioInput,
    signal?: AbortSignal,
  ): Promise<Usuario> {
    try {
      const body = domainToCrearUsuarioBody(input);
      const { data } = await this.client.post<UsuarioResponseDTO>(
        "/usuarios",
        body,
        { signal },
      );
      return dtoToUsuario(data);
    } catch (e) {
      throw apperrorToDomainError(e);
    }
  }
}
