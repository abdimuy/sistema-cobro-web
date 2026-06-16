import type {
  Cliente,
  FichaCliente,
  VentaCliente,
  VentaDetalle,
  ProductoVenta,
  Pago,
} from "../../domain/entities";
import type { ClientesPort } from "../ports/ClientesPort";
import type {
  BuscarClientesInput,
  BuscarClientesOutput,
  ListarVentasInput,
  ListarVentasOutput,
  ObtenerVentaDetalleInput,
  RefrescarBusquedaOutput,
} from "../dto";

// FakeClientesPort is a hand-rolled in-memory implementation of ClientesPort
// that records every call. Use-case tests use it to assert the use case
// forwarded the input it received, without standing up MSW or a real HTTP
// adapter.
export class FakeClientesPort implements ClientesPort {
  buscarCalls: Array<{ input: BuscarClientesInput; signal?: AbortSignal }> = [];
  fichaCalls: Array<{ clienteId: number; signal?: AbortSignal }> = [];
  listarVentasCalls: Array<{ input: ListarVentasInput; signal?: AbortSignal }> =
    [];
  obtenerDetalleCalls: Array<{
    input: ObtenerVentaDetalleInput;
    signal?: AbortSignal;
  }> = [];
  refrescarCalls: Array<Record<string, never>> = [];

  buscarResponse: BuscarClientesOutput | (() => BuscarClientesOutput) = {
    items: [],
    nextCursor: "",
    facets: {},
  };
  fichaResponse: FichaCliente | (() => FichaCliente) = makeFakeFichaCliente();
  listarVentasResponse:
    | ListarVentasOutput
    | (() => ListarVentasOutput) = {
    items: [],
    nextCursor: "",
  };
  obtenerDetalleResponse: VentaDetalle | (() => VentaDetalle) =
    makeFakeVentaDetalle();
  refrescarResponse:
    | RefrescarBusquedaOutput
    | (() => RefrescarBusquedaOutput) = {
    reindexado: true,
    documentos: 0,
  };

  // When set, the next call to the matching method throws this error.
  throwOnNext: Partial<Record<keyof ClientesPort, Error>> = {};

  async buscarClientes(
    input: BuscarClientesInput,
    signal?: AbortSignal,
  ): Promise<BuscarClientesOutput> {
    this.buscarCalls.push({ input, signal });
    const e = this.takeThrow("buscarClientes");
    if (e) throw e;
    return resolve(this.buscarResponse);
  }

  async obtenerFicha(
    clienteId: number,
    signal?: AbortSignal,
  ): Promise<FichaCliente> {
    this.fichaCalls.push({ clienteId, signal });
    const e = this.takeThrow("obtenerFicha");
    if (e) throw e;
    return resolve(this.fichaResponse);
  }

  async listarVentas(
    input: ListarVentasInput,
    signal?: AbortSignal,
  ): Promise<ListarVentasOutput> {
    this.listarVentasCalls.push({ input, signal });
    const e = this.takeThrow("listarVentas");
    if (e) throw e;
    return resolve(this.listarVentasResponse);
  }

  async obtenerVentaDetalle(
    input: ObtenerVentaDetalleInput,
    signal?: AbortSignal,
  ): Promise<VentaDetalle> {
    this.obtenerDetalleCalls.push({ input, signal });
    const e = this.takeThrow("obtenerVentaDetalle");
    if (e) throw e;
    return resolve(this.obtenerDetalleResponse);
  }

  async refrescarBusqueda(): Promise<RefrescarBusquedaOutput> {
    this.refrescarCalls.push({});
    const e = this.takeThrow("refrescarBusqueda");
    if (e) throw e;
    return resolve(this.refrescarResponse);
  }

  private takeThrow(method: keyof ClientesPort): Error | undefined {
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

// ---------------------------------------------------------------------------
// Fixture builders — realistic Mexican-Spanish data
// ---------------------------------------------------------------------------

export function makeFakeCliente(overrides: Partial<Cliente> = {}): Cliente {
  const base: Cliente = {
    clienteId: 1042,
    nombre: "MUEBLES HERNÁNDEZ S.A.",
    zona: "ZONA_NORTE",
    telefono: "5512345678",
    direccionCorta: "Av. Insurgentes 45, Col. Centro",
    score: 68,
    segmento: "DORMIDO_VALIOSO",
    estadoPago: "AL_CORRIENTE",
    tienePulso: true,
    recenciaDias: 120,
    saldo: "8500.00",
  };
  return { ...base, ...overrides };
}

export function makeFakeFichaCliente(
  overrides: Partial<FichaCliente> = {},
): FichaCliente {
  const base: FichaCliente = {
    clienteId: 1042,
    nombre: "MUEBLES HERNÁNDEZ S.A.",
    direccion: {
      calle: "Av. Insurgentes 45",
      colonia: "Col. Centro",
      poblacion: "Ciudad de México",
      estado: "CDMX",
    },
    telefono: "5512345678",
    limiteCredito: "50000.00",
    notas: "",
    zona: "ZONA_NORTE",
    cobrador: "José Guadalupe Pérez Morales",
    estatus: "ACTIVO",
    resumen: {
      totalComprado: "120000.00",
      totalAbonado: "111500.00",
      saldo: "8500.00",
      pctLiquidado: "0.93",
      numVentas: 7,
      numPagos: 24,
      ticketPromedio: "17142.86",
      abonosPorMes: [],
      compradoVsAbonado: [],
    },
    pulso: {
      score: 68,
      segmento: "DORMIDO_VALIOSO",
      estadoPago: "AL_CORRIENTE",
      recenciaDias: 120,
      frecuencia: 7,
      monetary: "120000.00",
      saldo: "8500.00",
      porLiquidarPct: "0.07",
      fechaUltimaCompra: new Date("2025-11-01T00:00:00.000Z"),
      fechaUltimoPago: new Date("2025-12-15T00:00:00.000Z"),
      nextBestProduct: "COMEDOR",
      numPagos: 24,
      cadenciaDias: 30,
      diasAtrasoProm: 3,
      pctPagosATiempo: "87.50",
      fechaProxPago: new Date("2026-01-15T00:00:00.000Z"),
      montoProxPago: "3500.00",
      tierRiesgo: "VIGILANCIA",
    },
  };
  return { ...base, ...overrides };
}

export function makeFakeVentaCliente(
  overrides: Partial<VentaCliente> = {},
): VentaCliente {
  const base: VentaCliente = {
    doctoPvId: 30015,
    fecha: new Date("2025-11-01T00:00:00.000Z"),
    folio: "CV-00542",
    tipo: "CREDITO",
    total: "18500.00",
    saldoVenta: "3200.00",
    numPagos: 5,
  };
  return { ...base, ...overrides };
}

export function makeFakeProductoVenta(
  overrides: Partial<ProductoVenta> = {},
): ProductoVenta {
  const base: ProductoVenta = {
    articuloId: 8801,
    nombre: "SALA IMPERIAL 3-2-1",
    unidades: "1.00000",
    precioUnitario: "18500.00",
    precioTotalNeto: "18500.00",
    pctjeDscto: "0.00",
  };
  return { ...base, ...overrides };
}

export function makeFakePago(overrides: Partial<Pago> = {}): Pago {
  const base: Pago = {
    doctoCcId: 70234,
    fecha: new Date("2025-12-15T00:00:00.000Z"),
    importe: "3200.00",
    formaCobro: "EFECTIVO",
  };
  return { ...base, ...overrides };
}

export function makeFakeVentaDetalle(
  overrides: Partial<VentaDetalle> = {},
): VentaDetalle {
  const base: VentaDetalle = {
    venta: makeFakeVentaCliente(),
    productos: [makeFakeProductoVenta()],
    contrato: {
      parcialidad: "3200.00",
      enganche: "3700.00",
      precioDeContado: "15000.00",
      plazoMeses: 6,
      formaDePago: "QUINCENAL",
      vendedores: ["María Concepción Ramírez Torres"],
    },
    pagos: [makeFakePago()],
  };
  return { ...base, ...overrides };
}
