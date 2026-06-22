import type { Ruta } from "../../domain/entities";
import type { RutasPort } from "../ports/RutasPort";

// FakeRutasPort is a hand-rolled in-memory implementation of RutasPort
// that records every call. Hook tests use it to assert behavior without
// standing up MSW or a real HTTP adapter.
export class FakeRutasPort implements RutasPort {
  listarCalls: Array<{ signal?: AbortSignal }> = [];

  listarResponse: Ruta[] | (() => Ruta[]) = [];

  // When set, the next listarRutas call throws this error.
  throwOnNext: Partial<Record<keyof RutasPort, Error>> = {};

  async listarRutas(signal?: AbortSignal): Promise<Ruta[]> {
    this.listarCalls.push({ signal });
    const e = this.takeThrow("listarRutas");
    if (e) throw e;
    return resolve(this.listarResponse);
  }

  private takeThrow(method: keyof RutasPort): Error | undefined {
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

export function makeFakeRuta(overrides: Partial<Ruta> = {}): Ruta {
  const base: Ruta = {
    zonaId: 3,
    zonaNombre: "ZONA CENTRO",
    cobradorNombre: "JUAN PÉREZ TORRES",
    numClientes: 48,
    saldoTotal: "125000.00",
  };
  return { ...base, ...overrides };
}
