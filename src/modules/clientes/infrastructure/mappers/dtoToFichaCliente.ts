import type {
  FichaCliente,
  Pulso,
  ResumenFicha,
  DireccionCliente,
  UbicacionCliente,
  PuntoMensual,
  PuntoCompradoAbonado,
  Tendencia,
  DireccionTendencia,
} from "../../domain/entities";
import { DomainError } from "../../domain/errors";
import { Segmento } from "../../domain/values/Segmento";
import { EstadoPago } from "../../domain/values/EstadoPago";
import type { FichaDTO, PulsoDTO, TendenciaDTO } from "../http/dtos";

// Defensive default when tendencia is absent (old data or backend not yet upgraded).
const TENDENCIA_DEFAULT: Tendencia = { slope: 0, direccion: "estable", cambio: false };

const VALID_DIRECCION: ReadonlySet<DireccionTendencia> = new Set([
  "mejorando",
  "estable",
  "empeorando",
]);

function mapTendencia(dto: TendenciaDTO | undefined): Tendencia {
  if (!dto) return TENDENCIA_DEFAULT;
  const direccion = VALID_DIRECCION.has(dto.direccion as DireccionTendencia)
    ? (dto.direccion as DireccionTendencia)
    : "estable";
  return { slope: dto.slope, direccion, cambio: dto.cambio };
}

function parseDate(raw: string, code: string, message: string): Date | null {
  if (raw === "" || raw === undefined) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    throw new DomainError(code, message);
  }
  return d;
}

function mapPulso(dto: PulsoDTO): Pulso {
  const segmento = Segmento.create(dto.segmento);
  if (segmento instanceof DomainError) throw segmento;

  const estadoPago = EstadoPago.create(dto.estado_pago);
  if (estadoPago instanceof DomainError) throw estadoPago;

  const fechaUltimaCompra = parseDate(
    dto.fecha_ultima_compra,
    "fecha_ultima_compra_invalida",
    "fecha_ultima_compra no es un timestamp válido",
  );

  const fechaUltimoPago = parseDate(
    dto.fecha_ultimo_pago,
    "fecha_ultimo_pago_invalida",
    "fecha_ultimo_pago no es un timestamp válido",
  );

  const fechaProxPago = parseDate(
    dto.fecha_prox_pago,
    "fecha_prox_pago_invalida",
    "fecha_prox_pago no es un timestamp válido",
  );

  return {
    score: dto.score,
    segmento: segmento.value,
    estadoPago: estadoPago.value,
    recenciaDias: dto.recencia_dias,
    frecuencia: dto.frecuencia,
    monetary: dto.monetary,
    saldo: dto.saldo,
    porLiquidarPct: dto.por_liquidar_pct,
    fechaUltimaCompra,
    fechaUltimoPago,
    nextBestProduct: dto.next_best_product,
    numPagos: dto.num_pagos,
    cadenciaDias: dto.cadencia_dias,
    diasAtrasoProm: dto.dias_atraso_prom,
    pctPagosATiempo: dto.pct_pagos_a_tiempo,
    fechaProxPago,
    montoProxPago: dto.monto_prox_pago,
    tierRiesgo: dto.tier_riesgo,
    // Credit risk — only present when banda_credito is non-empty
    bandaCredito: dto.banda_credito || undefined,
    scoreCredito: dto.banda_credito ? dto.score_credito : undefined,
    creditoDrivers: dto.banda_credito ? (dto.credito_drivers ?? []) : undefined,
    // Repurchase propensity — only present when banda_recompra is non-empty
    bandaRecompra: dto.banda_recompra || undefined,
    scoreRecompra: dto.banda_recompra ? dto.score_recompra : undefined,
    recompraDrivers: dto.banda_recompra ? (dto.recompra_drivers ?? []) : undefined,
    // CLV — only present when clv is non-empty
    clv: dto.clv || undefined,
    bandaClv: dto.banda_clv || undefined,
    clvDrivers: dto.banda_clv ? (dto.clv_drivers ?? []) : undefined,
    creditoResumen: dto.credito_resumen,
    recompraResumen: dto.recompra_resumen,
    clvResumen: dto.clv_resumen,
    narrativa: dto.narrativa || undefined,
    rasgosIA: dto.rasgos_ia && dto.rasgos_ia.length > 0 ? dto.rasgos_ia : undefined,
    contextoOperativo: dto.contexto_operativo || undefined,
  };
}

export function dtoToFichaCliente(dto: FichaDTO): FichaCliente {
  const direccion: DireccionCliente = {
    calle: dto.direccion.calle,
    colonia: dto.direccion.colonia,
    poblacion: dto.direccion.poblacion,
    estado: dto.direccion.estado,
  };

  const abonosPorMes: PuntoMensual[] = dto.series.abonos_por_mes.map((p) => ({
    anio: p.anio,
    mes: p.mes,
    monto: p.monto,
  }));

  const compradoVsAbonado: PuntoCompradoAbonado[] =
    dto.series.comprado_vs_abonado.map((p) => ({
      anio: p.anio,
      mes: p.mes,
      comprado: p.comprado,
      cobranza: p.cobranza,
      enganche: p.enganche,
      condonacion: p.condonacion,
      perdida: p.perdida,
      otro: p.otro,
    }));

  const resumen: ResumenFicha = {
    totalComprado: dto.resumen.total_comprado,
    totalAbonado: dto.resumen.total_abonado,
    saldo: dto.resumen.saldo,
    pctLiquidado: dto.resumen.pct_liquidado,
    numVentas: dto.resumen.num_ventas,
    numPagos: dto.resumen.num_pagos,
    ticketPromedio: dto.resumen.ticket_promedio,
    abonosPorMes,
    compradoVsAbonado,
    tendencia: mapTendencia(dto.series.tendencia),
  };

  // `!= null` (loose) cubre tanto null como undefined: cuando el cliente no
  // tiene pulso materializado el backend OMITE el campo (undefined), no envía
  // null. Con `!== null` se llamaba mapPulso(undefined) y reventaba en
  // dto.segmento ("undefined is not an object").
  const pulso: Pulso | null = dto.pulso != null ? mapPulso(dto.pulso) : null;

  const ubicacion: UbicacionCliente = {
    lat: dto.ubicacion.lat,
    lng: dto.ubicacion.lng,
    disponible: dto.ubicacion.disponible,
  };

  return {
    clienteId: dto.cliente_id,
    nombre: dto.nombre,
    direccion,
    telefono: dto.telefono,
    limiteCredito: dto.limite_credito,
    notas: dto.notas,
    zona: dto.zona,
    cobrador: dto.cobrador,
    estatus: dto.estatus,
    resumen,
    pulso,
    ubicacion,
  };
}
