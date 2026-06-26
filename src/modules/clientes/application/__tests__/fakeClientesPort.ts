import type {
  Cliente,
  FichaCliente,
  VentaCliente,
  VentaDetalle,
  ProductoVenta,
  Pago,
  PagoRitmo,
  RitmoPago,
  PagoDetalle,
  Predicciones,
} from "../../domain/entities";
import type { ClientesPort, FichaDateRange } from "../ports/ClientesPort";
import type {
  BuscarClientesInput,
  BuscarClientesOutput,
  ListarVentasInput,
  ListarVentasOutput,
  ObtenerVentaDetalleInput,
  ObtenerPagoDetalleInput,
  RefrescarBusquedaOutput,
} from "../dto";

// FakeClientesPort is a hand-rolled in-memory implementation of ClientesPort
// that records every call. Use-case tests use it to assert the use case
// forwarded the input it received, without standing up MSW or a real HTTP
// adapter.
export class FakeClientesPort implements ClientesPort {
  buscarCalls: Array<{ input: BuscarClientesInput; signal?: AbortSignal }> = [];
  fichaCalls: Array<{ clienteId: number; range?: FichaDateRange; signal?: AbortSignal }> = [];
  listarVentasCalls: Array<{ input: ListarVentasInput; signal?: AbortSignal }> =
    [];
  obtenerDetalleCalls: Array<{
    input: ObtenerVentaDetalleInput;
    signal?: AbortSignal;
  }> = [];
  refrescarCalls: Array<Record<string, never>> = [];
  ritmoCalls: Array<{ clienteId: number; range?: FichaDateRange; signal?: AbortSignal }> = [];
  obtenerPagoDetalleCalls: Array<{
    input: ObtenerPagoDetalleInput;
    signal?: AbortSignal;
  }> = [];
  predicionesCalls: Array<{ clienteId: number; signal?: AbortSignal }> = [];

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
  ritmoResponse: RitmoPago | (() => RitmoPago) = makeFakeRitmoPago();
  obtenerPagoDetalleResponse: PagoDetalle | (() => PagoDetalle) =
    makeFakePagoDetalle();
  prediccionesResponse: Predicciones | (() => Predicciones) = makeFakePredicciones();

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
    range?: FichaDateRange,
    signal?: AbortSignal,
  ): Promise<FichaCliente> {
    this.fichaCalls.push({ clienteId, range, signal });
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

  async obtenerRitmoPago(
    clienteId: number,
    range?: FichaDateRange,
    signal?: AbortSignal,
  ): Promise<RitmoPago> {
    this.ritmoCalls.push({ clienteId, range, signal });
    const e = this.takeThrow("obtenerRitmoPago");
    if (e) throw e;
    return resolve(this.ritmoResponse);
  }

  async obtenerPagoDetalle(
    input: ObtenerPagoDetalleInput,
    signal?: AbortSignal,
  ): Promise<PagoDetalle> {
    this.obtenerPagoDetalleCalls.push({ input, signal });
    const e = this.takeThrow("obtenerPagoDetalle");
    if (e) throw e;
    return resolve(this.obtenerPagoDetalleResponse);
  }

  async obtenerPredicciones(
    clienteId: number,
    signal?: AbortSignal,
  ): Promise<Predicciones> {
    this.predicionesCalls.push({ clienteId, signal });
    const e = this.takeThrow("obtenerPredicciones");
    if (e) throw e;
    return resolve(this.prediccionesResponse);
  }

  descargarReporteCalls: Array<{
    clienteId: number;
    ventaIds?: number[];
    signal?: AbortSignal;
  }> = [];

  async descargarReporte(
    clienteId: number,
    ventaIds?: number[],
    signal?: AbortSignal,
  ): Promise<Blob> {
    this.descargarReporteCalls.push({ clienteId, ventaIds, signal });
    const e = this.takeThrow("descargarReporte");
    if (e) throw e;
    return new Blob(["%PDF-1.4 fake"], { type: "application/pdf" });
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
      pctLiquidado: "92.92",
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
      porLiquidarPct: "7.08",
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
    ubicacion: {
      lat: 19.4326,
      lng: -99.1332,
      disponible: true,
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
    hora: "14:32:00",
    almacen: "Camioneta Nissan — Jueves",
    primerArticulo: "Sala Imperial 3-2-1",
    numArticulos: 1,
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
    conceptoCcId: 87327,
    concepto: "ABONO",
    categoria: "pago",
    cobrador: "José Guadalupe Pérez Morales",
    esIngreso: true,
  };
  return { ...base, ...overrides };
}

export function makeFakePagoDetalle(
  overrides: Partial<PagoDetalle> = {},
): PagoDetalle {
  const base: PagoDetalle = {
    importe: "3200.00",
    iva: "0.00",
    fecha: new Date("2025-12-15T00:00:00.000Z"),
    formaCobroId: 52569,
    formaCobro: "EFECTIVO",
    referencia: "",
    cobradorId: 7,
    cobrador: "José Guadalupe Pérez Morales",
    conceptoCcId: 87327,
    concepto: "ABONO",
    categoria: "pago",
    esIngreso: true,
    folio: "AB-00234",
    lat: 19.4326,
    lon: -99.1332,
    aplicaACargoId: 55801,
    saldoCargo: "5300.00",
    doctoPvId: 30015,
    cancelado: false,
    aplicado: true,
    recibidoAt: new Date("2025-12-15T10:30:00.000Z"),
    aplicadoAt: new Date("2025-12-15T10:31:00.000Z"),
    origen: "app",
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

export function makePagoRitmo(overrides: Partial<PagoRitmo> = {}): PagoRitmo {
  const base: PagoRitmo = {
    doctoCcId: 70234,
    fecha: new Date("2026-05-05T10:30:00.000Z"),
    hora: "10:30:00",
    importe: "1200.00",
    conceptoCcId: 87327,
    concepto: "ABONO",
    categoria: "pago",
    esIngreso: true,
    doctoPvId: 30021,
    folio: "AB0001775",
    articulo: "LAVADORA EASY 15KG",
  };
  return { ...base, ...overrides };
}

export function makeFakeRitmoPago(overrides: Partial<RitmoPago> = {}): RitmoPago {
  const base: RitmoPago = {
    anclaDiaRuta: "lunes",
    semanas: [
      {
        semanaInicio: new Date("2026-05-04T00:00:00.000Z"),
        montoAbonado: "1200.00",
        saldo: "8300.00",
        numPagos: 1,
        pagos: [
          makePagoRitmo({
            doctoCcId: 70234,
            fecha: new Date("2026-05-05T10:30:00.000Z"),
            hora: "10:30:00",
            importe: "1200.00",
            folio: "AB0001775",
          }),
        ],
      },
      {
        semanaInicio: new Date("2026-05-11T00:00:00.000Z"),
        montoAbonado: "850.00",
        saldo: "7450.00",
        numPagos: 1,
        pagos: [
          makePagoRitmo({
            doctoCcId: 70235,
            fecha: new Date("2026-05-12T10:30:00.000Z"),
            hora: "10:30:00",
            importe: "850.00",
            folio: "AB0001776",
          }),
        ],
      },
      {
        semanaInicio: new Date("2026-05-18T00:00:00.000Z"),
        montoAbonado: "0.00",
        saldo: "7450.00",
        numPagos: 0,
        pagos: [],
      },
      {
        semanaInicio: new Date("2026-05-25T00:00:00.000Z"),
        montoAbonado: "1500.00",
        saldo: "5950.00",
        numPagos: 2,
        pagos: [
          makePagoRitmo({
            doctoCcId: 70236,
            fecha: new Date("2026-05-26T10:30:00.000Z"),
            hora: "10:30:00",
            importe: "750.00",
            folio: "AB0001777",
          }),
          makePagoRitmo({
            doctoCcId: 70237,
            fecha: new Date("2026-05-28T14:15:00.000Z"),
            hora: "14:15:00",
            importe: "750.00",
            folio: "AB0001778",
          }),
        ],
      },
    ],
    eventos: [
      {
        fecha: new Date("2026-03-10T00:00:00.000Z"),
        tipo: "venta_credito",
        monto: "9500.00",
        doctoPvId: 30021,
        folio: "CV-00589",
        plazoMeses: 6,
      },
      {
        fecha: new Date("2026-04-22T00:00:00.000Z"),
        tipo: "venta_contado",
        monto: "2800.00",
        doctoPvId: 30038,
        folio: "C-00614",
        plazoMeses: 0,
      },
      {
        fecha: new Date("2026-05-15T00:00:00.000Z"),
        tipo: "liquidacion",
        monto: "0.00",
        doctoPvId: 30021,
        folio: "CV-00589",
        plazoMeses: 0,
      },
    ],
    resumen: {
      totalAbonado: "3550.00",
      totalPerdonado: "200.00",
      semanasConPago: 3,
      semanasActivas: 4,
      rachaActualSem: 1,
      constanciaPct: "75.00",
      saldoActual: "5950.00",
    },
  };
  return { ...base, ...overrides };
}

export function makeFakePredicciones(
  overrides: Partial<Predicciones> = {},
): Predicciones {
  const base: Predicciones = {
    disponible: true,
    pAlive: { punto: 0.82, lo: 0.61, hi: 0.95 },
    comprasEsperadas12m: { punto: 3.4, lo: 1.8, hi: 5.1 },
    clv: { punto: 12450, lo: 6200, hi: 21800 },
    proximaCompraDias: { punto: 38, lo: 21, hi: 64 },
    draws: 2000,
  };
  return { ...base, ...overrides };
}
