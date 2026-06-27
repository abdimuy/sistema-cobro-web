import type { CarteraPort } from "../ports/CarteraPort";
import type { CarteraFilters } from "../dto/CarteraFilters";
import type {
  SaludCartera,
  AgingBucket,
  Cosecha,
  CobradorPerformance,
  CuentaRiesgo,
  RollRate,
} from "../../domain/entities";

// FakeCarteraPort is a hand-rolled in-memory implementation of CarteraPort.
// Use-case and hook tests use it to assert correct forwarding without
// standing up MSW or a real HTTP adapter.
export class FakeCarteraPort implements CarteraPort {
  saludCalls: Array<{ filters: CarteraFilters; signal?: AbortSignal }> = [];
  agingCalls: Array<{ filters: CarteraFilters; signal?: AbortSignal }> = [];
  cosechasCalls: Array<{ filters: CarteraFilters; signal?: AbortSignal }> = [];
  cobradoresCalls: Array<{ filters: CarteraFilters; signal?: AbortSignal }> = [];
  cuentasRiesgoCalls: Array<{ filters: CarteraFilters; signal?: AbortSignal }> = [];
  rollRateCalls: Array<{ filters: CarteraFilters; signal?: AbortSignal }> = [];

  saludResponse: SaludCartera | (() => SaludCartera) = makeFakeSaludCartera();
  agingResponse: AgingBucket[] | (() => AgingBucket[]) = [];
  cosechasResponse: Cosecha[] | (() => Cosecha[]) = [];
  cobradoresResponse: CobradorPerformance[] | (() => CobradorPerformance[]) = [];
  cuentasRiesgoResponse: CuentaRiesgo[] | (() => CuentaRiesgo[]) = [];
  rollRateResponse: RollRate | (() => RollRate) = makeFakeRollRate();

  throwOnNext: Partial<Record<keyof CarteraPort, Error>> = {};

  async obtenerSalud(filters: CarteraFilters, signal?: AbortSignal): Promise<SaludCartera> {
    this.saludCalls.push({ filters, signal });
    const e = this.takeThrow("obtenerSalud");
    if (e) throw e;
    return resolve(this.saludResponse);
  }

  async obtenerAging(filters: CarteraFilters, signal?: AbortSignal): Promise<AgingBucket[]> {
    this.agingCalls.push({ filters, signal });
    const e = this.takeThrow("obtenerAging");
    if (e) throw e;
    return resolve(this.agingResponse);
  }

  async obtenerCosechas(filters: CarteraFilters, signal?: AbortSignal): Promise<Cosecha[]> {
    this.cosechasCalls.push({ filters, signal });
    const e = this.takeThrow("obtenerCosechas");
    if (e) throw e;
    return resolve(this.cosechasResponse);
  }

  async obtenerCobradores(filters: CarteraFilters, signal?: AbortSignal): Promise<CobradorPerformance[]> {
    this.cobradoresCalls.push({ filters, signal });
    const e = this.takeThrow("obtenerCobradores");
    if (e) throw e;
    return resolve(this.cobradoresResponse);
  }

  async obtenerCuentasRiesgo(filters: CarteraFilters, signal?: AbortSignal): Promise<CuentaRiesgo[]> {
    this.cuentasRiesgoCalls.push({ filters, signal });
    const e = this.takeThrow("obtenerCuentasRiesgo");
    if (e) throw e;
    return resolve(this.cuentasRiesgoResponse);
  }

  async obtenerRollRate(filters: CarteraFilters, signal?: AbortSignal): Promise<RollRate> {
    this.rollRateCalls.push({ filters, signal });
    const e = this.takeThrow("obtenerRollRate");
    if (e) throw e;
    return resolve(this.rollRateResponse);
  }

  private takeThrow(method: keyof CarteraPort): Error | undefined {
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

export function makeFakeSaludCartera(
  overrides: Partial<SaludCartera> = {},
): SaludCartera {
  const base: SaludCartera = {
    saldoTotal: "500000.00",
    saldoMoroso: "75000.00",
    par: "0.15",
    ceiRate: "0.82",
    importeColectado: "120000.00",
    cuentasTotal: 200,
    cuentasEnMora: 30,
    margenRealProxy: "63360.00",
  };
  return { ...base, ...overrides };
}

export function makeFakeAgingBucket(
  overrides: Partial<AgingBucket> = {},
): AgingBucket {
  const base: AgingBucket = {
    bucket: "0-30",
    saldo: "50000.00",
    conteo: 20,
    pctSaldo: "0.10",
  };
  return { ...base, ...overrides };
}

export function makeFakeCosecha(
  overrides: Partial<Cosecha> = {},
): Cosecha {
  const base: Cosecha = {
    cohortMonth: 202501,
    ageMonths: 6,
    saldo: "30000.00",
    conteo: 15,
  };
  return { ...base, ...overrides };
}

export function makeFakeCobradorPerformance(
  overrides: Partial<CobradorPerformance> = {},
): CobradorPerformance {
  const base: CobradorPerformance = {
    cobradorId: 1,
    zonaClienteId: 10,
    cei: "0.85",
    par: "0.12",
    pctCorriente: "0.88",
    saldoTotal: "100000.00",
    saldoMoroso: "12000.00",
    cuentasTotal: 50,
    importeColectado: "30000.00",
  };
  return { ...base, ...overrides };
}

export function makeFakeCuentaRiesgo(
  overrides: Partial<CuentaRiesgo> = {},
): CuentaRiesgo {
  const base: CuentaRiesgo = {
    clienteId: 1001,
    nombre: "MUEBLES HERNANDEZ SA",
    zona: "ZONA_NORTE",
    tierRiesgo: "EN_RIESGO",
    segmento: "DORMIDO_VALIOSO",
    estadoPago: "MOROSO",
    saldo: "15000.00",
    diasAtrasoProm: 45,
    pctPagosATiempo: "60.00",
    cadenciaDias: 30,
    fechaUltimoPago: new Date("2025-10-01T00:00:00Z"),
    fechaProxPago: new Date("2025-11-01T00:00:00Z"),
  };
  return { ...base, ...overrides };
}

export function makeFakeRollRate(
  overrides: Partial<RollRate> = {},
): RollRate {
  const base: RollRate = {
    disponible: true,
    rollRate: 0.08,
    fechaCorteAnterior: new Date("2025-09-30T00:00:00Z"),
    fechaCorteReciente: new Date("2025-10-31T00:00:00Z"),
  };
  return { ...base, ...overrides };
}
