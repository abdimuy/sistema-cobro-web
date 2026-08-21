import { describe, expect, it } from "vitest";
import {
  agrupar,
  claveDe,
  cuantoDe,
  moduloDe,
  quienDe,
} from "../IntentoAgrupado";
import { makeFakeIntent } from "../../../application/__tests__/fakeRepoPort";

const CUERPO_VENTA = {
  cliente: { nombre: "  Antonia Jiménez Pérez  " },
  tipo_venta: "CREDITO",
  montos: { anual: "18000.00", corto_plazo: "12500.50", contado: "9800.00" },
};

describe("moduloDe", () => {
  it("deriva el módulo de la ruta, que es el único dato que lo dice", () => {
    expect(moduloDe("/v2/ventas")).toBe("ventas");
    expect(moduloDe("/v2/ventas/123/aplicar")).toBe("ventas");
    expect(moduloDe("/v2/cobranza/pagos")).toBe("pagos");
    expect(moduloDe("/v2/pagos")).toBe("pagos");
    expect(moduloDe("/v2/clientes")).toBe("otro");
  });
});

describe("claveDe", () => {
  it("la Idempotency-Key identifica el trabajo", () => {
    expect(claveDe(makeFakeIntent({ id: "a", idempotencyKey: "venta-77" }))).toBe("venta-77");
  });

  it("sin clave usable, cada captura es su propio grupo", () => {
    // Juntar dos capturas sin clave sería peor que mostrarlas separadas: no
    // hay nada que pruebe que son el mismo trabajo.
    expect(claveDe(makeFakeIntent({ id: "a", idempotencyKey: null }))).toBe("a");
    expect(claveDe(makeFakeIntent({ id: "b", idempotencyKey: "   " }))).toBe("b");
  });
});

describe("quienDe / cuantoDe", () => {
  it("leen la forma que POST /v2/ventas acepta", () => {
    expect(quienDe(CUERPO_VENTA)).toBe("Antonia Jiménez Pérez");
    expect(cuantoDe(CUERPO_VENTA)).toBe(12500.5);
  });

  it("de contado, el monto que importa es el de contado", () => {
    expect(cuantoDe({ ...CUERPO_VENTA, tipo_venta: "CONTADO" })).toBe(9800);
  });

  it("saltan los montos en cero en vez de mostrar $0", () => {
    expect(
      cuantoDe({ tipo_venta: "CREDITO", montos: { corto_plazo: "0.00", anual: "4200.00" } }),
    ).toBe(4200);
  });

  it("devuelven null en vez de adivinar cuando el cuerpo no tiene forma de venta", () => {
    for (const cuerpo of [null, undefined, "texto", 42, [], {}, { cliente: "test" }]) {
      expect(quienDe(cuerpo)).toBeNull();
      expect(cuantoDe(cuerpo)).toBeNull();
    }
  });
});

describe("agrupar", () => {
  it("trece intentos de la misma venta rinden UNA unidad que dice trece", () => {
    const intentos = Array.from({ length: 13 }, (_, i) =>
      makeFakeIntent({
        id: `id-${i}`,
        idempotencyKey: "venta-77",
        receivedAt: new Date(`2026-08-19T13:${String(20 + i).padStart(2, "0")}:00.000Z`),
        body: CUERPO_VENTA,
      }),
    );

    const grupos = agrupar(intentos);

    expect(grupos).toHaveLength(1);
    expect(grupos[0].intentos).toBe(13);
    expect(grupos[0].clave).toBe("venta-77");
  });

  it("el representante es el MÁS RECIENTE: su cuerpo es el que sirve para reenviar", () => {
    const grupos = agrupar([
      makeFakeIntent({
        id: "viejo",
        idempotencyKey: "k",
        receivedAt: new Date("2026-08-19T13:20:00.000Z"),
        body: { cliente: { nombre: "Nombre viejo" } },
      }),
      makeFakeIntent({
        id: "nuevo",
        idempotencyKey: "k",
        receivedAt: new Date("2026-08-19T13:33:00.000Z"),
        body: { cliente: { nombre: "Nombre corregido" } },
      }),
    ]);

    expect(grupos[0].id).toBe("nuevo");
    expect(grupos[0].quien).toBe("Nombre corregido");
  });

  it("primero y último son los extremos reales, no el orden de llegada de la lista", () => {
    const grupos = agrupar([
      makeFakeIntent({
        id: "b",
        idempotencyKey: "k",
        receivedAt: new Date("2026-08-19T13:33:00.000Z"),
      }),
      makeFakeIntent({
        id: "a",
        idempotencyKey: "k",
        receivedAt: new Date("2026-08-19T13:20:00.000Z"),
      }),
    ]);

    expect(grupos[0].primero.toISOString()).toBe("2026-08-19T13:20:00.000Z");
    expect(grupos[0].ultimo.toISOString()).toBe("2026-08-19T13:33:00.000Z");
  });

  it("cuenta los reintentos que el servidor ya colapsó en la fila", () => {
    // Tras la dedup del backend, UNA fila puede representar trece intentos:
    // uno propio más doce que RETRY_COUNT ya contó.
    const grupos = agrupar([
      makeFakeIntent({ id: "a", idempotencyKey: "k", retryCount: 12 }),
    ]);
    expect(grupos[0].intentos).toBe(13);
  });

  it("suma filas sueltas y reintentos colapsados sin perder ninguno", () => {
    const grupos = agrupar([
      makeFakeIntent({
        id: "a",
        idempotencyKey: "k",
        retryCount: 3,
        receivedAt: new Date("2026-08-19T13:20:00.000Z"),
      }),
      makeFakeIntent({
        id: "b",
        idempotencyKey: "k",
        retryCount: 0,
        receivedAt: new Date("2026-08-19T13:30:00.000Z"),
      }),
    ]);
    expect(grupos[0].intentos).toBe(5); // (1+3) + (1+0)
  });

  it("clasifica por el intento más reciente y nunca titula 'error desconocido'", () => {
    const grupos = agrupar([
      makeFakeIntent({
        id: "a",
        idempotencyKey: "k",
        receivedAt: new Date("2026-08-19T13:20:00.000Z"),
        httpStatus: 500,
        errorCode: null,
        errorMessage: null,
      }),
      makeFakeIntent({
        id: "b",
        idempotencyKey: "k",
        receivedAt: new Date("2026-08-19T13:30:00.000Z"),
        httpStatus: 422,
        errorCode: "articulo_sin_existencia",
        errorMessage: "sin existencia",
      }),
    ]);

    expect(grupos[0].causa.value).toBe("falta_inventario");
    expect(grupos[0].urgencia.necesitaAccion()).toBe(true);
    expect(grupos[0].titulo).toBe("Sin existencia en almacén");
  });

  it("sin código, el título es el mensaje del servidor", () => {
    const grupos = agrupar([
      makeFakeIntent({
        idempotencyKey: "k",
        httpStatus: 422,
        errorCode: null,
        errorMessage: "el nombre del cliente es obligatorio",
      }),
    ]);
    expect(grupos[0].titulo).toBe("el nombre del cliente es obligatorio");
    expect(grupos[0].urgencia.necesitaAccion()).toBe(false);
  });

  it("ventas y pagos conviven: la agrupación no los mezcla ni los separa por módulo", () => {
    const grupos = agrupar([
      makeFakeIntent({ id: "v", idempotencyKey: "venta-1", path: "/v2/ventas" }),
      makeFakeIntent({ id: "p", idempotencyKey: "pago-1", path: "/v2/cobranza/pagos" }),
    ]);

    expect(grupos).toHaveLength(2);
    expect(grupos.map((g) => g.modulo).sort()).toEqual(["pagos", "ventas"]);
  });

  it("recuerda que hubo evidencia si CUALQUIER intento del grupo la trajo", () => {
    const grupos = agrupar([
      makeFakeIntent({
        id: "a",
        idempotencyKey: "k",
        hasBlob: true,
        receivedAt: new Date("2026-08-19T13:20:00.000Z"),
      }),
      makeFakeIntent({
        id: "b",
        idempotencyKey: "k",
        hasBlob: false,
        receivedAt: new Date("2026-08-19T13:30:00.000Z"),
      }),
    ]);
    expect(grupos[0].tieneEvidencia).toBe(true);
  });

  it("cae de pie con la lista vacía", () => {
    expect(agrupar([])).toEqual([]);
  });
});
