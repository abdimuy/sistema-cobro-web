import type {
  WinbackItem,
  WinbackAttribution,
  RefreshResult,
} from "../../domain/entities";
import { Segmento, EstadoPago, Tier } from "../../domain/values";
import { DomainError } from "../../domain/errors";
import type { WinbackAnalyticsPort } from "../ports/WinbackAnalyticsPort";
import type {
  ListarWinbackInput,
  ListarWinbackOutput,
  AttributionInput,
  RefrescarInput,
} from "../dto";

// FakeWinbackPort is a hand-rolled in-memory implementation of
// WinbackAnalyticsPort that records every call. Use-case tests use it to
// assert the use case forwarded the input it received, without standing
// up MSW or a real HTTP adapter.
export class FakeWinbackPort implements WinbackAnalyticsPort {
  listarCalls: Array<{ input: ListarWinbackInput; signal?: AbortSignal }> = [];
  attributionCalls: Array<{ input: AttributionInput; signal?: AbortSignal }> =
    [];
  refrescarCalls: Array<{ input: RefrescarInput }> = [];

  listarResponse: ListarWinbackOutput | (() => ListarWinbackOutput) = {
    items: [],
  };
  attributionResponse: WinbackAttribution | (() => WinbackAttribution) =
    makeFakeAttribution();
  refrescarResponse: RefreshResult | (() => RefreshResult) = {
    estado: "iniciado",
    mensaje: "refresh enqueued",
  };

  // When set, the next call to the matching method throws this error.
  throwOnNext: Partial<Record<keyof WinbackAnalyticsPort, Error>> = {};

  async listarItems(
    input: ListarWinbackInput,
    signal?: AbortSignal,
  ): Promise<ListarWinbackOutput> {
    this.listarCalls.push({ input, signal });
    const e = this.takeThrow("listarItems");
    if (e) throw e;
    return resolve(this.listarResponse);
  }

  async obtenerAttribution(
    input: AttributionInput,
    signal?: AbortSignal,
  ): Promise<WinbackAttribution> {
    this.attributionCalls.push({ input, signal });
    const e = this.takeThrow("obtenerAttribution");
    if (e) throw e;
    return resolve(this.attributionResponse);
  }

  async refrescar(input: RefrescarInput): Promise<RefreshResult> {
    this.refrescarCalls.push({ input });
    const e = this.takeThrow("refrescar");
    if (e) throw e;
    return resolve(this.refrescarResponse);
  }

  private takeThrow(
    method: keyof WinbackAnalyticsPort,
  ): Error | undefined {
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

// Helper: assert that VO.create returned the VO, not a DomainError.
function mustCreate<T>(v: T | DomainError): T {
  if (v instanceof DomainError) {
    throw new Error(`VO.create failed unexpectedly: ${v.message}`);
  }
  return v;
}

export function makeFakeWinbackItem(
  overrides: Partial<WinbackItem> = {},
): WinbackItem {
  const base: WinbackItem = {
    clienteId: 1001,
    nombre: "MUEBLES HERNANDEZ SA",
    zona: "ZONA_NORTE",
    telefono: "5512345678",
    fechaUltimaCompra: new Date("2025-09-01T00:00:00.000Z"),
    recenciaDias: 180,
    frecuencia: 4,
    monetary: "25000.00",
    saldo: "5000.00",
    porLiquidarPct: "0.20",
    nextBestProduct: "SALA",
    segmento: mustCreate(Segmento.create("DORMIDO_VALIOSO")),
    score: 72,
    enControl: false,
    estadoPago: mustCreate(EstadoPago.create("AL_CORRIENTE")),
    fechaUltimoPago: new Date("2025-09-15T00:00:00.000Z"),
    etiqueta: "Recuperable",
    resumen: "Cliente de alto valor sin compras recientes",
    tier: mustCreate(Tier.create("A")),
  };
  return { ...base, ...overrides };
}

export function makeFakeAttribution(
  overrides: Partial<WinbackAttribution> = {},
): WinbackAttribution {
  const base: WinbackAttribution = {
    treatmentTotal: 50,
    treatmentConvertidos: 20,
    controlTotal: 50,
    controlConvertidos: 10,
    tasaTreatment: "0.40",
    tasaControl: "0.20",
    uplift: "0.20",
  };
  return { ...base, ...overrides };
}
