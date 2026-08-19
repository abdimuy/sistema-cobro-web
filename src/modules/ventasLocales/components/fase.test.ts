import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import type { VentaLocal } from "@/services/api/getVentasLocales";
import { DIAS_PARA_DETENIDA, deriveFase, textoRelativo } from "./fase";

const AHORA = new Date("2026-08-18T18:00:00Z");
const MS_POR_DIA = 86_400_000;
const MINUTO = 60_000;

/** ISO de un instante `ms` milisegundos antes de AHORA. */
const hace = (ms: number): string => new Date(AHORA.getTime() - ms).toISOString();

const VENTA_BASE: VentaLocal = {
  LOCAL_SALE_ID: "7c2f1e40-9a3b-4c1d-8e55-2b7d4f6a9c31",
  USER_EMAIL: "marco.antonio.luna@muebleriamsp.mx",
  ALMACEN_ID: 19,
  NOMBRE_CLIENTE: "Eva Mendoza Hernández",
  FECHA_VENTA: "2026-08-12T15:04:00Z",
  LATITUD: 18.36,
  LONGITUD: -97.4,
  DIRECCION: "Av. Independencia 214",
  PRECIO_TOTAL: 14800,
  TELEFONO: "2381234567",
  ESTADO: "active",
  SITUACION: "borrador",
  SINCRONIZACION: "pendiente",
};

const venta = (cambios: Partial<VentaLocal> = {}): VentaLocal => ({
  ...VENTA_BASE,
  ...cambios,
});

describe("deriveFase — las seis salidas", () => {
  it("1 Borrador cuando la situación es borrador", () => {
    const fase = deriveFase(venta({ SITUACION: "borrador" }), AHORA);

    expect(fase.kind).toBe("borrador");
    expect(fase.numero).toBe(1);
    expect(fase.nombre).toBe("Borrador");
    expect(fase.arcos).toBe(1);
  });

  it("2 Revisada cuando la situación es revisada", () => {
    const fase = deriveFase(venta({ SITUACION: "revisada" }), AHORA);

    expect(fase.numero).toBe(2);
    expect(fase.nombre).toBe("Revisada");
    expect(fase.arcos).toBe(2);
  });

  it("3 Aprobada cuando está aprobada y sigue pendiente de Microsip", () => {
    const fase = deriveFase(
      venta({ SITUACION: "aprobada", SINCRONIZACION: "pendiente" }),
      AHORA
    );

    expect(fase.numero).toBe(3);
    expect(fase.nombre).toBe("Aprobada");
    expect(fase.arcos).toBe(3);
  });

  it("4 Aplicada gana a la situación: la sincronización manda", () => {
    const fase = deriveFase(
      venta({ SITUACION: "aprobada", SINCRONIZACION: "aplicada" }),
      AHORA
    );

    expect(fase.kind).toBe("aplicada");
    expect(fase.numero).toBe(4);
    expect(fase.arcos).toBe(4);
  });

  it("Cancelada sale del carril y se queda sin número", () => {
    const fase = deriveFase(venta({ SITUACION: "cancelada" }), AHORA);

    expect(fase.kind).toBe("cancelada");
    expect(fase.numero).toBeNull();
    expect(fase.enCarril).toBe(false);
  });

  it("Eliminada gana a todo lo demás", () => {
    const fase = deriveFase(
      venta({ ESTADO: "deleted", SITUACION: "cancelada", SINCRONIZACION: "aplicada" }),
      AHORA
    );

    expect(fase.kind).toBe("eliminada");
    expect(fase.numero).toBeNull();
  });
});

describe("deriveFase — las salidas del carril conservan el avance", () => {
  it("cancelada DESPUÉS de haber llegado a Microsip conserva los cuatro arcos", () => {
    const fase = deriveFase(
      venta({
        SITUACION: "cancelada",
        SINCRONIZACION: "aplicada",
        MICROSIP_APLICADA_AT: "2026-08-16T17:03:00Z",
        APROBADO_AT: "2026-08-16T16:00:00Z",
      }),
      AHORA
    );

    expect(fase.kind).toBe("cancelada");
    expect(fase.arcos).toBe(4);
    expect(fase.meta).toBe("ya estaba en Microsip");
  });

  it("cancelada tras aprobarse conserva tres arcos", () => {
    const fase = deriveFase(
      venta({ SITUACION: "cancelada", APROBADO_AT: "2026-08-16T16:00:00Z" }),
      AHORA
    );

    expect(fase.arcos).toBe(3);
    expect(fase.meta).toBe("llegó a aprobada");
  });

  it("cancelada sin aprobación se queda en el primer arco", () => {
    const fase = deriveFase(venta({ SITUACION: "cancelada" }), AHORA);

    expect(fase.arcos).toBe(1);
    expect(fase.meta).toBe("llegó a borrador");
  });

  it("eliminada conserva la situación que alcanzó", () => {
    const fase = deriveFase(
      venta({ ESTADO: "deleted", SITUACION: "revisada" }),
      AHORA
    );

    expect(fase.arcos).toBe(2);
    expect(fase.meta).toBe("llegó a revisada");
  });
});

describe("deriveFase — umbrales de detenida", () => {
  it("los umbrales son los que decidió el dueño", () => {
    expect(DIAS_PARA_DETENIDA[1]).toBe(2);
    expect(DIAS_PARA_DETENIDA[2]).toBe(1);
    expect(DIAS_PARA_DETENIDA[3]).toBe(1);
    expect(DIAS_PARA_DETENIDA[4]).toBeNull();
  });

  const casos = [
    { situacion: "borrador" as const, numero: 1, dias: 2 },
    { situacion: "revisada" as const, numero: 2, dias: 1 },
    { situacion: "aprobada" as const, numero: 3, dias: 1 },
  ];

  for (const caso of casos) {
    it(`fase ${caso.numero}: justo debajo de ${caso.dias} d no está detenida`, () => {
      const fase = deriveFase(
        venta({
          SITUACION: caso.situacion,
          FASE_DESDE: hace(caso.dias * MS_POR_DIA - MINUTO),
        }),
        AHORA
      );

      expect(fase.numero).toBe(caso.numero);
      expect(fase.detenida).toBe(false);
      expect(fase.meta).not.toContain("detenida");
    });

    it(`fase ${caso.numero}: justo encima de ${caso.dias} d sí está detenida`, () => {
      const fase = deriveFase(
        venta({
          SITUACION: caso.situacion,
          FASE_DESDE: hace(caso.dias * MS_POR_DIA + MINUTO),
        }),
        AHORA
      );

      expect(fase.detenida).toBe(true);
      expect(fase.meta).toBe(`detenida ${caso.dias} d`);
      expect(fase.metaCompacta).toBe(`${caso.dias} d`);
    });
  }

  it("exactamente en el umbral todavía no está detenida", () => {
    const fase = deriveFase(
      venta({ SITUACION: "revisada", FASE_DESDE: hace(MS_POR_DIA) }),
      AHORA
    );

    expect(fase.detenida).toBe(false);
  });

  it("una aplicada nunca se marca detenida, por vieja que sea", () => {
    const fase = deriveFase(
      venta({
        SITUACION: "aprobada",
        SINCRONIZACION: "aplicada",
        MICROSIP_APLICADA_AT: "2026-06-01T17:03:00Z",
        FASE_DESDE: hace(90 * MS_POR_DIA),
      }),
      AHORA
    );

    expect(fase.detenida).toBe(false);
  });

  it("una cancelada nunca se marca detenida", () => {
    const fase = deriveFase(
      venta({ SITUACION: "cancelada", FASE_DESDE: hace(90 * MS_POR_DIA) }),
      AHORA
    );

    expect(fase.detenida).toBe(false);
  });

  it("una eliminada nunca se marca detenida", () => {
    const fase = deriveFase(
      venta({ ESTADO: "deleted", FASE_DESDE: hace(90 * MS_POR_DIA) }),
      AHORA
    );

    expect(fase.detenida).toBe(false);
  });
});

describe("deriveFase — el segundo renglón", () => {
  it("sin fase_desde no hay segundo renglón ni marca de detenida", () => {
    const fase = deriveFase(venta({ SITUACION: "aprobada" }), AHORA);

    expect(fase.meta).toBeNull();
    expect(fase.metaCompacta).toBeNull();
    expect(fase.detenida).toBe(false);
    expect(fase.diasEnFase).toBeNull();
  });

  it("no usa updated_at como sustituto de fase_desde", () => {
    const fase = deriveFase(
      venta({ SITUACION: "aprobada", UPDATED_AT: hace(30 * MS_POR_DIA) }),
      AHORA
    );

    expect(fase.meta).toBeNull();
    expect(fase.detenida).toBe(false);
  });

  it("en las fases 1 a 3 muestra tiempo relativo", () => {
    const fase = deriveFase(
      venta({ SITUACION: "borrador", FASE_DESDE: hace(20 * MINUTO) }),
      AHORA
    );

    expect(fase.meta).toBe("hace 20 min");
  });

  it("en la fase 4 muestra la FECHA de aplicación, no tiempo relativo", () => {
    const aplicadaAt = "2026-08-18T17:03:00Z";
    const fase = deriveFase(
      venta({
        SITUACION: "aprobada",
        SINCRONIZACION: "aplicada",
        MICROSIP_APLICADA_AT: aplicadaAt,
        FASE_DESDE: hace(3 * 3_600_000),
      }),
      AHORA
    );

    expect(fase.meta).toBe(dayjs(aplicadaAt).format("DD/MM HH:mm"));
    expect(fase.meta).not.toContain("hace");
  });

  it("la fase 4 sin fecha de aplicación omite el renglón", () => {
    const fase = deriveFase(
      venta({ SINCRONIZACION: "aplicada", FASE_DESDE: hace(3 * 3_600_000) }),
      AHORA
    );

    expect(fase.meta).toBeNull();
  });
});

describe("textoRelativo", () => {
  it("minutos, horas y días", () => {
    expect(textoRelativo(20 * MINUTO)).toBe("hace 20 min");
    expect(textoRelativo(3 * 3_600_000)).toBe("hace 3 h");
    expect(textoRelativo(4 * MS_POR_DIA)).toBe("hace 4 d");
  });

  it("nunca dice 'hace 0 min' ni cuenta hacia el futuro", () => {
    expect(textoRelativo(5_000)).toBe("hace 1 min");
    expect(textoRelativo(-90_000)).toBe("hace 1 min");
  });
});

describe("deriveFase — fase_alcanzada manda sobre la heurística", () => {
  it("cancelada en revisada dibuja DOS arcos y dice que llegó a revisada", () => {
    const fase = deriveFase(
      venta({ SITUACION: "cancelada", FASE_ALCANZADA: 2 }),
      AHORA
    );

    expect(fase.kind).toBe("cancelada");
    expect(fase.arcos).toBe(2);
    expect(fase.meta).toBe("llegó a revisada");
  });

  it("cancelada que ya estaba en Microsip dibuja cuatro arcos", () => {
    const fase = deriveFase(
      venta({ SITUACION: "cancelada", FASE_ALCANZADA: 4 }),
      AHORA
    );

    expect(fase.arcos).toBe(4);
    expect(fase.meta).toBe("ya estaba en Microsip");
  });

  it("cancelada con fase_alcanzada 3 sin APROBADO_AT: gana el campo", () => {
    const fase = deriveFase(
      venta({ SITUACION: "cancelada", FASE_ALCANZADA: 3 }),
      AHORA
    );

    expect(fase.arcos).toBe(3);
    expect(fase.meta).toBe("llegó a aprobada");
  });

  it("cancelada con fase_alcanzada 1 aunque traiga APROBADO_AT: gana el campo", () => {
    const fase = deriveFase(
      venta({
        SITUACION: "cancelada",
        APROBADO_AT: "2026-08-16T16:00:00Z",
        FASE_ALCANZADA: 1,
      }),
      AHORA
    );

    expect(fase.arcos).toBe(1);
    expect(fase.meta).toBe("llegó a borrador");
  });

  it("eliminada: el campo gana a la inferencia por SITUACION", () => {
    const fase = deriveFase(
      venta({ ESTADO: "deleted", SITUACION: "borrador", FASE_ALCANZADA: 3 }),
      AHORA
    );

    expect(fase.kind).toBe("eliminada");
    expect(fase.arcos).toBe(3);
    expect(fase.meta).toBe("llegó a aprobada");
  });

  it("eliminada sin el campo conserva la inferencia de hoy", () => {
    const fase = deriveFase(
      venta({ ESTADO: "deleted", SITUACION: "revisada" }),
      AHORA
    );

    expect(fase.arcos).toBe(2);
    expect(fase.meta).toBe("llegó a revisada");
  });

  it("un valor fuera de 1..4 se ignora y vuelve la heurística", () => {
    const fuera = [0, 5, -1, 2.5, Number.NaN] as const;

    for (const valor of fuera) {
      const fase = deriveFase(
        venta({
          SITUACION: "cancelada",
          APROBADO_AT: "2026-08-16T16:00:00Z",
          FASE_ALCANZADA: valor,
        }),
        AHORA
      );

      expect(fase.arcos).toBe(3);
    }
  });
});

describe("deriveFase — fase_alcanzada NO altera el carril", () => {
  it("regresada a borrador con fase_alcanzada 3 se dibuja como 1 Borrador", () => {
    const fase = deriveFase(
      venta({ SITUACION: "borrador", FASE_ALCANZADA: 3 }),
      AHORA
    );

    expect(fase.kind).toBe("borrador");
    expect(fase.numero).toBe(1);
    expect(fase.arcos).toBe(1);
  });

  it("revisada con fase_alcanzada 4 sigue siendo 2 Revisada", () => {
    const fase = deriveFase(
      venta({ SITUACION: "revisada", FASE_ALCANZADA: 4 }),
      AHORA
    );

    expect(fase.numero).toBe(2);
    expect(fase.arcos).toBe(2);
  });

  it("aplicada con fase_alcanzada 2 sigue mostrando los cuatro arcos", () => {
    const fase = deriveFase(
      venta({ SINCRONIZACION: "aplicada", FASE_ALCANZADA: 2 }),
      AHORA
    );

    expect(fase.kind).toBe("aplicada");
    expect(fase.numero).toBe(4);
    expect(fase.arcos).toBe(4);
  });
});
