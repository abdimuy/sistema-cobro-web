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
  paginaActividadDTO,
  tableroDTO,
} from "../../../../../test/msw/fixtures/desempeno";
import { DomainError } from "../../../domain/errors";

describe("DTO del contrato → dominio", () => {
  it("tablero: usuario configurado y no configurado, sin totales del equipo", () => {
    const t = dtoToTablero(tableroDTO);
    expect(t.generadoAt).toBe("2026-10-14T22:40:00Z");
    expect(t.usuarios[0]).toMatchObject({
      uid: "abc123",
      zonaNombre: "RUTA 21",
      pagos: { n: 31, importe: "8600.00" },
      coberturaPorSegmento: { sinVisitar: 46, sinNada: 46 },
      cobro: { pct: "65.90" },
    });
    expect(t.usuarios[0].lineas[0].porHora).toHaveLength(13);
    expect(t.usuarios[0].lineas[0].pausas[0]).toMatchObject({ anteriorId: "visita:412cc2fc-7d0e-4b8a-9c1f-5e6a7b8c9d0e", enCurso: false });
    expect(t.usuarios[1]).toMatchObject({ configurado: false, motivoNoConfigurado: "sin_zona", zonaId: null, lineas: [] });
    expect(Object.keys(t)).toEqual(["generadoAt", "periodo", "pausaMin", "usuarios"]);
  });

  it("tablero v2: cobro.falta viene del servidor y los nulos de no configurado se conservan", () => {
    const t = dtoToTablero(tableroDTO);
    expect(t.usuarios[0].cobro).toEqual({ cobrado: "8600.00", esperado: "13050.00", falta: "4450.00", pct: "65.90" });
    expect(t.usuarios[1]).toMatchObject({
      zonaId: null,
      zonaNombre: null,
      inicioSemana: null,
      estadoDesde: null,
      ultima: null,
      primeraActividad: null,
      ultimaActividad: null,
      cobro: { falta: "0.00", pct: null },
    });
  });

  it("línea v2: los puntos traen los datos de su popover (importe/resultado nulos según el tipo)", () => {
    const [pago, visita] = dtoToTablero(tableroDTO).usuarios[0].lineas[0].puntos;
    expect(pago).toEqual({
      id: "pago:15082369",
      tipo: "pago",
      hora: "2026-10-14T16:31:00Z",
      clienteNombre: "JUANA ANDRADE LECHUGA",
      importe: "150.00",
      resultado: null,
      numFotos: 2,
    });
    expect(visita).toMatchObject({ importe: null, resultado: "No se encontraba", numFotos: 0 });
  });

  it("jornada: actividades con pago y visita, señales, resumen y generado_at", () => {
    const j = dtoToJornada(jornadaDTO);
    expect(j.generadoAt).toBe("2026-10-14T22:40:00Z");
    expect(j.actividades[0].pago).toMatchObject({ formaCobro: "efectivo", pagoRecibidoId: "7a1f39e4-2b6c-4d1e-9f0a-3c5b8e2d1a47" });
    expect(j.actividades[1].visita).toMatchObject({ tipoVisita: "No se encontraba", estado: "no_estaba" });
    expect(j.actividades[1].registradoPor).toEqual({ usuarioUid: null, cobradorId: null, nombre: "Oficina", origen: "oficina" });
    expect(j.senales[0]).toMatchObject({ tipo: "mismo_punto", actividadIds: ["pago:15082369"] });
    expect(j.resumen.clientes).toBe(41);
  });

  it("actividad v2: docto_pv_id, captura_tardia, trato y etiqueta de la visita", () => {
    const pago = dtoToActividad(actividadPagoDTO);
    expect(pago).toMatchObject({ doctoPvId: 9921, capturaTardia: false, numFotos: 2, conGps: true });
    const visita = dtoToActividad(actividadVisitaDTO);
    expect(visita).toMatchObject({ doctoPvId: null, capturaTardia: true, ventaId: null, folio: null, lat: null, lng: null });
    expect(visita.visita).toEqual({
      visitaId: "412cc2fc-7d0e-4b8a-9c1f-5e6a7b8c9d0e",
      tipoVisita: "No se encontraba",
      nota: "Vecina dice que regresa el lunes",
      estado: "no_estaba",
      trato: "nadie",
      etiqueta: "No estaba",
    });
  });

  it("actividad y cuentas", () => {
    const p = dtoToPaginaActividad(paginaActividadDTO);
    expect(p.siguienteCursor).toBe("opaco-2");
    expect(p.totales).toEqual({ n: 1188, importe: "289450.00", porTipo: { pago: 980, visita: 200, condonacion: 8 } });
    const c = dtoToCuentas(cuentasDTO);
    expect(c.conteos.sinNada).toBe(46);
    expect(c.cuentas[0]).toMatchObject({ trato: "pagado", determinadoPor: "pago:15082369", abonoSemana: "150.00" });
    expect(c.cuentas[1]).toMatchObject({ doctoPvId: null, segmento: "sin_visitar", ultimaActividad: null, nueva: true });
  });

  it("catálogos y fotos", () => {
    const cat = dtoToCatalogos(catalogosDTO);
    expect(cat.formasCobro[0]).toEqual({ codigo: "efectivo", etiqueta: "Efectivo" });
    expect(cat.tiposVisita[0]).toEqual({ literal: "No se encontraba", estado: "no_estaba", grupo: "No estaba" });
    expect(dtoToImagen(imagenesDTO[0])).toMatchObject({ sizeBytes: 184320, descripcion: null });
    const sinDescripcion = { ...imagenesDTO[0] };
    delete sinDescripcion.descripcion;
    expect(dtoToImagen(sinDescripcion).descripcion).toBeNull();
  });

  it("un código que el contrato no conoce es un error, no un dato", () => {
    const malo = { ...cuentasDTO, cuentas: [{ ...cuentasDTO.cuentas[0], trato: "deposito" }] };
    expect(() => dtoToCuentas(malo)).toThrow(DomainError);
    expect(() => dtoToCuentas(malo)).toThrow(/trato/);
    const visitaMala = { ...actividadVisitaDTO, visita: { ...actividadVisitaDTO.visita!, trato: "casa" } };
    expect(() => dtoToActividad(visitaMala)).toThrow(/visita\.trato/);
    expect(() => dtoToActividad({ ...actividadPagoDTO, pago: { ...actividadPagoDTO.pago!, forma_cobro: "deposito" } })).toThrow(
      /forma_cobro/,
    );
    expect(() => dtoToCatalogos({ ...catalogosDTO, formas_cobro: [{ codigo: "deposito", etiqueta: "Depósito" }] })).toThrow(
      /formas_cobro/,
    );
  });
});
