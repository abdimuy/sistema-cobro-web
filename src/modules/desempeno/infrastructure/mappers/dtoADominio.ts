import {
  FORMAS_COBRO,
  TIPOS_ACTIVIDAD,
  esEstadoAhora,
  esMotivoNoConfigurado,
  esPeriodo,
  esTipoSenal,
  type Actividad,
  type Catalogos,
  type Conteo,
  type CuentasSemana,
  type ImagenAdjunta,
  type Jornada,
  type LineaDelDia,
  type PaginaActividad,
  type ResumenPausas,
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
  TableroDTO,
} from "../http/dtos";

// Mapeo DTO (contrato v2, snake_case) → dominio (camelCase). Solo renombra y
// valida: no calcula nada (D10). El JSON llega sin garantías de tipo, así que
// cada campo se lee con un lector que comprueba su forma. Un campo faltante,
// de otro tipo o un código fuera del contrato es un error del servidor, no un
// dato: sale como DomainError("desempeno_respuesta_invalida") en vez de un
// TypeError o de pintar algo que nadie definió.

type Obj = Record<string, unknown>;

function invalida(campo: string): DomainError {
  return new DomainError("desempeno_respuesta_invalida", `respuesta inválida del servidor: ${campo}`);
}

function obj(v: unknown, campo: string): Obj {
  if (v === null || typeof v !== "object" || Array.isArray(v)) throw invalida(campo);
  return v as Obj;
}

function lista(v: unknown, campo: string): unknown[] {
  if (!Array.isArray(v)) throw invalida(campo);
  return v;
}

function texto(v: unknown, campo: string): string {
  if (typeof v !== "string") throw invalida(campo);
  return v;
}

function textoONulo(v: unknown, campo: string): string | null {
  return v === null ? null : texto(v, campo);
}

function numero(v: unknown, campo: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) throw invalida(campo);
  return v;
}

function numeroONulo(v: unknown, campo: string): number | null {
  return v === null ? null : numero(v, campo);
}

function booleano(v: unknown, campo: string): boolean {
  if (typeof v !== "boolean") throw invalida(campo);
  return v;
}

// Dinero: string decimal ("1250.00", "-80.00"). Nunca se convierte a número.
const DECIMAL = /^-?\d+(\.\d+)?$/;
function dinero(v: unknown, campo: string): string {
  if (typeof v !== "string" || !DECIMAL.test(v)) throw invalida(campo);
  return v;
}

function dineroONulo(v: unknown, campo: string): string | null {
  return v === null ? null : dinero(v, campo);
}

function codigo<T>(v: unknown, guarda: (x: unknown) => x is T, campo: string): T {
  if (!guarda(v)) throw invalida(campo);
  return v;
}

const esTipoActividad = (v: unknown) => esUno(TIPOS_ACTIVIDAD, v);
const esFormaCobro = (v: unknown) => esUno(FORMAS_COBRO, v);
const esOrigen = (v: unknown): v is "app" | "oficina" => v === "app" || v === "oficina";

function conteo(v: unknown, campo: string): Conteo {
  const o = obj(v, campo);
  return { n: numero(o.n, `${campo}.n`), importe: dinero(o.importe, `${campo}.importe`) };
}

function resumenPausas(v: unknown, campo: string): ResumenPausas {
  const o = obj(v, campo);
  return {
    n: numero(o.n, `${campo}.n`),
    minutos: numero(o.minutos, `${campo}.minutos`),
    enCurso: booleano(o.en_curso, `${campo}.en_curso`),
  };
}

function leerActividad(v: unknown): Actividad {
  const d = obj(v, "actividad");
  const r = obj(d.registrado_por, "registrado_por");
  // pago/visita ausentes se leen como null (un API que omite el que no aplica).
  const p = d.pago === undefined || d.pago === null ? null : obj(d.pago, "pago");
  const vi = d.visita === undefined || d.visita === null ? null : obj(d.visita, "visita");
  return {
    id: texto(d.id, "actividad.id"),
    tipo: codigo(d.tipo, esTipoActividad, "actividad.tipo"),
    hora: texto(d.hora, "actividad.hora"),
    recibidoAt: textoONulo(d.recibido_at, "actividad.recibido_at"),
    clienteId: numero(d.cliente_id, "actividad.cliente_id"),
    clienteNombre: texto(d.cliente_nombre, "actividad.cliente_nombre"),
    ventaId: numeroONulo(d.venta_id, "actividad.venta_id"),
    folio: textoONulo(d.folio, "actividad.folio"),
    registradoPor: {
      usuarioUid: textoONulo(r.usuario_uid, "registrado_por.usuario_uid"),
      cobradorId: numeroONulo(r.cobrador_id, "registrado_por.cobrador_id"),
      nombre: texto(r.nombre, "registrado_por.nombre"),
      origen: codigo(r.origen, esOrigen, "registrado_por.origen"),
    },
    lat: numeroONulo(d.lat, "actividad.lat"),
    lng: numeroONulo(d.lng, "actividad.lng"),
    conGps: booleano(d.con_gps, "actividad.con_gps"),
    numFotos: numero(d.num_fotos, "actividad.num_fotos"),
    doctoPvId: numeroONulo(d.docto_pv_id, "actividad.docto_pv_id"),
    capturaTardia: booleano(d.captura_tardia, "actividad.captura_tardia"),
    pago: p && {
      importe: dinero(p.importe, "pago.importe"),
      formaCobro: codigo(p.forma_cobro, esFormaCobro, "pago.forma_cobro"),
      formaCobroId: numero(p.forma_cobro_id, "pago.forma_cobro_id"),
      aplicado: booleano(p.aplicado, "pago.aplicado"),
      rechazado: booleano(p.rechazado, "pago.rechazado"),
      doctoCcId: numeroONulo(p.docto_cc_id, "pago.docto_cc_id"),
      pagoRecibidoId: textoONulo(p.pago_recibido_id, "pago.pago_recibido_id"),
    },
    visita: vi && {
      visitaId: texto(vi.visita_id, "visita.visita_id"),
      tipoVisita: texto(vi.tipo_visita, "visita.tipo_visita"),
      nota: textoONulo(vi.nota, "visita.nota"),
      estado: codigo(vi.estado, esEstadoCuenta, "visita.estado"),
      trato: codigo(vi.trato, esTrato, "visita.trato"),
      etiqueta: texto(vi.etiqueta, "visita.etiqueta"),
    },
  };
}

function leerLinea(v: unknown, campo: string): LineaDelDia {
  const d = obj(v, campo);
  return {
    dia: texto(d.dia, "linea.dia"),
    puntos: lista(d.puntos, "linea.puntos").map((x) => {
      const p = obj(x, "punto");
      return {
        id: texto(p.id, "punto.id"),
        tipo: codigo(p.tipo, esTipoActividad, "punto.tipo"),
        hora: texto(p.hora, "punto.hora"),
        clienteNombre: texto(p.cliente_nombre, "punto.cliente_nombre"),
        importe: dineroONulo(p.importe, "punto.importe"),
        resultado: textoONulo(p.resultado, "punto.resultado"),
        numFotos: numero(p.num_fotos, "punto.num_fotos"),
      };
    }),
    tramos: lista(d.tramos, "linea.tramos").map((x) => {
      const t = obj(x, "tramo");
      return {
        desde: texto(t.desde, "tramo.desde"),
        hasta: texto(t.hasta, "tramo.hasta"),
        pagos: conteo(t.pagos, "tramo.pagos"),
        visitas: numero(t.visitas, "tramo.visitas"),
        condonaciones: numero(t.condonaciones, "tramo.condonaciones"),
        clientes: numero(t.clientes, "tramo.clientes"),
      };
    }),
    porHora: lista(d.por_hora, "linea.por_hora").map((x) => {
      const h = obj(x, "por_hora");
      return {
        hora: numero(h.hora, "por_hora.hora"),
        pagos: numero(h.pagos, "por_hora.pagos"),
        visitas: numero(h.visitas, "por_hora.visitas"),
        condonaciones: numero(h.condonaciones, "por_hora.condonaciones"),
        importe: dinero(h.importe, "por_hora.importe"),
      };
    }),
    pausas: lista(d.pausas, "linea.pausas").map((x) => {
      const p = obj(x, "pausa");
      return {
        desde: texto(p.desde, "pausa.desde"),
        hasta: texto(p.hasta, "pausa.hasta"),
        minutos: numero(p.minutos, "pausa.minutos"),
        anteriorId: textoONulo(p.anterior_id, "pausa.anterior_id"),
        siguienteId: textoONulo(p.siguiente_id, "pausa.siguiente_id"),
        enCurso: booleano(p.en_curso, "pausa.en_curso"),
      };
    }),
  };
}

function leerSenal(v: unknown): Senal {
  const d = obj(v, "senal");
  return {
    tipo: codigo(d.tipo, esTipoSenal, "senal.tipo"),
    actividadIds: lista(d.actividad_ids, "senal.actividad_ids").map((x) => texto(x, "senal.actividad_ids")),
    desde: textoONulo(d.desde, "senal.desde"),
    hasta: textoONulo(d.hasta, "senal.hasta"),
    detalle: texto(d.detalle, "senal.detalle"),
    regla: texto(d.regla, "senal.regla"),
  };
}

function leerUsuario(v: unknown): UsuarioTablero {
  const d = obj(v, "usuario");
  const ultima = d.ultima === null ? null : obj(d.ultima, "ultima");
  const ppf = obj(d.pagos_por_forma, "pagos_por_forma");
  const cob = obj(d.cobertura, "cobertura");
  const seg = obj(d.cobertura_por_segmento, "cobertura_por_segmento");
  const cobro = obj(d.cobro, "cobro");
  return {
    uid: texto(d.uid, "usuario.uid"),
    nombre: texto(d.nombre, "usuario.nombre"),
    email: texto(d.email, "usuario.email"),
    zonaId: numeroONulo(d.zona_id, "zona_id"),
    zonaNombre: textoONulo(d.zona_nombre, "zona_nombre"),
    configurado: booleano(d.configurado, "configurado"),
    motivoNoConfigurado:
      d.motivo_no_configurado === null
        ? null
        : codigo(d.motivo_no_configurado, esMotivoNoConfigurado, "motivo_no_configurado"),
    inicioSemana: textoONulo(d.inicio_semana, "inicio_semana"),
    ventasUniverso: numero(d.ventas_universo, "ventas_universo"),
    estadoAhora: codigo(d.estado_ahora, esEstadoAhora, "estado_ahora"),
    estadoDesde: textoONulo(d.estado_desde, "estado_desde"),
    ultima: ultima && {
      id: texto(ultima.id, "ultima.id"),
      tipo: codigo(ultima.tipo, esTipoActividad, "ultima.tipo"),
      hora: texto(ultima.hora, "ultima.hora"),
      clienteNombre: texto(ultima.cliente_nombre, "ultima.cliente_nombre"),
    },
    primeraActividad: textoONulo(d.primera_actividad, "primera_actividad"),
    ultimaActividad: textoONulo(d.ultima_actividad, "ultima_actividad"),
    minutosActivos: numero(d.minutos_activos, "minutos_activos"),
    pausas: resumenPausas(d.pausas, "pausas"),
    pagos: conteo(d.pagos, "pagos"),
    pagosPorForma: {
      efectivo: conteo(ppf.efectivo, "pagos_por_forma.efectivo"),
      transferencia: conteo(ppf.transferencia, "pagos_por_forma.transferencia"),
      cheque: conteo(ppf.cheque, "pagos_por_forma.cheque"),
    },
    condonaciones: conteo(d.condonaciones, "condonaciones"),
    noAplicados: conteo(d.no_aplicados, "no_aplicados"),
    visitas: numero(d.visitas, "visitas"),
    cobertura: { conAlgo: numero(cob.con_algo, "cobertura.con_algo"), total: numero(cob.total, "cobertura.total") },
    coberturaPorSegmento: {
      sinVisitar: numero(seg.sin_visitar, "cobertura_por_segmento.sin_visitar"),
      volver: numero(seg.volver, "cobertura_por_segmento.volver"),
      despues: numero(seg.despues, "cobertura_por_segmento.despues"),
      pagados: numero(seg.pagados, "cobertura_por_segmento.pagados"),
      sinNada: numero(seg.sin_nada, "cobertura_por_segmento.sin_nada"),
    },
    cobro: {
      cobrado: dinero(cobro.cobrado, "cobro.cobrado"),
      esperado: dinero(cobro.esperado, "cobro.esperado"),
      falta: dinero(cobro.falta, "cobro.falta"),
      pct: dineroONulo(cobro.pct, "cobro.pct"),
    },
    lineas: lista(d.lineas, "lineas").map((l) => leerLinea(l, "lineas")),
  };
}

export function dtoToActividad(d: ActividadDTO): Actividad {
  return leerActividad(d);
}

export function dtoToLinea(d: LineaDelDiaDTO): LineaDelDia {
  return leerLinea(d, "linea");
}

export function dtoToTablero(dto: TableroDTO): Tablero {
  const d = obj(dto, "tablero");
  return {
    generadoAt: texto(d.generado_at, "generado_at"),
    periodo: codigo(d.periodo, esPeriodo, "periodo"),
    pausaMin: numero(d.pausa_min, "pausa_min"),
    usuarios: lista(d.usuarios, "usuarios").map(leerUsuario),
  };
}

export function dtoToJornada(dto: JornadaDTO): Jornada {
  const d = obj(dto, "jornada");
  const r = obj(d.resumen, "resumen");
  return {
    uid: texto(d.uid, "jornada.uid"),
    fecha: texto(d.fecha, "jornada.fecha"),
    pausaMin: numero(d.pausa_min, "jornada.pausa_min"),
    generadoAt: texto(d.generado_at, "jornada.generado_at"),
    actividades: lista(d.actividades, "jornada.actividades").map(leerActividad),
    linea: leerLinea(d.linea, "linea"),
    senales: lista(d.senales, "jornada.senales").map(leerSenal),
    resumen: {
      primeraActividad: textoONulo(r.primera_actividad, "resumen.primera_actividad"),
      ultimaActividad: textoONulo(r.ultima_actividad, "resumen.ultima_actividad"),
      minutosActivos: numero(r.minutos_activos, "resumen.minutos_activos"),
      pausas: resumenPausas(r.pausas, "resumen.pausas"),
      pagos: conteo(r.pagos, "resumen.pagos"),
      visitas: numero(r.visitas, "resumen.visitas"),
      condonaciones: numero(r.condonaciones, "resumen.condonaciones"),
      clientes: numero(r.clientes, "resumen.clientes"),
    },
  };
}

export function dtoToPaginaActividad(dto: PaginaActividadDTO): PaginaActividad {
  const d = obj(dto, "pagina");
  const t = obj(d.totales, "totales");
  const pt = obj(t.por_tipo, "totales.por_tipo");
  return {
    items: lista(d.items, "items").map(leerActividad),
    siguienteCursor: textoONulo(d.siguiente_cursor, "siguiente_cursor"),
    totales: {
      n: numero(t.n, "totales.n"),
      importe: dinero(t.importe, "totales.importe"),
      porTipo: {
        pago: numero(pt.pago, "totales.por_tipo.pago"),
        visita: numero(pt.visita, "totales.por_tipo.visita"),
        condonacion: numero(pt.condonacion, "totales.por_tipo.condonacion"),
      },
    },
  };
}

export function dtoToCuentas(dto: CuentasDTO): CuentasSemana {
  const d = obj(dto, "cuentas");
  const k = obj(d.conteos, "conteos");
  return {
    inicioSemana: texto(d.inicio_semana, "inicio_semana"),
    conteos: {
      sinVisitar: numero(k.sin_visitar, "conteos.sin_visitar"),
      volver: numero(k.volver, "conteos.volver"),
      despues: numero(k.despues, "conteos.despues"),
      pagados: numero(k.pagados, "conteos.pagados"),
      sinNada: numero(k.sin_nada, "conteos.sin_nada"),
      total: numero(k.total, "conteos.total"),
    },
    cuentas: lista(d.cuentas, "cuentas").map((x) => {
      const c = obj(x, "cuenta");
      const ua = c.ultima_actividad === null ? null : obj(c.ultima_actividad, "cuenta.ultima_actividad");
      return {
        ventaId: numero(c.venta_id, "cuenta.venta_id"),
        doctoPvId: numeroONulo(c.docto_pv_id, "cuenta.docto_pv_id"),
        folio: textoONulo(c.folio, "cuenta.folio"),
        clienteId: numero(c.cliente_id, "cuenta.cliente_id"),
        clienteNombre: texto(c.cliente_nombre, "cuenta.cliente_nombre"),
        producto: textoONulo(c.producto, "cuenta.producto"),
        estado: codigo(c.estado, esEstadoCuenta, "cuenta.estado"),
        trato: codigo(c.trato, esTrato, "cuenta.trato"),
        etiqueta: texto(c.etiqueta, "cuenta.etiqueta"),
        detalle: texto(c.detalle, "cuenta.detalle"),
        segmento: c.segmento === null ? null : codigo(c.segmento, esSegmento, "cuenta.segmento"),
        conAlgo: booleano(c.con_algo, "cuenta.con_algo"),
        determinadoPor: textoONulo(c.determinado_por, "cuenta.determinado_por"),
        ultimaActividad: ua && {
          id: texto(ua.id, "cuenta.ultima_actividad.id"),
          tipo: codigo(ua.tipo, esTipoActividad, "cuenta.ultima_actividad.tipo"),
          hora: texto(ua.hora, "cuenta.ultima_actividad.hora"),
        },
        saldo: dinero(c.saldo, "cuenta.saldo"),
        parcialidad: dinero(c.parcialidad, "cuenta.parcialidad"),
        abonoSemana: dinero(c.abono_semana, "cuenta.abono_semana"),
        numAtrasos: numero(c.num_atrasos, "cuenta.num_atrasos"),
        nueva: booleano(c.nueva, "cuenta.nueva"),
      };
    }),
  };
}

export function dtoToCatalogos(dto: CatalogosDTO): Catalogos {
  const d = obj(dto, "catalogos");
  return {
    formasCobro: lista(d.formas_cobro, "catalogos.formas_cobro").map((x) => {
      const f = obj(x, "catalogos.formas_cobro");
      return {
        codigo: codigo(f.codigo, esFormaCobro, "catalogos.formas_cobro.codigo"),
        etiqueta: texto(f.etiqueta, "catalogos.formas_cobro.etiqueta"),
      };
    }),
    tiposVisita: lista(d.tipos_visita, "catalogos.tipos_visita").map((x) => {
      const t = obj(x, "catalogos.tipos_visita");
      return {
        literal: texto(t.literal, "catalogos.tipos_visita.literal"),
        estado: codigo(t.estado, esEstadoCuenta, "catalogos.tipos_visita.estado"),
        grupo: texto(t.grupo, "catalogos.tipos_visita.grupo"),
      };
    }),
  };
}

export function dtoToImagen(dto: ImagenDTO): ImagenAdjunta {
  const d = obj(dto, "imagen");
  return {
    id: texto(d.id, "imagen.id"),
    mime: texto(d.mime, "imagen.mime"),
    sizeBytes: numero(d.size_bytes, "imagen.size_bytes"),
    descripcion: d.descripcion === undefined ? null : textoONulo(d.descripcion, "imagen.descripcion"),
    createdAt: texto(d.created_at, "imagen.created_at"),
    updatedAt: texto(d.updated_at, "imagen.updated_at"),
  };
}
