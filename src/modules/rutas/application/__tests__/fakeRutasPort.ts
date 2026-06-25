import type {
  ProductoVenta,
  ReporteUsuario,
  Ruta,
  VentaCobranza,
} from "../../domain/entities";
import type { DesgloseCobranza, RutasPort } from "../ports/RutasPort";

const EMPTY_DESGLOSE: DesgloseCobranza = {
  fechaInicioSemana: null,
  ventas: [],
  resumen: { numerador: "0", denominador: 0, pctPonderado: null },
};

// FakeRutasPort is a hand-rolled in-memory implementation of RutasPort
// that records every call. Hook tests use it to assert behavior without
// standing up MSW or a real HTTP adapter.
export class FakeRutasPort implements RutasPort {
  listarCalls: Array<{ signal?: AbortSignal }> = [];
  reporteUsuariosCalls: Array<{ signal?: AbortSignal }> = [];
  desgloseCalls: Array<{ zonaId: number; signal?: AbortSignal }> = [];
  desglosePorUsuarioCalls: Array<{ uid: string; signal?: AbortSignal }> = [];
  productosCalls: Array<{ clienteId: number; doctoPvId: number; signal?: AbortSignal }> = [];

  listarResponse: Ruta[] | (() => Ruta[]) = [];
  reporteUsuariosResponse: ReporteUsuario[] | (() => ReporteUsuario[]) = [];
  productosResponse: ProductoVenta[] | (() => Promise<ProductoVenta[]>) = [];
  desgloseResponse:
    | DesgloseCobranza
    | (() => Promise<DesgloseCobranza>) = EMPTY_DESGLOSE;
  desglosePorUsuarioResponse:
    | DesgloseCobranza
    | (() => Promise<DesgloseCobranza>) = EMPTY_DESGLOSE;

  // When set, the next call to that method throws this error.
  throwOnNext: Partial<Record<keyof RutasPort, Error>> = {};

  async listarRutas(signal?: AbortSignal): Promise<Ruta[]> {
    this.listarCalls.push({ signal });
    const e = this.takeThrow("listarRutas");
    if (e) throw e;
    return resolve(this.listarResponse);
  }

  async listarReporteUsuarios(signal?: AbortSignal): Promise<ReporteUsuario[]> {
    this.reporteUsuariosCalls.push({ signal });
    const e = this.takeThrow("listarReporteUsuarios");
    if (e) throw e;
    return resolve(this.reporteUsuariosResponse);
  }

  async desgloseCobranza(
    zonaId: number,
    signal?: AbortSignal,
  ): Promise<DesgloseCobranza> {
    this.desgloseCalls.push({ zonaId, signal });
    const e = this.takeThrow("desgloseCobranza");
    if (e) throw e;
    const r = this.desgloseResponse;
    return typeof r === "function" ? r() : r;
  }

  async desgloseCobranzaPorUsuario(
    uid: string,
    signal?: AbortSignal,
  ): Promise<DesgloseCobranza> {
    this.desglosePorUsuarioCalls.push({ uid, signal });
    const e = this.takeThrow("desgloseCobranzaPorUsuario");
    if (e) throw e;
    const r = this.desglosePorUsuarioResponse;
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

export function makeFakeReporteUsuario(
  overrides: Partial<ReporteUsuario> = {},
): ReporteUsuario {
  const base: ReporteUsuario = {
    uid: "uid-juan",
    nombre: "JUAN PÉREZ TORRES",
    email: "juan.perez@muebleriamsp.mx",
    cobradorId: 12,
    zonaId: 3,
    zonaNombre: "ZONA CENTRO",
    numClientes: 48,
    saldoTotal: "125000.00",
    pctCoberturaSemanal: "89.50",
    pctPonderadoSemanal: "92.30",
    fechaInicioSemana: "2026-06-16T00:00:00Z",
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
