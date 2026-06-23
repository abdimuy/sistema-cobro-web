import type { ProductoVenta, Ruta, VentaCobranza } from "../../domain/entities";
import type { RutasPort } from "../ports/RutasPort";

// FakeRutasPort is a hand-rolled in-memory implementation of RutasPort
// that records every call. Hook tests use it to assert behavior without
// standing up MSW or a real HTTP adapter.
export class FakeRutasPort implements RutasPort {
  listarCalls: Array<{ signal?: AbortSignal }> = [];
  desgloseCalls: Array<{ zonaId: number; signal?: AbortSignal }> = [];
  productosCalls: Array<{ clienteId: number; doctoPvId: number; signal?: AbortSignal }> = [];

  listarResponse: Ruta[] | (() => Ruta[]) = [];
  productosResponse: ProductoVenta[] | (() => Promise<ProductoVenta[]>) = [];
  desgloseResponse:
    | { fechaInicioSemana: string | null; ventas: VentaCobranza[]; resumen: { numerador: string; denominador: number; pctPonderado: string | null } }
    | (() => Promise<{ fechaInicioSemana: string | null; ventas: VentaCobranza[]; resumen: { numerador: string; denominador: number; pctPonderado: string | null } }>) = {
    fechaInicioSemana: null,
    ventas: [],
    resumen: { numerador: "0", denominador: 0, pctPonderado: null },
  };

  // When set, the next call to that method throws this error.
  throwOnNext: Partial<Record<keyof RutasPort, Error>> = {};

  async listarRutas(signal?: AbortSignal): Promise<Ruta[]> {
    this.listarCalls.push({ signal });
    const e = this.takeThrow("listarRutas");
    if (e) throw e;
    return resolve(this.listarResponse);
  }

  async desgloseCobranza(
    zonaId: number,
    signal?: AbortSignal,
  ): Promise<{ fechaInicioSemana: string | null; ventas: VentaCobranza[]; resumen: { numerador: string; denominador: number; pctPonderado: string | null } }> {
    this.desgloseCalls.push({ zonaId, signal });
    const e = this.takeThrow("desgloseCobranza");
    if (e) throw e;
    const r = this.desgloseResponse;
    return typeof r === "function" ? r() : r;
  }

  async obtenerProductos(
    clienteId: number,
    doctoPvId: number,
    signal?: AbortSignal,
  ): Promise<ProductoVenta[]> {
    this.productosCalls.push({ clienteId, doctoPvId, signal });
    const e = this.takeThrow("obtenerProductos");
    if (e) throw e;
    const r = this.productosResponse;
    return typeof r === "function" ? r() : r;
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
    pctCoberturaSemanal: null,
    pctPonderadoSemanal: null,
    fechaInicioSemana: null,
  };
  return { ...base, ...overrides };
}

export function makeFakeVentaCobranza(overrides: Partial<VentaCobranza> = {}): VentaCobranza {
  const base: VentaCobranza = {
    ventaId: 1001,
    clienteId: 5,
    clienteNombre: "JUAN PÉREZ TORRES",
    folio: "A-1001",
    doctoPvId: 555,
    parcialidad: "3",
    frecuencia: "SEMANAL",
    abonoSemana: "500.00",
    vencidas: "0.50",
    aporte: "0.85",
    saldo: "4200.00",
    aplicaPonderado: true,
    atrasoAntesCuotas: "2",
    atrasoAntesPesos: "200.00",
    pagoCuotas: "1",
    atrasoDespuesCuotas: "1",
    atrasoDespuesPesos: "100.00",
  };
  return { ...base, ...overrides };
}
