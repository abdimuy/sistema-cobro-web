import { describe, it, expect } from "vitest";
import { dtoToFichaCliente } from "./dtoToFichaCliente";
import type { FichaDTO } from "../http/dtos";

function buildValidDTO(overrides: Partial<FichaDTO> = {}): FichaDTO {
  return {
    cliente_id: 3001,
    nombre: "Roberto Cervantes Gutiérrez",
    direccion: {
      calle: "Av. Insurgentes Sur 1234",
      colonia: "Del Valle",
      poblacion: "Ciudad de México",
      estado: "CDMX",
    },
    telefono: "5598765432",
    limite_credito: "15000.00",
    notas: "Comprador frecuente desde 2019",
    zona: "ZONA SUR",
    cobrador: "Carlos Mendoza",
    estatus: "A",
    resumen: {
      total_comprado: "85000.00",
      total_abonado: "72000.00",
      saldo: "13000.00",
      pct_liquidado: "84.70",
      ticket_promedio: "7083.33",
      num_ventas: 12,
      num_pagos: 48,
    },
    series: {
      abonos_por_mes: [
        { anio: 2025, mes: 1, monto: "2500.00" },
        { anio: 2025, mes: 2, monto: "3000.00" },
      ],
      comprado_vs_abonado: [
        {
          anio: 2025,
          mes: 1,
          comprado: "7000.00",
          cobranza: "1500.00",
          enganche: "1000.00",
          condonacion: "0.00",
          perdida: "0.00",
          otro: "0.00",
        },
        {
          anio: 2025,
          mes: 2,
          comprado: "0.00",
          cobranza: "2000.00",
          enganche: "0.00",
          condonacion: "500.00",
          perdida: "500.00",
          otro: "0.00",
        },
      ],
    },
    pulso: {
      score: 75,
      segmento: "LEAL_POR_LIQUIDAR",
      estado_pago: "ATRASADO",
      recencia_dias: 30,
      frecuencia: 12,
      monetary: "85000.00",
      saldo: "13000.00",
      por_liquidar_pct: "15.29",
      fecha_ultima_compra: "2025-02-15T09:00:00Z",
      fecha_ultimo_pago: "2025-03-01T14:30:00Z",
      next_best_product: "Comedor 6 personas",
      num_pagos: 48,
      cadencia_dias: 30,
      dias_atraso_prom: 2,
      pct_pagos_a_tiempo: "94.68",
      fecha_prox_pago: "2025-04-01T00:00:00Z",
      monto_prox_pago: "4000.00",
      tier_riesgo: "AL_DIA",
      banda_credito: "BAJO",
      score_credito: 85,
      credito_drivers: ["Historial limpio de pagos"],
      banda_recompra: "ALTA",
      score_recompra: 78,
      recompra_drivers: ["Alta frecuencia de compra"],
      clv: "8204.83",
      banda_clv: "ALTO",
      clv_drivers: ["recompra recurrente esperada", "ticket $9,483"],
      credito_resumen: "Buen pagador: al corriente.",
      recompra_resumen: "Muy probable que recompre — compró este mes.",
      clv_resumen: "Valor estimado $8,205 en 24m por su recompra y ticket de $9,483.",
      narrativa: "",
      rasgos_ia: [],
    },
    ubicacion: {
      lat: 19.4326,
      lng: -99.1332,
      disponible: true,
    },
    ...overrides,
  };
}

describe("dtoToFichaCliente", () => {
  it("happy path: maps all identity fields correctly", () => {
    const dto = buildValidDTO();
    const ficha = dtoToFichaCliente(dto);

    expect(ficha.clienteId).toBe(3001);
    expect(ficha.nombre).toBe("Roberto Cervantes Gutiérrez");
    expect(ficha.telefono).toBe("5598765432");
    expect(ficha.limiteCredito).toBe("15000.00");
    expect(ficha.notas).toBe("Comprador frecuente desde 2019");
    expect(ficha.zona).toBe("ZONA SUR");
    expect(ficha.cobrador).toBe("Carlos Mendoza");
    expect(ficha.estatus).toBe("A");
  });

  it("maps direccion components correctly", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    expect(ficha.direccion.calle).toBe("Av. Insurgentes Sur 1234");
    expect(ficha.direccion.colonia).toBe("Del Valle");
    expect(ficha.direccion.poblacion).toBe("Ciudad de México");
    expect(ficha.direccion.estado).toBe("CDMX");
  });

  it("maps resumen financial KPIs correctly, all as strings", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    expect(ficha.resumen.totalComprado).toBe("85000.00");
    expect(ficha.resumen.totalAbonado).toBe("72000.00");
    expect(ficha.resumen.saldo).toBe("13000.00");
    expect(ficha.resumen.pctLiquidado).toBe("84.70");
    expect(ficha.resumen.ticketPromedio).toBe("7083.33");
    expect(ficha.resumen.numVentas).toBe(12);
    expect(ficha.resumen.numPagos).toBe(48);
  });

  it("fans out abonos_por_mes series correctly", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    expect(ficha.resumen.abonosPorMes).toHaveLength(2);
    expect(ficha.resumen.abonosPorMes[0]).toEqual({ anio: 2025, mes: 1, monto: "2500.00" });
    expect(ficha.resumen.abonosPorMes[1]).toEqual({ anio: 2025, mes: 2, monto: "3000.00" });
  });

  it("fans out comprado_vs_abonado series correctly", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    expect(ficha.resumen.compradoVsAbonado).toHaveLength(2);
    expect(ficha.resumen.compradoVsAbonado[0]).toEqual({
      anio: 2025,
      mes: 1,
      comprado: "7000.00",
      cobranza: "1500.00",
      enganche: "1000.00",
      condonacion: "0.00",
      perdida: "0.00",
      otro: "0.00",
    });
  });

  it("maps pulso correctly when present", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    expect(ficha.pulso).not.toBeNull();
    const pulso = ficha.pulso!;
    expect(pulso.score).toBe(75);
    expect(pulso.segmento).toBe("LEAL_POR_LIQUIDAR");
    expect(pulso.estadoPago).toBe("ATRASADO");
    expect(pulso.recenciaDias).toBe(30);
    expect(pulso.frecuencia).toBe(12);
    expect(pulso.monetary).toBe("85000.00");
    expect(pulso.saldo).toBe("13000.00");
    expect(pulso.porLiquidarPct).toBe("15.29");
    expect(pulso.nextBestProduct).toBe("Comedor 6 personas");
  });

  it("maps pulso dates as Date instances", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    const pulso = ficha.pulso!;
    expect(pulso.fechaUltimaCompra).toBeInstanceOf(Date);
    expect(pulso.fechaUltimaCompra!.getTime()).toBe(
      new Date("2025-02-15T09:00:00Z").getTime(),
    );
    expect(pulso.fechaUltimoPago).toBeInstanceOf(Date);
    expect(pulso.fechaUltimoPago!.getTime()).toBe(
      new Date("2025-03-01T14:30:00Z").getTime(),
    );
  });

  it("maps empty pulso dates to null", () => {
    const dto = buildValidDTO();
    dto.pulso!.fecha_ultima_compra = "";
    dto.pulso!.fecha_ultimo_pago = "";
    const ficha = dtoToFichaCliente(dto);
    expect(ficha.pulso!.fechaUltimaCompra).toBeNull();
    expect(ficha.pulso!.fechaUltimoPago).toBeNull();
  });

  it("sets pulso to null when backend sends null", () => {
    const dto = buildValidDTO({ pulso: null });
    const ficha = dtoToFichaCliente(dto);
    expect(ficha.pulso).toBeNull();
  });

  it("throws DomainError on invalid pulso segmento", () => {
    const dto = buildValidDTO();
    dto.pulso!.segmento = "SEGMENTO_FICTICIO";
    expect(() => dtoToFichaCliente(dto)).toThrowError(
      expect.objectContaining({ code: "segmento_invalido" }),
    );
  });

  it("throws DomainError on invalid pulso estado_pago", () => {
    const dto = buildValidDTO();
    dto.pulso!.estado_pago = "RARO";
    expect(() => dtoToFichaCliente(dto)).toThrowError(
      expect.objectContaining({ code: "estado_pago_invalido" }),
    );
  });

  it("throws DomainError on invalid pulso fecha_ultima_compra", () => {
    const dto = buildValidDTO();
    dto.pulso!.fecha_ultima_compra = "no-es-fecha";
    expect(() => dtoToFichaCliente(dto)).toThrowError(
      expect.objectContaining({ code: "fecha_ultima_compra_invalida" }),
    );
  });

  it("decimal values in pulso are kept as strings", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    expect(typeof ficha.pulso!.monetary).toBe("string");
    expect(typeof ficha.pulso!.saldo).toBe("string");
    expect(typeof ficha.pulso!.porLiquidarPct).toBe("string");
  });

  // ── Cobranza intelligence fields ────────────────────────────────────────────

  it("maps cobranza numeric fields correctly", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    const pulso = ficha.pulso!;
    expect(pulso.numPagos).toBe(48);
    expect(pulso.cadenciaDias).toBe(30);
    expect(pulso.diasAtrasoProm).toBe(2);
  });

  it("maps pctPagosATiempo and tierRiesgo as strings", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    const pulso = ficha.pulso!;
    expect(pulso.pctPagosATiempo).toBe("94.68");
    expect(typeof pulso.pctPagosATiempo).toBe("string");
    expect(pulso.tierRiesgo).toBe("AL_DIA");
    expect(typeof pulso.tierRiesgo).toBe("string");
  });

  it("maps montoProxPago as string", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    expect(pulso(ficha).montoProxPago).toBe("4000.00");
    expect(typeof pulso(ficha).montoProxPago).toBe("string");
  });

  it("maps fecha_prox_pago as Date instance", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    expect(pulso(ficha).fechaProxPago).toBeInstanceOf(Date);
    expect(pulso(ficha).fechaProxPago!.getTime()).toBe(
      new Date("2025-04-01T00:00:00Z").getTime(),
    );
  });

  it("maps empty fecha_prox_pago to null", () => {
    const dto = buildValidDTO();
    dto.pulso!.fecha_prox_pago = "";
    const ficha = dtoToFichaCliente(dto);
    expect(ficha.pulso!.fechaProxPago).toBeNull();
  });

  // ── Ubicación ────────────────────────────────────────────────────────────────

  it("maps ubicacion when disponible=true", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    expect(ficha.ubicacion.disponible).toBe(true);
    expect(ficha.ubicacion.lat).toBe(19.4326);
    expect(ficha.ubicacion.lng).toBe(-99.1332);
  });

  it("maps ubicacion when disponible=false", () => {
    const dto = buildValidDTO({ ubicacion: { lat: 0, lng: 0, disponible: false } });
    const ficha = dtoToFichaCliente(dto);
    expect(ficha.ubicacion.disponible).toBe(false);
    expect(ficha.ubicacion.lat).toBe(0);
    expect(ficha.ubicacion.lng).toBe(0);
  });

  it("maps zero cobranza values when client has no payments", () => {
    const dto = buildValidDTO();
    dto.pulso!.num_pagos = 0;
    dto.pulso!.cadencia_dias = 0;
    dto.pulso!.dias_atraso_prom = 0;
    dto.pulso!.pct_pagos_a_tiempo = "";
    dto.pulso!.fecha_prox_pago = "";
    dto.pulso!.monto_prox_pago = "0.00";
    dto.pulso!.tier_riesgo = "";
    const ficha = dtoToFichaCliente(dto);
    const p = ficha.pulso!;
    expect(p.numPagos).toBe(0);
    expect(p.cadenciaDias).toBe(0);
    expect(p.diasAtrasoProm).toBe(0);
    expect(p.pctPagosATiempo).toBe("");
    expect(p.fechaProxPago).toBeNull();
    expect(p.montoProxPago).toBe("0.00");
    expect(p.tierRiesgo).toBe("");
  });

  it("maps banda_credito, score_credito, and credito_drivers from pulso DTO", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    const p = ficha.pulso!;
    expect(p.bandaCredito).toBe("BAJO");
    expect(p.scoreCredito).toBe(85);
    expect(p.creditoDrivers).toEqual(["Historial limpio de pagos"]);
  });

  it("maps bandaCredito to undefined when banda_credito is empty (no aplica)", () => {
    const dto = buildValidDTO();
    dto.pulso!.banda_credito = "";
    dto.pulso!.score_credito = 0;
    dto.pulso!.credito_drivers = [];
    const ficha = dtoToFichaCliente(dto);
    const p = ficha.pulso!;
    expect(p.bandaCredito).toBeUndefined();
    expect(p.scoreCredito).toBeUndefined();
    expect(p.creditoDrivers).toBeUndefined();
  });

  // ── Recompra propensity ─────────────────────────────────────────────────────

  it("maps banda_recompra, score_recompra, and recompra_drivers from pulso DTO", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    const p = ficha.pulso!;
    expect(p.bandaRecompra).toBe("ALTA");
    expect(p.scoreRecompra).toBe(78);
    expect(p.recompraDrivers).toEqual(["Alta frecuencia de compra"]);
  });

  it("maps bandaRecompra to undefined when banda_recompra is empty (no aplica)", () => {
    const dto = buildValidDTO();
    dto.pulso!.banda_recompra = "";
    dto.pulso!.score_recompra = 0;
    dto.pulso!.recompra_drivers = [];
    const ficha = dtoToFichaCliente(dto);
    const p = ficha.pulso!;
    expect(p.bandaRecompra).toBeUndefined();
    expect(p.scoreRecompra).toBeUndefined();
    expect(p.recompraDrivers).toBeUndefined();
  });

  // ── CLV ─────────────────────────────────────────────────────────────────────

  it("maps clv and banda_clv from pulso DTO", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    const p = ficha.pulso!;
    expect(p.clv).toBe("8204.83");
    expect(p.bandaClv).toBe("ALTO");
  });

  it("maps clv to undefined when clv is empty (no aplica)", () => {
    const dto = buildValidDTO();
    dto.pulso!.clv = "";
    dto.pulso!.banda_clv = "";
    const ficha = dtoToFichaCliente(dto);
    const p = ficha.pulso!;
    expect(p.clv).toBeUndefined();
    expect(p.bandaClv).toBeUndefined();
  });

  // ── Titulares y drivers cuantificados (Fase 1) ───────────────────────────────

  it("maps clv_drivers, credito_resumen, recompra_resumen and clv_resumen from pulso DTO", () => {
    const ficha = dtoToFichaCliente(buildValidDTO());
    const p = ficha.pulso!;
    expect(p.clvDrivers).toEqual(["recompra recurrente esperada", "ticket $9,483"]);
    expect(p.creditoResumen).toBe("Buen pagador: al corriente.");
    expect(p.recompraResumen).toBe("Muy probable que recompre — compró este mes.");
    expect(p.clvResumen).toBe("Valor estimado $8,205 en 24m por su recompra y ticket de $9,483.");
  });

  // ── Narrativa y rasgos IA ────────────────────────────────────────────────────

  it("maps narrativa and rasgos_ia from pulso DTO when populated", () => {
    const dto = buildValidDTO();
    dto.pulso!.narrativa = "Cliente con potencial moderado. Últimamente activo tras período dormido.";
    dto.pulso!.rasgos_ia = ["Reactivación reciente", "Patrón de compra estable"];
    const ficha = dtoToFichaCliente(dto);
    const p = ficha.pulso!;
    expect(p.narrativa).toBe("Cliente con potencial moderado. Últimamente activo tras período dormido.");
    expect(p.rasgosIA).toEqual(["Reactivación reciente", "Patrón de compra estable"]);
  });

  it("maps narrativa to undefined and rasgosIA to undefined when both empty", () => {
    const dto = buildValidDTO();
    dto.pulso!.narrativa = "";
    dto.pulso!.rasgos_ia = [];
    const ficha = dtoToFichaCliente(dto);
    const p = ficha.pulso!;
    expect(p.narrativa).toBeUndefined();
    expect(p.rasgosIA).toBeUndefined();
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function pulso(ficha: ReturnType<typeof dtoToFichaCliente>) {
  return ficha.pulso!;
}
