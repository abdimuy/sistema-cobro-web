import {
  FORMAS_COBRO,
  TIPOS_ACTIVIDAD,
  esEstadoAhora,
  esMotivoNoConfigurado,
  esPeriodo,
  esTipoSenal,
  type Actividad,
  type Catalogos,
  type CuentasSemana,
  type ImagenAdjunta,
  type Jornada,
  type LineaDelDia,
  type PaginaActividad,
  type Senal,
  type Tablero,
  type UsuarioTablero,
} from "../../domain/entities";
import { esEstadoCuenta, esSegmento, esTrato } from "../../domain/values/estadoCuenta";
import { esUno } from "../../domain/values/esUno";
import { DomainError } from "../../domain/errors";
import type {
  ActividadDTO,
  CatalogosDTO,
  CuentasDTO,
  ImagenDTO,
  JornadaDTO,
  LineaDelDiaDTO,
  PaginaActividadDTO,
  SenalDTO,
  TableroDTO,
  UsuarioTableroDTO,
} from "../http/dtos";

// Mapeo DTO (contrato v2, snake_case) → dominio (camelCase). Solo renombra y
// valida códigos: no calcula nada (D10). Un código fuera del contrato es un
// error del servidor, no un dato: se falla fuerte en vez de pintar algo que
// nadie definió.
function exigir<T>(valor: unknown, guarda: (v: unknown) => v is T, campo: string): T {
  if (!guarda(valor)) {
    throw new DomainError("desempeno_respuesta_invalida", `respuesta inválida del servidor: ${campo}`);
  }
  return valor;
}

const esTipoActividad = (v: unknown) => esUno(TIPOS_ACTIVIDAD, v);
const esFormaCobro = (v: unknown) => esUno(FORMAS_COBRO, v);
const esOrigen = (v: unknown): v is "app" | "oficina" => v === "app" || v === "oficina";

export function dtoToActividad(d: ActividadDTO): Actividad {
  return {
    id: d.id,
    tipo: exigir(d.tipo, esTipoActividad, "actividad.tipo"),
    hora: d.hora,
    recibidoAt: d.recibido_at,
    clienteId: d.cliente_id,
    clienteNombre: d.cliente_nombre,
    ventaId: d.venta_id,
    folio: d.folio,
    registradoPor: {
      usuarioUid: d.registrado_por.usuario_uid,
      cobradorId: d.registrado_por.cobrador_id,
      nombre: d.registrado_por.nombre,
      origen: exigir(d.registrado_por.origen, esOrigen, "registrado_por.origen"),
    },
    lat: d.lat,
    lng: d.lng,
    conGps: d.con_gps,
    numFotos: d.num_fotos,
    doctoPvId: d.docto_pv_id,
    capturaTardia: d.captura_tardia,
    pago: d.pago && {
      importe: d.pago.importe,
      formaCobro: exigir(d.pago.forma_cobro, esFormaCobro, "pago.forma_cobro"),
      formaCobroId: d.pago.forma_cobro_id,
      aplicado: d.pago.aplicado,
      rechazado: d.pago.rechazado,
      doctoCcId: d.pago.docto_cc_id,
      pagoRecibidoId: d.pago.pago_recibido_id,
    },
    visita: d.visita && {
      visitaId: d.visita.visita_id,
      tipoVisita: d.visita.tipo_visita,
      nota: d.visita.nota,
      estado: exigir(d.visita.estado, esEstadoCuenta, "visita.estado"),
      trato: exigir(d.visita.trato, esTrato, "visita.trato"),
      etiqueta: d.visita.etiqueta,
    },
  };
}

export function dtoToLinea(d: LineaDelDiaDTO): LineaDelDia {
  return {
    dia: d.dia,
    puntos: d.puntos.map((p) => ({
      id: p.id,
      tipo: exigir(p.tipo, esTipoActividad, "punto.tipo"),
      hora: p.hora,
      clienteNombre: p.cliente_nombre,
      importe: p.importe,
      resultado: p.resultado,
      numFotos: p.num_fotos,
    })),
    tramos: d.tramos.map((t) => ({
      desde: t.desde,
      hasta: t.hasta,
      pagos: { n: t.pagos.n, importe: t.pagos.importe },
      visitas: t.visitas,
      condonaciones: t.condonaciones,
      clientes: t.clientes,
    })),
    porHora: d.por_hora.map((h) => ({
      hora: h.hora,
      pagos: h.pagos,
      visitas: h.visitas,
      condonaciones: h.condonaciones,
      importe: h.importe,
    })),
    pausas: d.pausas.map((p) => ({
      desde: p.desde,
      hasta: p.hasta,
      minutos: p.minutos,
      anteriorId: p.anterior_id,
      siguienteId: p.siguiente_id,
      enCurso: p.en_curso,
    })),
  };
}

function dtoToSenal(d: SenalDTO): Senal {
  return {
    tipo: exigir(d.tipo, esTipoSenal, "senal.tipo"),
    actividadIds: [...d.actividad_ids],
    desde: d.desde,
    hasta: d.hasta,
    detalle: d.detalle,
    regla: d.regla,
  };
}

function dtoToUsuario(d: UsuarioTableroDTO): UsuarioTablero {
  return {
    uid: d.uid,
    nombre: d.nombre,
    email: d.email,
    zonaId: d.zona_id,
    zonaNombre: d.zona_nombre,
    configurado: d.configurado,
    motivoNoConfigurado:
      d.motivo_no_configurado === null
        ? null
        : exigir(d.motivo_no_configurado, esMotivoNoConfigurado, "motivo_no_configurado"),
    inicioSemana: d.inicio_semana,
    ventasUniverso: d.ventas_universo,
    estadoAhora: exigir(d.estado_ahora, esEstadoAhora, "estado_ahora"),
    estadoDesde: d.estado_desde,
    ultima: d.ultima && {
      id: d.ultima.id,
      tipo: exigir(d.ultima.tipo, esTipoActividad, "ultima.tipo"),
      hora: d.ultima.hora,
      clienteNombre: d.ultima.cliente_nombre,
    },
    primeraActividad: d.primera_actividad,
    ultimaActividad: d.ultima_actividad,
    minutosActivos: d.minutos_activos,
    pausas: { n: d.pausas.n, minutos: d.pausas.minutos, enCurso: d.pausas.en_curso },
    pagos: { n: d.pagos.n, importe: d.pagos.importe },
    pagosPorForma: {
      efectivo: { n: d.pagos_por_forma.efectivo.n, importe: d.pagos_por_forma.efectivo.importe },
      transferencia: { n: d.pagos_por_forma.transferencia.n, importe: d.pagos_por_forma.transferencia.importe },
      cheque: { n: d.pagos_por_forma.cheque.n, importe: d.pagos_por_forma.cheque.importe },
    },
    condonaciones: { n: d.condonaciones.n, importe: d.condonaciones.importe },
    noAplicados: { n: d.no_aplicados.n, importe: d.no_aplicados.importe },
    visitas: d.visitas,
    cobertura: { conAlgo: d.cobertura.con_algo, total: d.cobertura.total },
    coberturaPorSegmento: {
      sinVisitar: d.cobertura_por_segmento.sin_visitar,
      volver: d.cobertura_por_segmento.volver,
      despues: d.cobertura_por_segmento.despues,
      pagados: d.cobertura_por_segmento.pagados,
      sinNada: d.cobertura_por_segmento.sin_nada,
    },
    cobro: { cobrado: d.cobro.cobrado, esperado: d.cobro.esperado, falta: d.cobro.falta, pct: d.cobro.pct },
    lineas: d.lineas.map(dtoToLinea),
  };
}

export function dtoToTablero(d: TableroDTO): Tablero {
  return {
    generadoAt: d.generado_at,
    periodo: exigir(d.periodo, esPeriodo, "periodo"),
    pausaMin: d.pausa_min,
    usuarios: d.usuarios.map(dtoToUsuario),
  };
}

export function dtoToJornada(d: JornadaDTO): Jornada {
  return {
    uid: d.uid,
    fecha: d.fecha,
    pausaMin: d.pausa_min,
    generadoAt: d.generado_at,
    actividades: d.actividades.map(dtoToActividad),
    linea: dtoToLinea(d.linea),
    senales: d.senales.map(dtoToSenal),
    resumen: {
      primeraActividad: d.resumen.primera_actividad,
      ultimaActividad: d.resumen.ultima_actividad,
      minutosActivos: d.resumen.minutos_activos,
      pausas: { n: d.resumen.pausas.n, minutos: d.resumen.pausas.minutos, enCurso: d.resumen.pausas.en_curso },
      pagos: { n: d.resumen.pagos.n, importe: d.resumen.pagos.importe },
      visitas: d.resumen.visitas,
      condonaciones: d.resumen.condonaciones,
      clientes: d.resumen.clientes,
    },
  };
}

export function dtoToPaginaActividad(d: PaginaActividadDTO): PaginaActividad {
  return {
    items: d.items.map(dtoToActividad),
    siguienteCursor: d.siguiente_cursor,
    totales: {
      n: d.totales.n,
      importe: d.totales.importe,
      porTipo: {
        pago: d.totales.por_tipo.pago,
        visita: d.totales.por_tipo.visita,
        condonacion: d.totales.por_tipo.condonacion,
      },
    },
  };
}

export function dtoToCuentas(d: CuentasDTO): CuentasSemana {
  return {
    inicioSemana: d.inicio_semana,
    conteos: {
      sinVisitar: d.conteos.sin_visitar,
      volver: d.conteos.volver,
      despues: d.conteos.despues,
      pagados: d.conteos.pagados,
      sinNada: d.conteos.sin_nada,
      total: d.conteos.total,
    },
    cuentas: d.cuentas.map((c) => ({
      ventaId: c.venta_id,
      doctoPvId: c.docto_pv_id,
      folio: c.folio,
      clienteId: c.cliente_id,
      clienteNombre: c.cliente_nombre,
      producto: c.producto,
      estado: exigir(c.estado, esEstadoCuenta, "cuenta.estado"),
      trato: exigir(c.trato, esTrato, "cuenta.trato"),
      etiqueta: c.etiqueta,
      detalle: c.detalle,
      segmento: c.segmento === null ? null : exigir(c.segmento, esSegmento, "cuenta.segmento"),
      conAlgo: c.con_algo,
      determinadoPor: c.determinado_por,
      ultimaActividad: c.ultima_actividad && {
        id: c.ultima_actividad.id,
        tipo: exigir(c.ultima_actividad.tipo, esTipoActividad, "cuenta.ultima_actividad.tipo"),
        hora: c.ultima_actividad.hora,
      },
      saldo: c.saldo,
      parcialidad: c.parcialidad,
      abonoSemana: c.abono_semana,
      numAtrasos: c.num_atrasos,
      nueva: c.nueva,
    })),
  };
}

export function dtoToCatalogos(d: CatalogosDTO): Catalogos {
  return {
    formasCobro: d.formas_cobro.map((f) => ({
      codigo: exigir(f.codigo, esFormaCobro, "catalogos.formas_cobro.codigo"),
      etiqueta: f.etiqueta,
    })),
    tiposVisita: d.tipos_visita.map((t) => ({
      literal: t.literal,
      estado: exigir(t.estado, esEstadoCuenta, "catalogos.tipos_visita.estado"),
      grupo: t.grupo,
    })),
  };
}

export function dtoToImagen(d: ImagenDTO): ImagenAdjunta {
  return {
    id: d.id,
    mime: d.mime,
    sizeBytes: d.size_bytes,
    descripcion: d.descripcion ?? null,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}
