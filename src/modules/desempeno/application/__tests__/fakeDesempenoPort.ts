import type {
  Actividad,
  Catalogos,
  Cuenta,
  CuentasSemana,
  FiltrosActividad,
  HoraDelDia,
  ImagenAdjunta,
  Jornada,
  LineaDelDia,
  PaginaActividad,
  Pausa,
  PuntoLinea,
  RefImagenes,
  RegistradoPor,
  Senal,
  Tablero,
  Tramo,
  UsuarioTablero,
} from "../../domain/entities";
import type {
  ConsultaCuentas,
  ConsultaJornada,
  ConsultaTablero,
  DesempenoPort,
  PaginaSolicitada,
} from "../ports/DesempenoPort";

// Datos de ejemplo del 14-oct-2026. CDMX es UTC-6 todo el año (sin horario de
// verano desde 2022): 14:20Z = 08:20 en la oficina. La suite corre en UTC, así
// que una pantalla que pinte la hora UTC cruda falla estas pruebas.

export function makeRegistradoPor(overrides: Partial<RegistradoPor> = {}): RegistradoPor {
  return {
    usuarioUid: "uid-juan",
    cobradorId: 11502,
    nombre: "JUAN CARLOS MENDEZ",
    origen: "app",
    ...overrides,
  };
}

export function makeActividadPago(overrides: Partial<Actividad> = {}): Actividad {
  return {
    id: "pago:15082369",
    tipo: "pago",
    hora: "2026-10-14T14:20:00Z",
    recibidoAt: "2026-10-14T14:20:05Z",
    clienteId: 1544855,
    clienteNombre: "JUANA ANDRADE LECHUGA",
    ventaId: 13785217,
    folio: "Z1677035",
    registradoPor: makeRegistradoPor(),
    lat: 18.4617,
    lng: -97.3928,
    conGps: true,
    numFotos: 1,
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
    ...overrides,
  };
}

// La visita llegó al servidor 2 h 13 min después de registrarse: el servidor la
// marca como captura tardía (regla ≥ 2 h, contrato v2).
export function makeActividadVisita(overrides: Partial<Actividad> = {}): Actividad {
  return {
    id: "visita:412cc2fc-7d0e-4b8a-9c1f-5e6a7b8c9d0e",
    tipo: "visita",
    hora: "2026-10-14T14:45:00Z",
    recibidoAt: "2026-10-14T16:58:00Z",
    clienteId: 1602231,
    clienteNombre: "MARÍA ELENA CUAUTLE TLAPA",
    ventaId: 13790011,
    folio: "Z1680412",
    registradoPor: makeRegistradoPor(),
    lat: null,
    lng: null,
    conGps: false,
    numFotos: 2,
    doctoPvId: 9934,
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
    ...overrides,
  };
}

export function makeActividadCondonacion(overrides: Partial<Actividad> = {}): Actividad {
  return {
    id: "pago:15082401",
    tipo: "condonacion",
    hora: "2026-10-14T16:40:00Z",
    recibidoAt: "2026-10-14T16:40:09Z",
    clienteId: 1577310,
    clienteNombre: "ROSA ISELA PACHECO NAVA",
    ventaId: 13788420,
    folio: "Z1679003",
    registradoPor: makeRegistradoPor(),
    lat: 18.4655,
    lng: -97.3981,
    conGps: true,
    numFotos: 0,
    doctoPvId: 9928,
    capturaTardia: false,
    pago: {
      importe: "50.00",
      formaCobro: "condonacion",
      formaCobroId: 137026,
      aplicado: true,
      rechazado: false,
      doctoCcId: 15082401,
      pagoRecibidoId: null,
    },
    visita: null,
    ...overrides,
  };
}

export function makePausa(overrides: Partial<Pausa> = {}): Pausa {
  return {
    desde: "2026-10-14T15:10:00Z",
    hasta: "2026-10-14T16:22:00Z",
    minutos: 72,
    anteriorId: "pago:15082370",
    siguienteId: "pago:15082390",
    enCurso: false,
    ...overrides,
  };
}

export function makeTramo(overrides: Partial<Tramo> = {}): Tramo {
  return {
    desde: "2026-10-14T14:20:00Z",
    hasta: "2026-10-14T15:10:00Z",
    pagos: { n: 2, importe: "300.00" },
    visitas: 1,
    condonaciones: 0,
    clientes: 3,
    ...overrides,
  };
}

const POR_HORA_EJEMPLO: Record<number, Partial<HoraDelDia>> = {
  8: { pagos: 1, visitas: 1, importe: "150.00" },
  9: { pagos: 1, importe: "150.00" },
  10: { pagos: 1, condonaciones: 1, importe: "150.00" },
};

// makePorHora devuelve las 13 entradas 7..19 del contrato.
export function makePorHora(
  conteos: Record<number, Partial<HoraDelDia>> = POR_HORA_EJEMPLO,
): HoraDelDia[] {
  const horas: HoraDelDia[] = [];
  for (let hora = 7; hora <= 19; hora++) {
    horas.push({
      hora,
      pagos: 0,
      visitas: 0,
      condonaciones: 0,
      importe: "0.00",
      ...conteos[hora],
    });
  }
  return horas;
}

// makePuntoLinea: punto del eje con los datos de popover del contrato v2.
export function makePuntoLinea(overrides: Partial<PuntoLinea> = {}): PuntoLinea {
  return {
    id: "pago:15082369",
    tipo: "pago",
    hora: "2026-10-14T14:20:00Z",
    clienteNombre: "JUANA ANDRADE LECHUGA",
    importe: "150.00",
    resultado: null,
    numFotos: 1,
    ...overrides,
  };
}

// Los puntos coinciden con las actividades de makeJornada (mismos ids, horas,
// clientes, importes y fotos).
export function makeLinea(overrides: Partial<LineaDelDia> = {}): LineaDelDia {
  return {
    dia: "2026-10-14",
    puntos: [
      makePuntoLinea(),
      makePuntoLinea({
        id: "visita:412cc2fc-7d0e-4b8a-9c1f-5e6a7b8c9d0e",
        tipo: "visita",
        hora: "2026-10-14T14:45:00Z",
        clienteNombre: "MARÍA ELENA CUAUTLE TLAPA",
        importe: null,
        resultado: "No se encontraba",
        numFotos: 2,
      }),
      makePuntoLinea({
        id: "pago:15082370",
        hora: "2026-10-14T15:10:00Z",
        clienteNombre: "PEDRO TEHUITZIL ZEPEDA",
      }),
      makePuntoLinea({
        id: "pago:15082390",
        hora: "2026-10-14T16:22:00Z",
        clienteNombre: "ARACELI CORTÉS LUNA",
        numFotos: 0,
      }),
      makePuntoLinea({
        id: "pago:15082401",
        tipo: "condonacion",
        hora: "2026-10-14T16:40:00Z",
        clienteNombre: "ROSA ISELA PACHECO NAVA",
        importe: "50.00",
        numFotos: 0,
      }),
    ],
    tramos: [
      makeTramo(),
      makeTramo({
        desde: "2026-10-14T16:22:00Z",
        hasta: "2026-10-14T16:40:00Z",
        pagos: { n: 1, importe: "150.00" },
        visitas: 0,
        condonaciones: 1,
        clientes: 2,
      }),
    ],
    porHora: makePorHora(),
    pausas: [makePausa()],
    ...overrides,
  };
}

export function makeUsuarioTablero(overrides: Partial<UsuarioTablero> = {}): UsuarioTablero {
  return {
    uid: "uid-juan",
    nombre: "Juan Carlos Méndez",
    email: "juan.mendez@muebleriamsp.mx",
    zonaId: 21563,
    zonaNombre: "RUTA 21",
    configurado: true,
    motivoNoConfigurado: null,
    inicioSemana: "2026-10-09T13:46:00Z",
    ventasUniverso: 232,
    estadoAhora: "activo",
    estadoDesde: "2026-10-14T16:40:00Z",
    ultima: {
      id: "pago:15082401",
      tipo: "condonacion",
      hora: "2026-10-14T16:40:00Z",
      clienteNombre: "ROSA ISELA PACHECO NAVA",
    },
    primeraActividad: "2026-10-14T14:20:00Z",
    ultimaActividad: "2026-10-14T16:40:00Z",
    minutosActivos: 346,
    pausas: { n: 1, minutos: 72, enCurso: false },
    pagos: { n: 31, importe: "8600.00" },
    pagosPorForma: {
      efectivo: { n: 28, importe: "7800.00" },
      transferencia: { n: 3, importe: "800.00" },
      cheque: { n: 0, importe: "0.00" },
    },
    condonaciones: { n: 0, importe: "0.00" },
    noAplicados: { n: 0, importe: "0.00" },
    visitas: 13,
    cobertura: { conAlgo: 186, total: 232 },
    coberturaPorSegmento: { sinVisitar: 46, volver: 20, despues: 3, pagados: 140, sinNada: 46 },
    cobro: { cobrado: "8600.00", esperado: "13050.00", falta: "4450.00", pct: "65.90" },
    lineas: [makeLinea()],
    ...overrides,
  };
}

// Usuario no configurado (contrato v2 §2): métricas en cero, `lineas = []` y
// `zonaId`, `zonaNombre`, `inicioSemana` y `cobro.pct` en null.
export function makeUsuarioSinConfigurar(
  overrides: Partial<UsuarioTablero> = {},
): UsuarioTablero {
  return makeUsuarioTablero({
    uid: "uid-norma",
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
    pagos: { n: 0, importe: "0.00" },
    pagosPorForma: {
      efectivo: { n: 0, importe: "0.00" },
      transferencia: { n: 0, importe: "0.00" },
      cheque: { n: 0, importe: "0.00" },
    },
    condonaciones: { n: 0, importe: "0.00" },
    noAplicados: { n: 0, importe: "0.00" },
    visitas: 0,
    cobertura: { conAlgo: 0, total: 0 },
    coberturaPorSegmento: { sinVisitar: 0, volver: 0, despues: 0, pagados: 0, sinNada: 0 },
    cobro: { cobrado: "0.00", esperado: "0.00", falta: "0.00", pct: null },
    lineas: [],
    ...overrides,
  });
}

export function makeTablero(overrides: Partial<Tablero> = {}): Tablero {
  return {
    generadoAt: "2026-10-14T22:40:00Z",
    periodo: "hoy",
    pausaMin: 45,
    usuarios: [
      makeUsuarioTablero(),
      makeUsuarioTablero({
        uid: "uid-rosa",
        nombre: "Rosa Isela Pacheco",
        email: "rosa.pacheco@muebleriamsp.mx",
        zonaId: 21564,
        zonaNombre: "RUTA 22",
        estadoAhora: "sin_actividad",
        estadoDesde: "2026-10-14T21:05:00Z",
        pagos: { n: 24, importe: "5100.00" },
        cobertura: { conAlgo: 185, total: 246 },
        coberturaPorSegmento: { sinVisitar: 61, volver: 18, despues: 4, pagados: 163, sinNada: 61 },
        cobro: { cobrado: "5100.00", esperado: "11800.00", falta: "6700.00", pct: "43.22" },
        ventasUniverso: 246,
      }),
      makeUsuarioSinConfigurar(),
    ],
    ...overrides,
  };
}

export function makeSenal(overrides: Partial<Senal> = {}): Senal {
  return {
    tipo: "pausa_larga",
    actividadIds: ["pago:15082370", "pago:15082390"],
    desde: "2026-10-14T15:10:00Z",
    hasta: "2026-10-14T16:22:00Z",
    detalle: "Pausa de 1 h 12 min",
    regla: "hueco de 45 min o más entre dos movimientos",
    ...overrides,
  };
}

export function makeJornada(overrides: Partial<Jornada> = {}): Jornada {
  return {
    uid: "uid-juan",
    fecha: "2026-10-14",
    pausaMin: 45,
    generadoAt: "2026-10-14T22:40:00Z",
    actividades: [
      makeActividadPago(),
      makeActividadVisita(),
      makeActividadPago({
        id: "pago:15082370",
        hora: "2026-10-14T15:10:00Z",
        recibidoAt: "2026-10-14T15:10:04Z",
        clienteId: 1590077,
        clienteNombre: "PEDRO TEHUITZIL ZEPEDA",
        ventaId: 13786602,
        folio: "Z1678820",
        doctoPvId: 9923,
      }),
      makeActividadPago({
        id: "pago:15082390",
        hora: "2026-10-14T16:22:00Z",
        recibidoAt: "2026-10-14T16:22:06Z",
        clienteId: 1561200,
        clienteNombre: "ARACELI CORTÉS LUNA",
        ventaId: 13784410,
        folio: "Z1676110",
        doctoPvId: 9917,
        numFotos: 0,
      }),
      makeActividadCondonacion(),
    ],
    linea: makeLinea(),
    senales: [
      makeSenal(),
      makeSenal({
        tipo: "sin_gps",
        actividadIds: ["visita:412cc2fc-7d0e-4b8a-9c1f-5e6a7b8c9d0e"],
        desde: null,
        hasta: null,
        detalle: "Visita sin ubicación",
        regla: "el teléfono no mandó coordenadas",
      }),
    ],
    resumen: {
      primeraActividad: "2026-10-14T14:20:00Z",
      ultimaActividad: "2026-10-14T16:40:00Z",
      minutosActivos: 68,
      pausas: { n: 1, minutos: 72, enCurso: false },
      pagos: { n: 3, importe: "450.00" },
      visitas: 1,
      condonaciones: 1,
      clientes: 5,
    },
    ...overrides,
  };
}

// Totales del servidor: `importe` es solo dinero (3 pagos de $150); la
// condonación de $50 no suma ahí (contrato v2 §4).
export function makePaginaActividad(overrides: Partial<PaginaActividad> = {}): PaginaActividad {
  return {
    items: makeJornada().actividades,
    siguienteCursor: null,
    totales: { n: 5, importe: "450.00", porTipo: { pago: 3, visita: 1, condonacion: 1 } },
    ...overrides,
  };
}

export function makeCuenta(overrides: Partial<Cuenta> = {}): Cuenta {
  return {
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
    ultimaActividad: { id: "pago:15082369", tipo: "pago", hora: "2026-10-14T14:20:00Z" },
    saldo: "16650.00",
    parcialidad: "150.00",
    abonoSemana: "150.00",
    numAtrasos: 0,
    nueva: false,
    ...overrides,
  };
}

export function makeCuentaSinTocar(overrides: Partial<Cuenta> = {}): Cuenta {
  return makeCuenta({
    ventaId: 13791100,
    doctoPvId: 9950,
    folio: "Z1681007",
    clienteId: 1610045,
    clienteNombre: "GERARDO XICALE ANALCO",
    producto: "COMEDOR 6 SILLAS TOSCANA",
    estado: "sin_tocar",
    trato: "sin_trabajar",
    etiqueta: "Falta pasar",
    detalle: "Todavía no vas",
    segmento: "sin_visitar",
    conAlgo: false,
    determinadoPor: null,
    ultimaActividad: null,
    saldo: "8400.00",
    parcialidad: "200.00",
    abonoSemana: "0.00",
    numAtrasos: 6,
    ...overrides,
  });
}

export function makeCuentasSemana(overrides: Partial<CuentasSemana> = {}): CuentasSemana {
  return {
    inicioSemana: "2026-10-09T13:46:00Z",
    conteos: { sinVisitar: 46, volver: 20, despues: 3, pagados: 140, sinNada: 46, total: 232 },
    cuentas: [makeCuenta(), makeCuentaSinTocar()],
    ...overrides,
  };
}

// makeCatalogos: respuesta de ejemplo de GET /v2/desempeno/catalogos. La
// correspondencia literal → estado/grupo de este ejemplo es ilustrativa; la real
// la decide el servidor.
export function makeCatalogos(overrides: Partial<Catalogos> = {}): Catalogos {
  return {
    formasCobro: [
      { codigo: "efectivo", etiqueta: "Efectivo" },
      { codigo: "transferencia", etiqueta: "Transferencia" },
      { codigo: "cheque", etiqueta: "Cheque" },
      { codigo: "condonacion", etiqueta: "Condonación" },
      { codigo: "otra", etiqueta: "Otra" },
    ],
    tiposVisita: [
      { literal: "No se encontraba", estado: "no_estaba", grupo: "No estaba" },
      { literal: "Casa cerrada con candado", estado: "no_estaba", grupo: "No estaba" },
      { literal: "Pidió que regrese otro día", estado: "visite_vuelvo", grupo: "Volver" },
      { literal: "Tiene dinero pero no quiso pagar", estado: "se_nego", grupo: "Se negó" },
      { literal: "Pidió reagendar visita", estado: "cita_a_una_hora", grupo: "Cita" },
    ],
    ...overrides,
  };
}

export function makeImagen(overrides: Partial<ImagenAdjunta> = {}): ImagenAdjunta {
  return {
    id: "0b6f1c2e-5a7d-4e3b-8c9f-1d2e3f4a5b6c",
    mime: "image/jpeg",
    sizeBytes: 184320,
    descripcion: "Recibo firmado",
    createdAt: "2026-10-14T14:20:10Z",
    updatedAt: "2026-10-14T14:20:10Z",
    ...overrides,
  };
}

type Respuesta<T> = T | (() => T | Promise<T>);

async function resolver<T>(r: Respuesta<T>): Promise<T> {
  return typeof r === "function" ? (r as () => T | Promise<T>)() : r;
}

// FakeDesempenoPort: implementación en memoria que registra cada llamada. Las
// pruebas de hooks y componentes la usan en vez de MSW.
export class FakeDesempenoPort implements DesempenoPort {
  tableroCalls: Array<{ consulta: ConsultaTablero }> = [];
  jornadaCalls: Array<{ uid: string; fecha: string; consulta: ConsultaJornada }> = [];
  actividadCalls: Array<{ uid: string; filtros: FiltrosActividad; pagina: PaginaSolicitada }> = [];
  cuentasCalls: Array<{ uid: string; consulta: ConsultaCuentas }> = [];
  catalogosCalls = 0;
  imagenesCalls: Array<{ ref: RefImagenes }> = [];
  descargarCalls: Array<{ ref: RefImagenes; imagenId: string }> = [];

  tableroResponse: Respuesta<Tablero> = makeTablero();
  jornadaResponse: Respuesta<Jornada> = makeJornada();
  actividadResponse:
    | PaginaActividad
    | ((pagina: PaginaSolicitada) => PaginaActividad | Promise<PaginaActividad>) =
    makePaginaActividad();
  cuentasResponse: Respuesta<CuentasSemana> = makeCuentasSemana();
  catalogosResponse: Respuesta<Catalogos> = makeCatalogos();
  imagenesResponse: Respuesta<ImagenAdjunta[]> = [makeImagen()];
  descargarResponse: Respuesta<Blob> = new Blob(["jpg"], { type: "image/jpeg" });

  // Si se llena, la siguiente llamada a ese método lanza este error.
  throwOnNext: Partial<Record<keyof DesempenoPort, Error>> = {};

  async obtenerTablero(consulta: ConsultaTablero): Promise<Tablero> {
    this.tableroCalls.push({ consulta });
    this.lanzarSiToca("obtenerTablero");
    return resolver(this.tableroResponse);
  }

  async obtenerJornada(uid: string, fecha: string, consulta: ConsultaJornada): Promise<Jornada> {
    this.jornadaCalls.push({ uid, fecha, consulta });
    this.lanzarSiToca("obtenerJornada");
    return resolver(this.jornadaResponse);
  }

  async listarActividad(
    uid: string,
    filtros: FiltrosActividad,
    pagina: PaginaSolicitada,
  ): Promise<PaginaActividad> {
    this.actividadCalls.push({ uid, filtros, pagina });
    this.lanzarSiToca("listarActividad");
    const r = this.actividadResponse;
    return typeof r === "function" ? r(pagina) : r;
  }

  async obtenerCuentas(uid: string, consulta: ConsultaCuentas): Promise<CuentasSemana> {
    this.cuentasCalls.push({ uid, consulta });
    this.lanzarSiToca("obtenerCuentas");
    return resolver(this.cuentasResponse);
  }

  async obtenerCatalogos(): Promise<Catalogos> {
    this.catalogosCalls++;
    this.lanzarSiToca("obtenerCatalogos");
    return resolver(this.catalogosResponse);
  }

  async listarImagenes(ref: RefImagenes): Promise<ImagenAdjunta[]> {
    this.imagenesCalls.push({ ref });
    this.lanzarSiToca("listarImagenes");
    return resolver(this.imagenesResponse);
  }

  async descargarImagen(ref: RefImagenes, imagenId: string): Promise<Blob> {
    this.descargarCalls.push({ ref, imagenId });
    this.lanzarSiToca("descargarImagen");
    return resolver(this.descargarResponse);
  }

  private lanzarSiToca(metodo: keyof DesempenoPort): void {
    const e = this.throwOnNext[metodo];
    if (e) {
      delete this.throwOnNext[metodo];
      throw e;
    }
  }
}
