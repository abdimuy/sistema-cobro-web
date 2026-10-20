import {
  FORMAS_COBRO,
  TIPOS_ACTIVIDAD,
  esEstadoCompromiso,
  esTipoCompromiso,
  esEstadoAhora,
  esMotivoNoConfigurado,
  esPeriodo,
  esTipoSenal,
  esEstadoTarea,
  esTipoAtencion,
  type Actividad,
  type AtendidaPor,
  type NuevaTarea,
  type Tarea,
  type TareaConEstado,
  type Agenda,
  type CompromisoDeVenta,
  type Catalogos,
  type CoberturaPorColumna,
  type Conteo,
  type CuentasSemana,
  type Eje,
  type FichaUsuario,
  type ImagenAdjunta,
  type Jornada,
  type LineaDelDia,
  type PaginaActividad,
  type PromedioDiario,
  type ResumenPausas,
  type Senal,
  type Tablero,
  type UltimoMovimiento,
  type UltimosMovimientos92Dias,
  type UsuarioDesempeno,
  type UsuarioFicha,
  type UsuarioTablero,
} from "../../domain/entities";
import { esColumna, esEstadoCuenta, esTrato } from "../../domain/values/estadoCuenta";
import { esUno } from "../../domain/values/esUno";
import { DomainError } from "../../domain/errors";
import type {
  ActividadDTO,
  AgendaDTO,
  CatalogosDTO,
  CuentasDTO,
  FichaUsuarioDTO,
  ImagenDTO,
  JornadaDTO,
  LineaDelDiaDTO,
  ListaTareasDTO,
  NuevaTareaDTO,
  TareaDTO,
  PaginaActividadDTO,
  TableroDTO,
  UltimosMovimientosDTO,
} from "../http/dtos";

// Mapeo DTO (contrato v2.2, snake_case) → dominio (camelCase). Solo renombra y
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
      formaCobroId: numeroONulo(p.forma_cobro_id, "pago.forma_cobro_id"),
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

function leerEje(v: unknown, campo: string): Eje {
  const o = obj(v, campo);
  const desdeHora = numero(o.desde_hora, `${campo}.desde_hora`);
  const hastaHora = numero(o.hasta_hora, `${campo}.hasta_hora`);
  // Contrato §8: desde_hora entero 0–23, hasta_hora entero 1–24.
  if (!Number.isInteger(desdeHora) || desdeHora < 0 || desdeHora > 23) throw invalida(`${campo}.desde_hora`);
  if (!Number.isInteger(hastaHora) || hastaHora < 1 || hastaHora > 24) throw invalida(`${campo}.hasta_hora`);
  return { desdeHora, hastaHora };
}

function leerColumnas(v: unknown, campo: string): CoberturaPorColumna {
  const o = obj(v, campo);
  return {
    porVisitar: numero(o.por_visitar, `${campo}.por_visitar`),
    noPaga: numero(o.no_paga, `${campo}.no_paga`),
    pagados: numero(o.pagados, `${campo}.pagados`),
    sinNada: numero(o.sin_nada, `${campo}.sin_nada`),
  };
}

function leerPromedio(v: unknown, campo: string): PromedioDiario | null {
  if (v === null) return null;
  const o = obj(v, campo);
  return {
    dias: numero(o.dias, `${campo}.dias`),
    minutosActivos: numero(o.minutos_activos, `${campo}.minutos_activos`),
    pagosImporte: dinero(o.pagos_importe, `${campo}.pagos_importe`),
    visitas: numero(o.visitas, `${campo}.visitas`),
  };
}

function leerMovimiento(v: unknown, campo: string): UltimoMovimiento | null {
  if (v === null) return null;
  const o = obj(v, campo);
  return { id: texto(o.id, `${campo}.id`), tipo: codigo(o.tipo, esTipoActividad, `${campo}.tipo`), hora: texto(o.hora, `${campo}.hora`) };
}

// Campos comunes del usuario. `ultimo_movimiento` se lee aparte porque su
// significado depende del endpoint (contrato pulido 2): ver leerUsuarioTablero
// y leerUsuarioFicha.
function leerUsuario(d: Obj): UsuarioDesempeno {
  const ultima = d.ultima === null ? null : obj(d.ultima, "ultima");
  const ppf = obj(d.pagos_por_forma, "pagos_por_forma");
  const cob = obj(d.cobertura, "cobertura");
  const columnas = leerColumnas(d.cobertura_por_columna, "cobertura_por_columna");
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
    semanaVencida: booleano(d.semana_vencida, "semana_vencida"),
    coberturaPorColumna: columnas,
    promedioDiario: leerPromedio(d.promedio_diario, "promedio_diario"),
    cobro: {
      cobrado: dinero(cobro.cobrado, "cobro.cobrado"),
      esperado: dinero(cobro.esperado, "cobro.esperado"),
      falta: dinero(cobro.falta, "cobro.falta"),
      pct: dineroONulo(cobro.pct, "cobro.pct"),
    },
    lineas: lista(d.lineas, "lineas").map((l) => leerLinea(l, "lineas")),
  };
}

// Tablero: etapas de 1 y 7 días; null = nada en 7 días (nunca "92 días").
function leerUsuarioTablero(v: unknown): UsuarioTablero {
  const d = obj(v, "usuario");
  return { ...leerUsuario(d), movimientoUltimos7Dias: leerMovimiento(d.ultimo_movimiento, "ultimo_movimiento") };
}

// Ficha: etapas de 1, 7 y 92 días; null = sin movimiento en 92 días.
function leerUsuarioFicha(v: unknown): UsuarioFicha {
  const d = obj(v, "usuario");
  return { ...leerUsuario(d), ultimoMovimiento92Dias: leerMovimiento(d.ultimo_movimiento, "ultimo_movimiento") };
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
    hoy: texto(d.hoy, "hoy"),
    eje: leerEje(d.eje, "eje"),
    periodo: codigo(d.periodo, esPeriodo, "periodo"),
    pausaMin: numero(d.pausa_min, "pausa_min"),
    usuarios: lista(d.usuarios, "usuarios").map(leerUsuarioTablero),
  };
}

export function dtoToFichaUsuario(dto: FichaUsuarioDTO): FichaUsuario {
  const d = obj(dto, "ficha");
  return {
    generadoAt: texto(d.generado_at, "generado_at"),
    hoy: texto(d.hoy, "hoy"),
    periodo: codigo(d.periodo, esPeriodo, "periodo"),
    pausaMin: numero(d.pausa_min, "pausa_min"),
    eje: leerEje(d.eje, "eje"),
    usuario: leerUsuarioFicha(d.usuario),
    inicioSemanaDia: textoONulo(d.inicio_semana_dia, "inicio_semana_dia"),
    diasNavegables: lista(d.dias_navegables, "dias_navegables").map((x) => texto(x, "dias_navegables")),
  };
}

// Lote de último movimiento (contrato pulido 2 §3). Estricto: cada fila trae
// `uid` y `ultimo_movimiento` (null explícito, nunca omitido). Un uid repetido
// o que no se pidió es un error del servidor, no un dato: pintarlo pondría la
// fecha de otro cobrador en una fila.
export function dtoToUltimosMovimientos(
  dto: UltimosMovimientosDTO,
  solicitados: readonly string[],
): UltimosMovimientos92Dias {
  const d = obj(dto, "ultimo_movimiento_lote");
  const pedidos = new Set(solicitados);
  const porUid = new Map<string, UltimoMovimiento | null>();
  const generadoAt = texto(d.generado_at, "generado_at");
  for (const fila of lista(d.usuarios, "usuarios")) {
    const f = obj(fila, "usuarios[]");
    const uid = texto(f.uid, "usuarios[].uid");
    if (!pedidos.has(uid) || porUid.has(uid)) throw invalida("usuarios[].uid");
    porUid.set(uid, leerMovimiento(f.ultimo_movimiento, "ultimo_movimiento"));
  }
  return { generadoAt, porUid };
}

function leerHorario(v: unknown): { desdeHora: string; hastaHora: string } | null {
  if (v === null) return null;
  const o = obj(v, "jornada.horario");
  return { desdeHora: texto(o.desde_hora, "horario.desde_hora"), hastaHora: texto(o.hasta_hora, "horario.hasta_hora") };
}

export function dtoToJornada(dto: JornadaDTO): Jornada {
  const d = obj(dto, "jornada");
  const r = obj(d.resumen, "resumen");
  return {
    uid: texto(d.uid, "jornada.uid"),
    fecha: texto(d.fecha, "jornada.fecha"),
    pausaMin: numero(d.pausa_min, "jornada.pausa_min"),
    generadoAt: texto(d.generado_at, "jornada.generado_at"),
    hoy: texto(d.hoy, "jornada.hoy"),
    eje: leerEje(d.eje, "jornada.eje"),
    horario: leerHorario(d.horario),
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
      condonaciones: conteo(r.condonaciones, "resumen.condonaciones"),
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
      porVisitar: numero(k.por_visitar, "conteos.por_visitar"),
      noPaga: numero(k.no_paga, "conteos.no_paga"),
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
        columna: codigo(c.columna, esColumna, "cuenta.columna"),
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

// GET /v2/visitas/agenda (visitas P2, spec §5.5). El estado lo deriva el
// servidor: un estado o tipo fuera del contrato, un monto que no sea entero de
// centavos, dos compromisos para la misma venta o la agenda de otra zona son
// respuesta inválida, no un dato. `columna` no se lee: la columna de la cuenta
// ya la decide el servidor en /desempeno/.../cuentas.
const DIA_CIVIL = /^\d{4}-\d{2}-\d{2}$/;
const HORA_CIVIL = /^\d{2}:\d{2}$/;

function conForma(v: unknown, forma: RegExp, campo: string): string {
  const t = texto(v, campo);
  if (!forma.test(t)) throw invalida(campo);
  return t;
}

export function dtoToAgenda(dto: AgendaDTO, zonaId: number): Agenda {
  const d = obj(dto, "agenda");
  if (numero(d.zona_id, "agenda.zona_id") !== zonaId) throw invalida("agenda.zona_id");
  const porVenta = new Map<number, CompromisoDeVenta>();
  for (const x of lista(d.items, "agenda.items")) {
    const it = obj(x, "agenda.item");
    const monto = numeroONulo(it.monto_centavos, "agenda.item.monto_centavos");
    if (monto !== null && !Number.isInteger(monto)) throw invalida("agenda.item.monto_centavos");
    const c: CompromisoDeVenta = {
      ventaId: numero(it.venta_id, "agenda.item.venta_id"),
      tipo: codigo(it.tipo, esTipoCompromiso, "agenda.item.tipo"),
      estado: codigo(it.estado, esEstadoCompromiso, "agenda.item.estado"),
      dia: conForma(it.dia, DIA_CIVIL, "agenda.item.dia"),
      hora: it.hora === null ? null : conForma(it.hora, HORA_CIVIL, "agenda.item.hora"),
      montoCentavos: monto,
    };
    if (porVenta.has(c.ventaId)) throw invalida("agenda.item.venta_id");
    porVenta.set(c.ventaId, c);
  }
  return porVenta;
}

// Tareas de visita (visitas P3, Tarea 5 del plan). Mismo criterio: se lee y se
// valida la forma, el estado lo deriva el servidor.
function leerTarea(v: unknown, campo: string): Tarea {
  const d = obj(v, campo);
  const hora = textoONulo(d.hora, `${campo}.hora`);
  return {
    id: texto(d.id, `${campo}.id`),
    ventaId: numero(d.venta_id, `${campo}.venta_id`),
    clienteId: numero(d.cliente_id, `${campo}.cliente_id`),
    zonaClienteId: numero(d.zona_cliente_id, `${campo}.zona_cliente_id`),
    fecha: conForma(d.fecha, DIA_CIVIL, `${campo}.fecha`),
    hora: hora === null ? null : conForma(hora, HORA_CIVIL, `${campo}.hora`),
    nota: textoONulo(d.nota, `${campo}.nota`),
    reemplazaA: textoONulo(d.reemplaza_a, `${campo}.reemplaza_a`),
    createdAt: texto(d.created_at, `${campo}.created_at`),
    createdBy: texto(d.created_by, `${campo}.created_by`),
    updatedAt: texto(d.updated_at, `${campo}.updated_at`),
    canceladaAt: textoONulo(d.cancelada_at, `${campo}.cancelada_at`),
  };
}

export function dtoToTarea(dto: TareaDTO): Tarea {
  return leerTarea(dto, "tarea");
}

function leerAtendidaPor(v: unknown): AtendidaPor | null {
  if (v === null || v === undefined) return null;
  const a = obj(v, "tarea.atendida_por");
  return {
    tipo: codigo(a.tipo, esTipoAtencion, "tarea.atendida_por.tipo"),
    id: texto(a.id, "tarea.atendida_por.id"),
    cobradorId: numeroONulo(a.cobrador_id, "tarea.atendida_por.cobrador_id"),
    instante: texto(a.instante, "tarea.atendida_por.instante"),
  };
}

export function dtoToTareas(dto: ListaTareasDTO): TareaConEstado[] {
  const d = obj(dto, "tareas");
  return lista(d.items, "tareas.items").map((x) => {
    const it = obj(x, "tarea");
    return {
      ...leerTarea(it, "tarea"),
      estado: codigo(it.estado, esEstadoTarea, "tarea.estado"),
      atendidaPor: leerAtendidaPor(it.atendida_por),
    };
  });
}

// Dominio → cuerpo del POST. Los opcionales vacíos no viajan.
export function nuevaTareaToDto(t: NuevaTarea): NuevaTareaDTO {
  const dto: NuevaTareaDTO = { id: t.id, venta_id: t.ventaId, fecha: t.fecha };
  if (t.hora) dto.hora = t.hora;
  if (t.nota) dto.nota = t.nota;
  if (t.reemplazaA) dto.reemplaza_a = t.reemplazaA;
  return dto;
}
