import type {
  AsignarVendedorInput,
  ConfiguracionPort,
} from "../ports/ConfiguracionPort";
import type { IdentidadMicrosip, VendedorAsignacion } from "../../domain/entities";

// FakeConfiguracionPort is a hand-rolled in-memory implementation of
// ConfiguracionPort that records every call. Hook/screen tests use it to
// assert behavior without standing up MSW or a real HTTP adapter.
export class FakeConfiguracionPort implements ConfiguracionPort {
  listarVendedoresCalls: Array<{ signal?: AbortSignal }> = [];
  listarOpcionesCalls: Array<{ signal?: AbortSignal }> = [];
  asignarVendedorCalls: Array<{ input: AsignarVendedorInput; signal?: AbortSignal }> = [];
  eliminarVendedorCalls: Array<{ usuarioId: string; signal?: AbortSignal }> = [];

  listarVendedoresResponse: VendedorAsignacion[] | (() => VendedorAsignacion[]) = [];
  listarOpcionesResponse: IdentidadMicrosip[] | (() => IdentidadMicrosip[]) = [];
  asignarVendedorResponse:
    | VendedorAsignacion
    | ((input: AsignarVendedorInput) => VendedorAsignacion) = makeFakeVendedorAsignacion();

  // When set, the next call to that method throws this error.
  throwOnNext: Partial<Record<keyof ConfiguracionPort, Error>> = {};

  async listarVendedores(signal?: AbortSignal): Promise<VendedorAsignacion[]> {
    this.listarVendedoresCalls.push({ signal });
    const e = this.takeThrow("listarVendedores");
    if (e) throw e;
    return resolve(this.listarVendedoresResponse);
  }

  async listarOpciones(signal?: AbortSignal): Promise<IdentidadMicrosip[]> {
    this.listarOpcionesCalls.push({ signal });
    const e = this.takeThrow("listarOpciones");
    if (e) throw e;
    return resolve(this.listarOpcionesResponse);
  }

  async asignarVendedor(
    input: AsignarVendedorInput,
    signal?: AbortSignal,
  ): Promise<VendedorAsignacion> {
    this.asignarVendedorCalls.push({ input, signal });
    const e = this.takeThrow("asignarVendedor");
    if (e) throw e;
    const r = this.asignarVendedorResponse;
    return typeof r === "function" ? r(input) : r;
  }

  async eliminarVendedor(usuarioId: string, signal?: AbortSignal): Promise<void> {
    this.eliminarVendedorCalls.push({ usuarioId, signal });
    const e = this.takeThrow("eliminarVendedor");
    if (e) throw e;
  }

  private takeThrow(method: keyof ConfiguracionPort): Error | undefined {
    const e = this.throwOnNext[method];
    if (e) {
      delete this.throwOnNext[method];
      return e;
    }
    return undefined;
  }
}

function resolve<T>(v: T | (() => T)): T {
  return typeof v === "function" ? (v as () => T)() : v;
}

export function makeFakeVendedorAsignacion(
  overrides: Partial<VendedorAsignacion> = {},
): VendedorAsignacion {
  const base: VendedorAsignacion = {
    usuarioId: "uid-brenda",
    nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
    email: "brenda.sanchez@muebleriamsp.mx",
    mapping: { v1: null, v2: null, v3: null },
    estado: "sin asignar",
  };
  return { ...base, ...overrides };
}

export function makeFakeIdentidadMicrosip(
  overrides: Partial<IdentidadMicrosip> = {},
): IdentidadMicrosip {
  const base: IdentidadMicrosip = {
    nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
    v1ListaId: 101,
    v2ListaId: 102,
    v3ListaId: 103,
    matchCount: 3,
  };
  return { ...base, ...overrides };
}
