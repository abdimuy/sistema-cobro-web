import { vi } from "vitest";
import type { CrearUsuarioInput, UserPort } from "../ports/UserPort";
import type { Usuario } from "../../domain/entities";

// makeFakeUsuario builds a domain Usuario with realistic defaults.
export function makeFakeUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: "usr-0001",
    firebaseUid: "fbuid-0001",
    email: "brenda.sanchez@muebleriamsp.mx",
    nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
    telefono: null,
    almacenId: null,
    activo: true,
    ...overrides,
  };
}

// FakeUserPort is a hand-rolled in-memory implementation of UserPort that
// records every call. The use-case and the CreateUser screen tests use it to
// assert behavior without standing up MSW or a real HTTP adapter.
export class FakeUserPort implements UserPort {
  crearUsuarioCalls: Array<{ input: CrearUsuarioInput; signal?: AbortSignal }> =
    [];

  crearUsuarioResponse: Usuario | ((input: CrearUsuarioInput) => Usuario) =
    makeFakeUsuario();

  // When set, the next call to that method throws this error.
  throwOnNext: Partial<Record<keyof UserPort, Error>> = {};

  // Hook opcional para observar el ORDEN de las llamadas contra otras spies
  // (p.ej. que el signOut ocurra después del alta en el API).
  onCrearUsuario = vi.fn();

  async crearUsuario(
    input: CrearUsuarioInput,
    signal?: AbortSignal,
  ): Promise<Usuario> {
    this.crearUsuarioCalls.push({ input, signal });
    this.onCrearUsuario(input);
    const e = this.takeThrow("crearUsuario");
    if (e) throw e;
    return typeof this.crearUsuarioResponse === "function"
      ? this.crearUsuarioResponse(input)
      : this.crearUsuarioResponse;
  }

  private takeThrow(key: keyof UserPort): Error | undefined {
    const e = this.throwOnNext[key];
    if (e) delete this.throwOnNext[key];
    return e;
  }
}
