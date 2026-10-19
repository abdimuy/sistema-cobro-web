import { describe, expect, it } from "vitest";
import {
  dtoToActividad,
  dtoToCatalogos,
  dtoToCuentas,
  dtoToFichaUsuario,
  dtoToImagen,
  dtoToJornada,
  dtoToPaginaActividad,
  dtoToTablero,
  dtoToUltimosMovimientos,
} from "../dtoADominio";
import {
  actividadPagoDTO,
  actividadVisitaDTO,
  catalogosDTO,
  cuentasDTO,
  fichaUsuarioDTO,
  imagenesDTO,
  jornadaDTO,
  lineaDTO,
  paginaActividadDTO,
  tableroDTO,
  ultimosMovimientosDTO,
} from "../../../../../test/msw/fixtures/desempeno";
import type {
  Actividad,
  Catalogos,
  CuentasSemana,
  Jornada,
  LineaDelDia,
  Tablero,
  UsuarioTablero,
} from "../../../domain/entities";
import { DomainError } from "../../../domain/errors";

// Cada mapper se compara con `toEqual` contra el objeto de dominio COMPLETO.
// Los fixtures llevan valores distintos en campos del mismo tipo, así que un
// mapper que cruce dos campos (p. ej. `recibidoAt` ← `hora`) falla aquí.

const actividadPago: Actividad = {
  id: "pago:15082369",
  tipo: "pago",
  hora: "2026-10-14T16:31:00Z",
  recibidoAt: "2026-10-14T16:31:05Z",
  clienteId: 1544855,
  clienteNombre: "JUANA ANDRADE LECHUGA",
  ventaId: 13785217,
  folio: "Z1677035",
  registradoPor: { usuarioUid: "abc123", cobradorId: 11502, nombre: "JUAN CARLOS MENDEZ", origen: "app" },
  lat: 18.4617,
  lng: -97.3928,
  conGps: true,
  numFotos: 2,
  doctoPvId: 9921,
  capturaTardia: false,
  pago: {
    importe: "150.00",
    formaCobro: "efectivo",
    formaCobroId: 157,
    aplicado: true,
    rechazado: false,
    doctoCcId: 15082369,
    pagoRecibidoId: "7a1f39e4-2b6c-4d1e-9f0a-3c5b8e2d1a47",
  },
  visita: null,
};

const actividadVisita: Actividad = {
  id: "visita:412cc2fc-7d0e-4b8a-9c1f-5e6a7b8c9d0e",
  tipo: "visita",
  hora: "2026-10-14T17:05:00Z",
  recibidoAt: "2026-10-14T19:20:00Z",
  clienteId: 1602231,
  clienteNombre: "MARÍA ELENA CUAUTLE TLAPA",
  ventaId: null,
  folio: null,
  registradoPor: { usuarioUid: null, cobradorId: null, nombre: "Oficina", origen: "oficina" },
  lat: null,
  lng: null,
  conGps: false,
  numFotos: 0,
  doctoPvId: null,
  capturaTardia: true,
  pago: null,
  visita: {
    visitaId: "412cc2fc-7d0e-4b8a-9c1f-5e6a7b8c9d0e",
    tipoVisita: "No se encontraba",
    nota: "Vecina dice que regresa el lunes",
    estado: "no_estaba",
    trato: "nadie",
    etiqueta: "No estaba",
  },
};

const linea: LineaDelDia = {
  dia: "2026-10-14",
  puntos: [
    {
      id: "pago:15082369",
      tipo: "pago",
      hora: "2026-10-14T16:31:00Z",
      clienteNombre: "JUANA ANDRADE LECHUGA",
      importe: "150.00",
      resultado: null,
      numFotos: 2,
    },
    {
      id: "visita:412cc2fc-7d0e-4b8a-9c1f-5e6a7b8c9d0e",
      tipo: "visita",
      hora: "2026-10-14T17:05:00Z",
      clienteNombre: "MARÍA ELENA CUAUTLE TLAPA",
      importe: null,
      resultado: "No se encontraba",
      numFotos: 0,
    },
  ],
  tramos: [
    {
      desde: "2026-10-14T16:31:00Z",
      hasta: "2026-10-14T17:05:00Z",
      pagos: { n: 12, importe: "3150.00" },
      visitas: 5,
      condonaciones: 1,
      clientes: 14,
    },
  ],
  porHora: Array.from({ length: 13 }, (_, i) => ({
    hora: 7 + i,
    pagos: i === 3 ? 3 : 0,
    visitas: i === 3 ? 1 : 0,
    condonaciones: i === 3 ? 2 : 0,
    importe: i === 3 ? "450.00" : "0.00",
  })),
  pausas: [
    {
      desde: "2026-10-14T17:05:00Z",
      hasta: "2026-10-14T18:17:00Z",
      minutos: 72,
      anteriorId: "visita:412cc2fc-7d0e-4b8a-9c1f-5e6a7b8c9d0e",
      siguienteId: null,
      enCurso: false,
    },
  ],
};

const usuarioConfigurado: UsuarioTablero = {
  uid: "abc123",
  nombre: "Juan Carlos Méndez",
  email: "juan.mendez@muebleriamsp.mx",
  zonaId: 21563,
  zonaNombre: "RUTA 21",
  configurado: true,
  motivoNoConfigurado: null,
  inicioSemana: "2026-10-09T13:46:00Z",
  ventasUniverso: 209,
  estadoAhora: "activo",
  estadoDesde: "2026-10-14T22:10:00Z",
  ultima: { id: "pago:15082369", tipo: "pago", hora: "2026-10-14T22:10:00Z", clienteNombre: "JUANA ANDRADE LECHUGA" },
  primeraActividad: "2026-10-14T14:20:00Z",
  ultimaActividad: "2026-10-14T22:10:00Z",
  minutosActivos: 346,
  pausas: { n: 1, minutos: 72, enCurso: false },
  pagos: { n: 31, importe: "8600.00" },
  pagosPorForma: {
    efectivo: { n: 27, importe: "7550.00" },
    transferencia: { n: 3, importe: "800.00" },
    cheque: { n: 1, importe: "250.00" },
  },
  condonaciones: { n: 1, importe: "120.00" },
  noAplicados: { n: 2, importe: "300.00" },
  visitas: 13,
  cobertura: { conAlgo: 163, total: 209 },
  semanaVencida: false,
  movimientoUltimos7Dias: { id: "pago:15082369", tipo: "pago", hora: "2026-10-14T22:10:00Z" },
  coberturaPorColumna: { porVisitar: 66, noPaga: 3, pagados: 140, sinNada: 46 },
  promedioDiario: { dias: 6, minutosActivos: 310, pagosImporte: "1433.33", visitas: 2.17 },
  cobro: { cobrado: "8600.00", esperado: "13050.00", falta: "4450.00", pct: "65.90" },
  lineas: [linea],
};

const cero = { n: 0, importe: "0.00" };
const usuarioSinConfigurar: UsuarioTablero = {
  uid: "def456",
  nombre: "Norma Velázquez Rojas",
  email: "norma.velazquez@muebleriamsp.mx",
  zonaId: null,
  zonaNombre: null,
  configurado: false,
  motivoNoConfigurado: "sin_zona",
  inicioSemana: null,
  ventasUniverso: 0,
  estadoAhora: "no_ha_empezado",
  estadoDesde: null,
  ultima: null,
  primeraActividad: null,
  ultimaActividad: null,
  minutosActivos: 0,
  pausas: { n: 0, minutos: 0, enCurso: false },
  pagos: cero,
  pagosPorForma: { efectivo: cero, transferencia: cero, cheque: cero },
  condonaciones: cero,
  noAplicados: cero,
  visitas: 0,
  cobertura: { conAlgo: 0, total: 0 },
  semanaVencida: false,
  movimientoUltimos7Dias: null,
  coberturaPorColumna: { porVisitar: 0, noPaga: 0, pagados: 0, sinNada: 0 },
  promedioDiario: null,
  cobro: { cobrado: "0.00", esperado: "0.00", falta: "0.00", pct: null },
  lineas: [],
};

const tablero: Tablero = {
  generadoAt: "2026-10-14T22:40:00Z",
  hoy: "2026-10-14",
  eje: { desdeHora: 6, hastaHora: 21 },
  periodo: "hoy",
  pausaMin: 45,
  usuarios: [usuarioConfigurado, usuarioSinConfigurar],
};

const jornada: Jornada = {
  uid: "abc123",
  fecha: "2026-10-14",
  pausaMin: 45,
  generadoAt: "2026-10-14T22:40:00Z",
  hoy: "2026-10-14",
  eje: { desdeHora: 6, hastaHora: 21 },
  horario: null,
  actividades: [actividadPago, actividadVisita],
  linea,
  senales: [
    {
      tipo: "mismo_punto",
      actividadIds: ["pago:15082369"],
      desde: "2026-10-14T16:31:00Z",
      hasta: "2026-10-14T16:37:00Z",
      detalle: "4 cuentas desde el mismo punto en 6 min",
      regla: "≥ 4 clientes distintos en 25 m dentro de 10 min",
    },
  ],
  resumen: {
    primeraActividad: "2026-10-14T16:31:00Z",
    ultimaActividad: "2026-10-14T17:05:00Z",
    minutosActivos: 346,
    pausas: { n: 1, minutos: 72, enCurso: false },
    pagos: { n: 31, importe: "8600.00" },
    visitas: 13,
    condonaciones: { n: 1, importe: "50.00" },
    clientes: 41,
  },
};

const cuentas: CuentasSemana = {
  inicioSemana: "2026-10-09T13:46:00Z",
  conteos: { porVisitar: 66, noPaga: 3, pagados: 140, sinNada: 46, total: 209 },
  cuentas: [
    {
      ventaId: 13785217,
      doctoPvId: 9921,
      folio: "Z1677035",
      clienteId: 1544855,
      clienteNombre: "JUANA ANDRADE LECHUGA",
      producto: "ROPERO LABRADO CALIFORNIA VINO",
      estado: "pago",
      trato: "pagado",
      etiqueta: "Pagó esta semana",
      detalle: "No hace falta volver",
      columna: "pagados",
      conAlgo: true,
      determinadoPor: "pago:15082369",
      ultimaActividad: { id: "pago:15082369", tipo: "pago", hora: "2026-10-14T16:31:00Z" },
      saldo: "16650.00",
      parcialidad: "150.00",
      abonoSemana: "150.00",
      numAtrasos: 0,
      nueva: false,
    },
    {
      ventaId: 13790011,
      doctoPvId: null,
      folio: null,
      clienteId: 1602231,
      clienteNombre: "MARÍA ELENA CUAUTLE TLAPA",
      producto: null,
      estado: "sin_tocar",
      trato: "sin_trabajar",
      etiqueta: "Sin tocar",
      detalle: "Nadie fue esta semana",
      columna: "por_visitar",
      conAlgo: false,
      determinadoPor: null,
      ultimaActividad: null,
      saldo: "4200.00",
      parcialidad: "200.00",
      abonoSemana: "0.00",
      numAtrasos: 3,
      nueva: true,
    },
  ],
};

const catalogos: Catalogos = {
  formasCobro: [
    { codigo: "efectivo", etiqueta: "Efectivo" },
    { codigo: "transferencia", etiqueta: "Transferencia" },
    { codigo: "cheque", etiqueta: "Cheque" },
    { codigo: "condonacion", etiqueta: "Condonación" },
  ],
  tiposVisita: [
    { literal: "No se encontraba", estado: "no_estaba", grupo: "No estaba" },
    { literal: "Se negó a pagar", estado: "se_nego", grupo: "Se negó" },
  ],
};

// Copia profunda mutable de un fixture para armar casos inválidos.
function copia<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

// Atajo para pasar un DTO deliberadamente roto al mapper tipado.
function roto<T>(v: unknown): T {
  return v as T;
}

function esRespuestaInvalida(f: () => unknown, campo: RegExp) {
  let lanzado: unknown;
  try {
    f();
  } catch (e) {
    lanzado = e;
  }
  expect(lanzado).toBeInstanceOf(DomainError);
  expect((lanzado as DomainError).code).toBe("desempeno_respuesta_invalida");
  expect((lanzado as DomainError).message).toMatch(/^respuesta inválida del servidor: /);
  expect((lanzado as DomainError).message).toMatch(campo);
}

describe("DTO del contrato → dominio (objeto completo)", () => {
  it("actividad de pago", () => {
    expect(dtoToActividad(actividadPagoDTO)).toEqual(actividadPago);
  });

  it("actividad de visita capturada en oficina", () => {
    expect(dtoToActividad(actividadVisitaDTO)).toEqual(actividadVisita);
  });

  it("tablero: usuario configurado y no configurado, sin totales del equipo", () => {
    const t = dtoToTablero(tableroDTO);
    expect(t).toEqual(tablero);
    expect(Object.keys(t)).toEqual(["generadoAt", "hoy", "eje", "periodo", "pausaMin", "usuarios"]);
  });

  it("motivo inicio_semana_futuro (contrato v2.1) es una fila no configurada, no un error", () => {
    const u = dtoToTablero({
      ...tableroDTO,
      usuarios: [{ ...tableroDTO.usuarios[1], motivo_no_configurado: "inicio_semana_futuro" }],
    }).usuarios[0];
    expect(u.configurado).toBe(false);
    expect(u.motivoNoConfigurado).toBe("inicio_semana_futuro");
  });

  it("jornada", () => {
    expect(dtoToJornada(jornadaDTO)).toEqual(jornada);
  });

  it("página de actividad", () => {
    expect(dtoToPaginaActividad(paginaActividadDTO)).toEqual({
      items: [actividadPago, actividadVisita],
      siguienteCursor: "opaco-2",
      totales: { n: 1188, importe: "289450.00", porTipo: { pago: 980, visita: 200, condonacion: 8 } },
    });
    expect(dtoToPaginaActividad({ ...paginaActividadDTO, siguiente_cursor: null }).siguienteCursor).toBeNull();
  });

  it("cuentas", () => {
    expect(dtoToCuentas(cuentasDTO)).toEqual(cuentas);
  });

  it("catálogos", () => {
    expect(dtoToCatalogos(catalogosDTO)).toEqual(catalogos);
  });

  it("fotos: descripción omitida o nula es null", () => {
    expect(dtoToImagen(imagenesDTO[0])).toEqual({
      id: "0b6f1c2e-5a7d-4e3b-8c9f-1d2e3f4a5b6c",
      mime: "image/jpeg",
      sizeBytes: 184320,
      descripcion: null,
      createdAt: "2026-10-14T16:31:10Z",
      updatedAt: "2026-10-14T16:31:10Z",
    });
    const sinDescripcion = { ...imagenesDTO[0] };
    delete sinDescripcion.descripcion;
    expect(dtoToImagen(sinDescripcion).descripcion).toBeNull();
    expect(dtoToImagen({ ...imagenesDTO[0], descripcion: "Fachada" }).descripcion).toBe("Fachada");
  });

  it("pago sin docto_cc_id (aún no llega a Microsip) conserva el null", () => {
    const dto = copia(actividadPagoDTO);
    dto.pago = { ...dto.pago!, docto_cc_id: null, pago_recibido_id: null };
    expect(dtoToActividad(dto).pago).toEqual({ ...actividadPago.pago, doctoCcId: null, pagoRecibidoId: null });
  });

  // msp-api desempenohttp/dto.go:20 declara forma_cobro_id *int: puede llegar
  // null (ya en v2.1). Un solo pago así no debe tumbar la página ni la jornada.
  it("pago sin forma_cobro_id se lee como null y no rechaza la página ni la jornada", () => {
    const dto = copia(actividadPagoDTO);
    dto.pago = { ...dto.pago!, forma_cobro: "otra", forma_cobro_id: null };
    expect(dtoToActividad(dto).pago).toEqual({ ...actividadPago.pago, formaCobro: "otra", formaCobroId: null });
    const pagina = copia(paginaActividadDTO);
    pagina.items = [dto, ...pagina.items];
    expect(dtoToPaginaActividad(pagina).items[0].pago?.formaCobroId).toBeNull();
    const jornada = copia(jornadaDTO);
    jornada.actividades = [dto, ...jornada.actividades];
    expect(dtoToJornada(jornada).actividades[0].pago?.formaCobroId).toBeNull();
  });

  it("pago y visita ausentes se leen como null", () => {
    const dto = copia(actividadPagoDTO) as Partial<typeof actividadPagoDTO>;
    delete dto.visita;
    expect(dtoToActividad(roto(dto)).visita).toBeNull();
    const dto2 = copia(actividadVisitaDTO) as Partial<typeof actividadVisitaDTO>;
    delete dto2.pago;
    expect(dtoToActividad(roto(dto2)).pago).toBeNull();
  });
});

describe("un código que el contrato no conoce es un error, no un dato", () => {
  const u0 = tableroDTO.usuarios[0];
  const casos: Array<[string, () => unknown, RegExp]> = [
    ["registrado_por.origen", () => dtoToActividad({ ...actividadPagoDTO, registrado_por: { ...actividadPagoDTO.registrado_por, origen: "web" } }), /registrado_por\.origen/],
    ["actividad.tipo", () => dtoToActividad({ ...actividadPagoDTO, tipo: "deposito" }), /actividad\.tipo/],
    ["pago.forma_cobro", () => dtoToActividad({ ...actividadPagoDTO, pago: { ...actividadPagoDTO.pago!, forma_cobro: "deposito" } }), /pago\.forma_cobro/],
    ["visita.estado", () => dtoToActividad({ ...actividadVisitaDTO, visita: { ...actividadVisitaDTO.visita!, estado: "casa" } }), /visita\.estado/],
    ["visita.trato", () => dtoToActividad({ ...actividadVisitaDTO, visita: { ...actividadVisitaDTO.visita!, trato: "casa" } }), /visita\.trato/],
    ["periodo", () => dtoToTablero({ ...tableroDTO, periodo: "mes" }), /periodo/],
    ["estado_ahora", () => dtoToTablero({ ...tableroDTO, usuarios: [{ ...u0, estado_ahora: "dormido" }] }), /estado_ahora/],
    ["motivo_no_configurado", () => dtoToTablero({ ...tableroDTO, usuarios: [{ ...tableroDTO.usuarios[1], motivo_no_configurado: "sin_ruta" }] }), /motivo_no_configurado/],
    ["ultima.tipo", () => dtoToTablero({ ...tableroDTO, usuarios: [{ ...u0, ultima: { ...u0.ultima!, tipo: "llamada" } }] }), /ultima\.tipo/],
    ["punto.tipo", () => dtoToJornada({ ...jornadaDTO, linea: { ...lineaDTO, puntos: [{ ...lineaDTO.puntos[0], tipo: "llamada" }] } }), /punto\.tipo/],
    ["senal.tipo", () => dtoToJornada({ ...jornadaDTO, senales: [{ ...jornadaDTO.senales[0], tipo: "rara" }] }), /senal\.tipo/],
    ["cuenta.estado", () => dtoToCuentas({ ...cuentasDTO, cuentas: [{ ...cuentasDTO.cuentas[0], estado: "liquidada" }] }), /cuenta\.estado/],
    ["cuenta.trato", () => dtoToCuentas({ ...cuentasDTO, cuentas: [{ ...cuentasDTO.cuentas[0], trato: "deposito" }] }), /cuenta\.trato/],
    ["cuenta.columna (sin_nada no es columna)", () => dtoToCuentas({ ...cuentasDTO, cuentas: [{ ...cuentasDTO.cuentas[0], columna: "sin_nada" }] }), /cuenta\.columna/],
    ["cuenta.columna (segmento v2.1)", () => dtoToCuentas({ ...cuentasDTO, cuentas: [{ ...cuentasDTO.cuentas[0], columna: "volver" }] }), /cuenta\.columna/],
    ["cuenta.ultima_actividad.tipo", () => dtoToCuentas({ ...cuentasDTO, cuentas: [{ ...cuentasDTO.cuentas[0], ultima_actividad: { id: "x", tipo: "llamada", hora: "2026-10-14T16:31:00Z" } }] }), /cuenta\.ultima_actividad\.tipo/],
    ["catalogos.formas_cobro.codigo", () => dtoToCatalogos({ ...catalogosDTO, formas_cobro: [{ codigo: "deposito", etiqueta: "Depósito" }] }), /formas_cobro/],
    ["catalogos.tipos_visita.estado", () => dtoToCatalogos({ ...catalogosDTO, tipos_visita: [{ literal: "x", estado: "raro", grupo: "x" }] }), /tipos_visita/],
  ];

  it.each(casos)("%s", (_campo, f, campo) => {
    esRespuestaInvalida(f, campo);
  });
});

describe("una respuesta incompleta o con tipos equivocados es DomainError, no TypeError", () => {
  it("campo faltante", () => {
    const dto = copia(actividadPagoDTO) as Partial<typeof actividadPagoDTO>;
    delete dto.registrado_por;
    esRespuestaInvalida(() => dtoToActividad(roto(dto)), /registrado_por/);
    const t = copia(tableroDTO) as unknown as { usuarios: Array<Record<string, unknown>> };
    delete t.usuarios[0].cobro;
    esRespuestaInvalida(() => dtoToTablero(roto(t)), /cobro/);
    const j = copia(jornadaDTO) as unknown as Record<string, unknown>;
    delete j.linea;
    esRespuestaInvalida(() => dtoToJornada(roto(j)), /linea/);
    const c = copia(cuentasDTO) as unknown as Record<string, unknown>;
    delete c.cuentas;
    esRespuestaInvalida(() => dtoToCuentas(roto(c)), /cuentas/);
  });

  it("dinero que no es string decimal", () => {
    const dto = copia(actividadPagoDTO) as unknown as { pago: { importe: unknown } };
    dto.pago.importe = 150;
    esRespuestaInvalida(() => dtoToActividad(roto(dto)), /pago\.importe/);
    const t = copia(tableroDTO) as unknown as { usuarios: Array<{ cobro: { falta: unknown } }> };
    t.usuarios[0].cobro.falta = "mucho";
    esRespuestaInvalida(() => dtoToTablero(roto(t)), /cobro\.falta/);
  });

  it("número que llega como texto y booleano que llega como número", () => {
    const dto = copia(actividadPagoDTO) as unknown as Record<string, unknown>;
    dto.cliente_id = "1544855";
    esRespuestaInvalida(() => dtoToActividad(roto(dto)), /cliente_id/);
    const dto2 = copia(actividadPagoDTO) as unknown as Record<string, unknown>;
    dto2.captura_tardia = 0;
    esRespuestaInvalida(() => dtoToActividad(roto(dto2)), /captura_tardia/);
  });

  it("forma_cobro_id que llega como texto sigue siendo inválido", () => {
    const dto = copia(actividadPagoDTO) as unknown as { pago: { forma_cobro_id: unknown } };
    dto.pago.forma_cobro_id = "157";
    esRespuestaInvalida(() => dtoToActividad(roto(dto)), /pago\.forma_cobro_id/);
  });

  it("null donde el contrato no lo permite", () => {
    const dto = copia(actividadPagoDTO) as unknown as Record<string, unknown>;
    dto.hora = null;
    esRespuestaInvalida(() => dtoToActividad(roto(dto)), /hora/);
  });
});

// Contrato v2.2 §8 (E-INF-018): columnas, semana vencida, último movimiento,
// promedio diario, hoy, eje, horario y condonaciones con importe.
describe("contrato v2.2", () => {
  // Copia del objeto sin la clave: simula un servidor que omite el campo.
  const sin = (o: object, clave: string): Record<string, unknown> => {
    const c = { ...o } as Record<string, unknown>;
    delete c[clave];
    return c;
  };
  const u0 = tableroDTO.usuarios[0];

  it("lee columnas, semana vencida, último movimiento, promedio, hoy y eje", () => {
    const t = dtoToTablero(tableroDTO);
    expect(t.hoy).toBe("2026-10-14");
    expect(t.eje).toEqual({ desdeHora: 6, hastaHora: 21 });
    const u = t.usuarios[0];
    expect(u.coberturaPorColumna).toEqual({ porVisitar: 66, noPaga: 3, pagados: 140, sinNada: 46 });
    expect(u.semanaVencida).toBe(false);
    expect(u.movimientoUltimos7Dias).toEqual({ id: "pago:15082369", tipo: "pago", hora: "2026-10-14T22:10:00Z" });
    expect(u.promedioDiario).toEqual({ dias: 6, minutosActivos: 310, pagosImporte: "1433.33", visitas: 2.17 });
    expect(t.usuarios[1].promedioDiario).toBeNull();
    expect(t.usuarios[1].movimientoUltimos7Dias).toBeNull();
  });

  it("rechaza una respuesta v2.1 (cobertura_por_segmento sin columnas)", () => {
    const sinColumnas = sin(u0, "cobertura_por_columna");
    const v21 = {
      ...tableroDTO,
      usuarios: [{ ...sinColumnas, cobertura_por_segmento: { sin_visitar: 1, volver: 0, despues: 0, pagados: 0, sin_nada: 1 } }],
    };
    esRespuestaInvalida(() => dtoToTablero(v21 as never), /cobertura_por_columna/);
  });

  it.each([
    ["hoy", (t: Record<string, unknown>) => delete t.hoy, /hoy/],
    ["eje", (t: Record<string, unknown>) => delete t.eje, /eje/],
  ])("tablero sin %s es inválido", (_c, quitar, campo) => {
    const t = copia(tableroDTO) as unknown as Record<string, unknown>;
    quitar(t);
    esRespuestaInvalida(() => dtoToTablero(t as never), campo);
  });

  it.each([
    ["semana_vencida", /semana_vencida/],
    ["ultimo_movimiento", /ultimo_movimiento/],
    ["promedio_diario", /promedio_diario/],
  ])("usuario sin %s es inválido (no se inventa un valor)", (clave, campo) => {
    const resto = sin(u0, clave);
    esRespuestaInvalida(() => dtoToTablero({ ...tableroDTO, usuarios: [resto] } as never), campo);
  });

  it("tipos equivocados en campos nuevos son inválidos", () => {
    esRespuestaInvalida(() => dtoToTablero({ ...tableroDTO, usuarios: [{ ...u0, semana_vencida: "no" }] } as never), /semana_vencida/);
    esRespuestaInvalida(() => dtoToTablero({ ...tableroDTO, usuarios: [{ ...u0, promedio_diario: { ...u0.promedio_diario!, pagos_importe: 1433.33 } }] } as never), /pagos_importe/);
    esRespuestaInvalida(() => dtoToTablero({ ...tableroDTO, usuarios: [{ ...u0, promedio_diario: { ...u0.promedio_diario!, visitas: "2.17" } }] } as never), /promedio_diario\.visitas/);
    esRespuestaInvalida(() => dtoToTablero({ ...tableroDTO, eje: { desde_hora: "6", hasta_hora: 21 } } as never), /eje\.desde_hora/);
    esRespuestaInvalida(() => dtoToTablero({ ...tableroDTO, usuarios: [{ ...u0, ultimo_movimiento: { id: "x", tipo: "llamada", hora: "2026-10-14T22:10:00Z" } }] } as never), /ultimo_movimiento\.tipo/);
  });

  it("una cuenta sin columna (v2.1) es inválida", () => {
    const v21 = sin(cuentasDTO.cuentas[0], "columna");
    esRespuestaInvalida(() => dtoToCuentas({ ...cuentasDTO, cuentas: [v21 as never] }), /cuenta\.columna/);
  });

  it("conteos de cuentas en columnas", () => {
    expect(dtoToCuentas(cuentasDTO).conteos).toEqual({ porVisitar: 66, noPaga: 3, pagados: 140, sinNada: 46, total: 209 });
  });

  it("rechaza una columna desconocida en una cuenta", () => {
    esRespuestaInvalida(() => dtoToCuentas({ ...cuentasDTO, cuentas: [{ ...cuentasDTO.cuentas[0], columna: "volver" }] }), /columna/);
  });

  it("condonaciones de la jornada traen importe; hoy, eje y horario", () => {
    const j = dtoToJornada(jornadaDTO);
    expect(j.resumen.condonaciones).toEqual({ n: 1, importe: "50.00" });
    expect(j.hoy).toBe("2026-10-14");
    expect(j.eje).toEqual({ desdeHora: 6, hastaHora: 21 });
    expect(j.horario).toBeNull();
    const conHorario = dtoToJornada({ ...jornadaDTO, horario: { desde_hora: "08:00", hasta_hora: "18:30" } });
    expect(conHorario.horario).toEqual({ desdeHora: "08:00", hastaHora: "18:30" });
  });

  it("condonaciones como entero (v2.1) es inválido en la jornada", () => {
    esRespuestaInvalida(
      () => dtoToJornada({ ...jornadaDTO, resumen: { ...jornadaDTO.resumen, condonaciones: 2 } } as never),
      /resumen\.condonaciones/,
    );
  });

  it("ficha por usuario con días navegables", () => {
    const f = dtoToFichaUsuario(fichaUsuarioDTO);
    expect(f.diasNavegables[f.diasNavegables.length - 1]).toBe(f.hoy);
    expect(f.inicioSemanaDia).toBe("2026-10-09");
    expect(f.eje).toEqual({ desdeHora: 6, hastaHora: 21 });
    expect(f.usuario.uid).toBe("abc123");
    expect(f.usuario.ultimoMovimiento92Dias).toEqual({ id: "pago:15082369", tipo: "pago", hora: "2026-10-14T22:10:00Z" });
    expect(f.periodo).toBe("hoy");
    expect(dtoToFichaUsuario({ ...fichaUsuarioDTO, inicio_semana_dia: null }).inicioSemanaDia).toBeNull();
  });

  it("jornada sin hoy es inválida", () => {
    esRespuestaInvalida(() => dtoToJornada(sin(jornadaDTO, "hoy") as never), /jornada\.hoy/);
  });

  it("jornada sin eje es inválida (no se rellena con 7–20)", () => {
    esRespuestaInvalida(() => dtoToJornada(sin(jornadaDTO, "eje") as never), /jornada\.eje/);
  });

  it("horario ausente es inválido; null explícito sí vale", () => {
    esRespuestaInvalida(() => dtoToJornada(sin(jornadaDTO, "horario") as never), /horario/);
    expect(dtoToJornada({ ...jornadaDTO, horario: null }).horario).toBeNull();
  });

  it("ficha sin inicio_semana_dia es inválida; null explícito sí vale", () => {
    esRespuestaInvalida(() => dtoToFichaUsuario(sin(fichaUsuarioDTO, "inicio_semana_dia") as never), /inicio_semana_dia/);
    expect(dtoToFichaUsuario({ ...fichaUsuarioDTO, inicio_semana_dia: null }).inicioSemanaDia).toBeNull();
  });

  it.each([
    ["desde_hora fraccionaria", { desde_hora: 6.5, hasta_hora: 21 }, /eje\.desde_hora/],
    ["desde_hora 24", { desde_hora: 24, hasta_hora: 24 }, /eje\.desde_hora/],
    ["desde_hora negativa", { desde_hora: -1, hasta_hora: 21 }, /eje\.desde_hora/],
    ["hasta_hora 0", { desde_hora: 0, hasta_hora: 0 }, /eje\.hasta_hora/],
    ["hasta_hora 25", { desde_hora: 6, hasta_hora: 25 }, /eje\.hasta_hora/],
    ["hasta_hora fraccionaria", { desde_hora: 6, hasta_hora: 20.5 }, /eje\.hasta_hora/],
  ])("eje con %s es inválido", (_n, eje, campo) => {
    esRespuestaInvalida(() => dtoToTablero({ ...tableroDTO, eje } as never), campo);
  });

  it("eje en los bordes 0–1 y 23–24 es válido", () => {
    expect(dtoToTablero({ ...tableroDTO, eje: { desde_hora: 0, hasta_hora: 1 } }).eje).toEqual({ desdeHora: 0, hastaHora: 1 });
    expect(dtoToTablero({ ...tableroDTO, eje: { desde_hora: 23, hasta_hora: 24 } }).eje).toEqual({ desdeHora: 23, hastaHora: 24 });
  });

  it("ficha sin dias_navegables o con un día que no es texto es inválida", () => {
    const sinDias = sin(fichaUsuarioDTO, "dias_navegables");
    esRespuestaInvalida(() => dtoToFichaUsuario(sinDias as never), /dias_navegables/);
    esRespuestaInvalida(() => dtoToFichaUsuario({ ...fichaUsuarioDTO, dias_navegables: [20261014] } as never), /dias_navegables/);
  });

  // Semana vencida (decisión del dueño, 2026-10-19): el servidor manda la lista vacía.
  it("ficha con dias_navegables vacío es válida y queda vacía", () => {
    expect(dtoToFichaUsuario({ ...fichaUsuarioDTO, dias_navegables: [] }).diasNavegables).toEqual([]);
  });
});

// Contrato pulido 2 (ultimo_movimiento): el campo del tablero se calcula sólo
// con 1 y 7 días (null = nada en 7 días) y el de la ficha con 1, 7 y 92 (null =
// sin movimiento en 92 días). Cada uno sale con su propio nombre de dominio
// para que el null del tablero nunca se lea como "92 días".
describe("ultimo_movimiento: tablero (7 días) y ficha (92 días) no se confunden", () => {
  it("el tablero no expone un campo de 92 días y la ficha no expone uno de 7", () => {
    const u = dtoToTablero(tableroDTO).usuarios[1] as unknown as Record<string, unknown>;
    expect(u.movimientoUltimos7Dias).toBeNull();
    expect("ultimoMovimiento92Dias" in u).toBe(false);
    expect("ultimoMovimiento" in u).toBe(false);
    const f = dtoToFichaUsuario({ ...fichaUsuarioDTO, usuario: { ...fichaUsuarioDTO.usuario, ultimo_movimiento: null } });
    const fu = f.usuario as unknown as Record<string, unknown>;
    expect(fu.ultimoMovimiento92Dias).toBeNull();
    expect("movimientoUltimos7Dias" in fu).toBe(false);
    expect("ultimoMovimiento" in fu).toBe(false);
  });
});

// GET /v2/desempeno/ultimo-movimiento (contrato pulido 2 §3): lector estricto.
describe("lote de último movimiento (92 días)", () => {
  const pedidos = ["abc123", "ghi789", "zzz000"];

  it("lee fecha y null por uid; el uid que no vino queda ausente", () => {
    const r = dtoToUltimosMovimientos(ultimosMovimientosDTO, pedidos);
    expect(r.generadoAt).toBe("2026-10-14T22:40:00Z");
    expect([...r.porUid.entries()]).toEqual([
      ["abc123", { id: "visita:9d1e", tipo: "visita", hora: "2026-09-14T17:05:00Z" }],
      ["ghi789", null],
    ]);
    expect(r.porUid.has("zzz000")).toBe(false);
  });

  it("usuarios vacío es válido", () => {
    expect(dtoToUltimosMovimientos({ ...ultimosMovimientosDTO, usuarios: [] }, pedidos).porUid.size).toBe(0);
  });

  it.each([
    ["sin generado_at", { usuarios: ultimosMovimientosDTO.usuarios }, /generado_at/],
    ["sin usuarios", { generado_at: "2026-10-14T22:40:00Z" }, /usuarios/],
    ["usuarios no es lista", { ...ultimosMovimientosDTO, usuarios: {} }, /usuarios/],
    ["usuario que no es objeto", { ...ultimosMovimientosDTO, usuarios: ["abc123"] }, /usuarios/],
    ["uid numérico", { ...ultimosMovimientosDTO, usuarios: [{ uid: 123, ultimo_movimiento: null }] }, /uid/],
    ["sin ultimo_movimiento", { ...ultimosMovimientosDTO, usuarios: [{ uid: "abc123" }] }, /ultimo_movimiento/],
    [
      "tipo fuera del contrato",
      { ...ultimosMovimientosDTO, usuarios: [{ uid: "abc123", ultimo_movimiento: { id: "x", tipo: "llamada", hora: "2026-09-14T17:05:00Z" } }] },
      /ultimo_movimiento\.tipo/,
    ],
    [
      "movimiento sin hora",
      { ...ultimosMovimientosDTO, usuarios: [{ uid: "abc123", ultimo_movimiento: { id: "x", tipo: "pago" } }] },
      /ultimo_movimiento\.hora/,
    ],
    [
      "uid repetido",
      { ...ultimosMovimientosDTO, usuarios: [{ uid: "abc123", ultimo_movimiento: null }, { uid: "abc123", ultimo_movimiento: null }] },
      /uid/,
    ],
    [
      "uid que no se pidió",
      { ...ultimosMovimientosDTO, usuarios: [{ uid: "otro", ultimo_movimiento: null }] },
      /uid/,
    ],
  ])("%s es inválido", (_n, dto, campo) => {
    esRespuestaInvalida(() => dtoToUltimosMovimientos(roto(dto), pedidos), campo);
  });

  it("una respuesta que no es objeto es inválida", () => {
    esRespuestaInvalida(() => dtoToUltimosMovimientos(roto(null), pedidos), /ultimo_movimiento_lote/);
  });
});
