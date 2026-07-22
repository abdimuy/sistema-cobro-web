import type { BandejaPort, ListarColaParams } from "../ports/BandejaPort";
import type {
  ConversacionDetalle,
  ConversacionResumen,
  DecisionResult,
} from "../../domain/entities";

// FakeBandejaPort is a hand-rolled in-memory implementation of BandejaPort
// that records every call. Hook tests use it to assert behavior without
// standing up MSW or a real HTTP adapter — mirrors
// configuracion/application/__tests__/fakeConfiguracionPort.ts.
export class FakeBandejaPort implements BandejaPort {
  listarColaCalls: Array<{ params?: ListarColaParams; signal?: AbortSignal }> = [];
  obtenerConversacionCalls: Array<{ clienteId: number; signal?: AbortSignal }> = [];
  aprobarCalls: Array<{ clienteId: number }> = [];
  editarCalls: Array<{ clienteId: number; texto: string }> = [];
  dictarCalls: Array<{ clienteId: number; intencion: string }> = [];
  escalarCalls: Array<{ clienteId: number; asignadoA: string }> = [];
  simularEntranteCalls: Array<{ clienteId: number; mensaje: string }> = [];

  listarColaResponse: ConversacionResumen[] | (() => Promise<ConversacionResumen[]>) = [];
  obtenerConversacionResponse:
    | ConversacionDetalle
    | (() => Promise<ConversacionDetalle>) = makeFakeConversacionDetalle();
  dictarResponse: { borrador: string } | (() => Promise<{ borrador: string }>) = {
    borrador: "borrador de prueba",
  };
  simularEntranteResponse: DecisionResult | (() => Promise<DecisionResult>) =
    makeFakeDecisionResult();

  // When set, the next call to that method throws this error.
  throwOnNext: Partial<Record<keyof BandejaPort, Error>> = {};

  async listarCola(
    params?: ListarColaParams,
    signal?: AbortSignal,
  ): Promise<ConversacionResumen[]> {
    this.listarColaCalls.push({ params, signal });
    const e = this.takeThrow("listarCola");
    if (e) throw e;
    return resolve(this.listarColaResponse);
  }

  async obtenerConversacion(
    clienteId: number,
    signal?: AbortSignal,
  ): Promise<ConversacionDetalle> {
    this.obtenerConversacionCalls.push({ clienteId, signal });
    const e = this.takeThrow("obtenerConversacion");
    if (e) throw e;
    return resolve(this.obtenerConversacionResponse);
  }

  async aprobar(clienteId: number): Promise<void> {
    this.aprobarCalls.push({ clienteId });
    const e = this.takeThrow("aprobar");
    if (e) throw e;
  }

  async editar(clienteId: number, texto: string): Promise<void> {
    this.editarCalls.push({ clienteId, texto });
    const e = this.takeThrow("editar");
    if (e) throw e;
  }

  async dictar(clienteId: number, intencion: string): Promise<{ borrador: string }> {
    this.dictarCalls.push({ clienteId, intencion });
    const e = this.takeThrow("dictar");
    if (e) throw e;
    return resolve(this.dictarResponse);
  }

  async escalar(clienteId: number, asignadoA: string): Promise<void> {
    this.escalarCalls.push({ clienteId, asignadoA });
    const e = this.takeThrow("escalar");
    if (e) throw e;
  }

  async simularEntrante(clienteId: number, mensaje: string): Promise<DecisionResult> {
    this.simularEntranteCalls.push({ clienteId, mensaje });
    const e = this.takeThrow("simularEntrante");
    if (e) throw e;
    return resolve(this.simularEntranteResponse);
  }

  private takeThrow(method: keyof BandejaPort): Error | undefined {
    const e = this.throwOnNext[method];
    if (e) {
      delete this.throwOnNext[method];
      return e;
    }
    return undefined;
  }
}

function resolve<T>(v: T | (() => T | Promise<T>)): T | Promise<T> {
  return typeof v === "function" ? (v as () => T | Promise<T>)() : v;
}

export function makeFakeConversacionResumen(
  overrides: Partial<ConversacionResumen> = {},
): ConversacionResumen {
  const base: ConversacionResumen = {
    clienteId: 1001,
    nombre: "MARÍA LÓPEZ HERNÁNDEZ",
    segmento: "recien_liquidada",
    estado: "conversando",
    asignadoA: "",
    updatedAt: "2026-07-21T10:14:00Z",
    ultimoMensaje: "¿qué tienen de comedores?",
    ultimaDecision: {
      intencion: "señal_compra",
      confianza: 0.88,
      accion: "ofrecer_comedor",
      resultado: "pendiente",
      razonEscalamiento: "",
    },
  };
  return { ...base, ...overrides };
}

export function makeFakeConversacionDetalle(
  overrides: Partial<ConversacionDetalle> = {},
): ConversacionDetalle {
  const base: ConversacionDetalle = {
    conversacion: {
      clienteId: 1001,
      nombre: "MARÍA LÓPEZ HERNÁNDEZ",
      segmento: "recien_liquidada",
      telefono: "+52 238 000 4521",
      estado: "conversando",
      asignadoA: "",
      contextoNota: "Paga puntual y completo.",
      banderas: [],
      resumenMemoria: "",
      createdAt: "2026-07-21T10:00:00Z",
      updatedAt: "2026-07-21T10:14:00Z",
    },
    turnos: [],
    decisiones: [],
  };
  return { ...base, ...overrides };
}

export function makeFakeDecisionResult(
  overrides: Partial<DecisionResult> = {},
): DecisionResult {
  const base: DecisionResult = {
    intencion: "señal_compra",
    confianza: 0.88,
    senales: [],
    accion: "ofrecer_comedor",
    borrador: "borrador de prueba",
    evidencia: [],
    razonEscalamiento: "",
    resultado: "pendiente",
    escalada: false,
  };
  return { ...base, ...overrides };
}
