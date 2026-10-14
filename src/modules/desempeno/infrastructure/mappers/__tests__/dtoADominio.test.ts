import { describe, expect, it } from "vitest";
import {
  dtoToActividad,
  dtoToCatalogos,
  dtoToCuentas,
  dtoToImagen,
  dtoToJornada,
  dtoToPaginaActividad,
  dtoToTablero,
} from "../dtoADominio";
import {
  actividadPagoDTO,
  actividadVisitaDTO,
  catalogosDTO,
  cuentasDTO,
  imagenesDTO,
  jornadaDTO,
  lineaDTO,
  paginaActividadDTO,
  tableroDTO,
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
  ventasUniverso: 232,
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
  cobertura: { conAlgo: 186, total: 232 },
  coberturaPorSegmento: { sinVisitar: 40, volver: 20, despues: 3, pagados: 140, sinNada: 46 },
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
  coberturaPorSegmento: { sinVisitar: 0, volver: 0, despues: 0, pagados: 0, sinNada: 0 },
  cobro: { cobrado: "0.00", esperado: "0.00", falta: "0.00", pct: null },
  lineas: [],
};

const tablero: Tablero = {
  generadoAt: "2026-10-14T22:40:00Z",
  periodo: "hoy",
  pausaMin: 45,
  usuarios: [usuarioConfigurado, usuarioSinConfigurar],
};

const jornada: Jornada = {
  uid: "abc123",
  fecha: "2026-10-14",
  pausaMin: 45,
  generadoAt: "2026-10-14T22:40:00Z",
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
    condonaciones: 2,
    clientes: 41,
  },
};

const cuentas: CuentasSemana = {
  inicioSemana: "2026-10-09T13:46:00Z",
  conteos: { sinVisitar: 40, volver: 20, despues: 3, pagados: 140, sinNada: 46, total: 232 },
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
      segmento: "pagados",
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
      segmento: "sin_visitar",
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
    expect(Object.keys(t)).toEqual(["generadoAt", "periodo", "pausaMin", "usuarios"]);
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
    ["cuenta.segmento", () => dtoToCuentas({ ...cuentasDTO, cuentas: [{ ...cuentasDTO.cuentas[0], segmento: "sin_nada" }] }), /cuenta\.segmento/],
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

  it("null donde el contrato no lo permite", () => {
    const dto = copia(actividadPagoDTO) as unknown as Record<string, unknown>;
    dto.hora = null;
    esRespuestaInvalida(() => dtoToActividad(roto(dto)), /hora/);
  });
});
