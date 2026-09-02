import { describe, expect, it } from "vitest";
import {
  ZONA_DE_NEGOCIO,
  desdeRelojDeNegocio,
  enRelojDeNegocio,
  inicioDelDiaDeNegocio,
  offsetDeNegocioEnMinutos,
  rangoDeDiasDeNegocio,
  relojDeNegocioSeguro,
} from "./tiempoDeNegocio";

// El contrato con el API (docs/module-standards/DATETIME_HANDLING.md):
// "todas las ventas del 13 de mayo" ancladas a CDMX se piden como
// desde=2026-05-13T06:00:00Z y hasta=2026-05-14T06:00:00Z.
//
// La regla dura del estándar: **anclar a la zona del negocio, NUNCA a la del
// navegador**. Un vendedor remoto en otra zona horaria tiene que ver el mismo
// día que el admin en CDMX.

describe("ZONA_DE_NEGOCIO", () => {
  it("es la misma zona que BusinessTZ() del backend", () => {
    // Si alguien la cambia aquí sin migrar datos, reinterpreta toda la
    // historia. El backend la fija en internal/platform/firebird/tz.go.
    expect(ZONA_DE_NEGOCIO).toBe("America/Mexico_City");
  });
});

describe("offsetDeNegocioEnMinutos", () => {
  it("hoy son 6 horas detrás de UTC", () => {
    expect(offsetDeNegocioEnMinutos(new Date("2026-08-20T18:00:00Z"))).toBe(-360);
  });

  it("en 2022, ANTES de que México aboliera el horario de verano, eran 5", () => {
    // Ésta es la prueba de que el offset sale de las reglas IANA y no de un
    // -06:00 escrito a mano. México dejó el horario de verano en octubre de
    // 2022; en junio de ese año CDMX estaba en UTC-5.
    expect(offsetDeNegocioEnMinutos(new Date("2022-06-15T18:00:00Z"))).toBe(-300);
  });

  it("y en diciembre de 2022, ya sin horario de verano, 6", () => {
    expect(offsetDeNegocioEnMinutos(new Date("2022-12-15T18:00:00Z"))).toBe(-360);
  });
});

describe("inicioDelDiaDeNegocio", () => {
  it("la medianoche del 20 de agosto en CDMX son las 06:00Z", () => {
    expect(inicioDelDiaDeNegocio("2026-08-20").toISOString()).toBe(
      "2026-08-20T06:00:00.000Z",
    );
  });

  it("respeta las reglas históricas: en junio de 2022 eran las 05:00Z", () => {
    expect(inicioDelDiaDeNegocio("2022-06-15").toISOString()).toBe(
      "2022-06-15T05:00:00.000Z",
    );
  });

  it("la zona es un parámetro EXPLÍCITO, no la del navegador", () => {
    // La prueba de que el anclaje es real: con otra zona, otro instante.
    // Si la implementación usara la zona del runner, las dos darían igual.
    expect(inicioDelDiaDeNegocio("2026-08-20", "UTC").toISOString()).toBe(
      "2026-08-20T00:00:00.000Z",
    );
    expect(inicioDelDiaDeNegocio("2026-08-20", "America/Mexico_City").toISOString()).toBe(
      "2026-08-20T06:00:00.000Z",
    );
  });

  it("rechaza lo que no es un día de calendario, en vez de adivinar", () => {
    // Explícito: falla fuerte. Interpretar mal un filtro de fechas es cómo se
    // pierden ventas de un reporte sin que nadie lo note.
    expect(() => inicioDelDiaDeNegocio("20/08/2026")).toThrow();
    expect(() => inicioDelDiaDeNegocio("2026-08-20T13:00:00Z")).toThrow();
    expect(() => inicioDelDiaDeNegocio("")).toThrow();
    expect(() => inicioDelDiaDeNegocio("2026-13-01")).toThrow();
  });
});

describe("rangoDeDiasDeNegocio", () => {
  it("un solo día cubre sus 24 horas locales completas", () => {
    expect(rangoDeDiasDeNegocio("2026-08-20", "2026-08-20")).toEqual({
      desde: "2026-08-20T06:00:00Z",
      hasta: "2026-08-21T06:00:00Z",
    });
  });

  it("varios días van del inicio del primero al inicio del siguiente al último", () => {
    expect(rangoDeDiasDeNegocio("2026-07-17", "2026-07-20")).toEqual({
      desde: "2026-07-17T06:00:00Z",
      hasta: "2026-07-21T06:00:00Z",
    });
  });

  it("sin milisegundos: el API exige RFC3339 estricto", () => {
    const { desde, hasta } = rangoDeDiasDeNegocio("2026-08-20", "2026-08-20");
    expect(desde).not.toMatch(/\.\d{3}Z$/);
    expect(hasta).not.toMatch(/\.\d{3}Z$/);
  });

  // ── La regresión medida en producción ────────────────────────────────────

  it("incluye una venta de las 18:15 locales, que es 00:15Z del día siguiente", () => {
    // El defecto real: filtrando "20 ago - 20 ago" para TAPIA salían 5 ventas
    // y eran 7. Las dos que faltaban eran de las 18:15 y 18:18 — pasadas las
    // 18:00 locales, un instante ya cae en el día UTC siguiente.
    const { desde, hasta } = rangoDeDiasDeNegocio("2026-08-20", "2026-08-20");
    const venta1815 = new Date("2026-08-21T00:15:31Z");

    expect(venta1815 >= new Date(desde)).toBe(true);
    expect(venta1815 < new Date(hasta)).toBe(true);
  });

  it("y NO incluye la de las 18:15 del día anterior", () => {
    // El otro lado del mismo error: la ventana corrida metía de contrabando
    // las ventas de la tarde-noche del día previo.
    const { desde } = rangoDeDiasDeNegocio("2026-08-20", "2026-08-20");
    const ventaDelDiaAnterior = new Date("2026-08-20T00:15:31Z"); // 19-ago 18:15 CDMX

    expect(ventaDelDiaAnterior < new Date(desde)).toBe(true);
  });

  it("una venta de las 23:59 locales del último día sigue dentro", () => {
    const { hasta } = rangoDeDiasDeNegocio("2026-08-20", "2026-08-20");
    const casiMedianoche = new Date("2026-08-21T05:59:59Z");

    expect(casiMedianoche < new Date(hasta)).toBe(true);
  });

  it("rechaza un rango invertido en vez de devolver vacío en silencio", () => {
    expect(() => rangoDeDiasDeNegocio("2026-08-20", "2026-08-19")).toThrow();
  });
});

// ─── reloj de pared ↔ instante ───────────────────────────────────────────────
//
// La misma confusión que el rango de días, un nivel más fino: un
// `<input type="datetime-local">` habla relojes de pared sin zona, y la venta
// guarda un instante UTC. Medido el 2026-09-01: la venta de las 18:38 de
// México se mostraba como "09/02/2026, 12:38 AM" porque el campo recortaba el
// ISO con `slice(0, 16)`.

describe("enRelojDeNegocio", () => {
  it("la venta de las 18:38 de México se ve como las 18:38, no como las 00:38", () => {
    expect(enRelojDeNegocio("2026-09-02T00:38:00Z")).toBe("2026-09-01T18:38");
  });

  it("no es slice(0, 16): el recorte devolvería el reloj UTC", () => {
    const instante = "2026-09-02T00:38:00Z";

    expect(enRelojDeNegocio(instante)).not.toBe(instante.slice(0, 16));
  });

  it("tolera milisegundos en el instante", () => {
    expect(enRelojDeNegocio("2026-09-02T00:38:12.482Z")).toBe("2026-09-01T18:38");
  });

  it("respeta las reglas IANA: en junio de 2022 México estaba en UTC-5", () => {
    expect(enRelojDeNegocio("2022-06-16T00:38:00Z")).toBe("2022-06-15T19:38");
  });

  it("rechaza un instante que no lo es en vez de inventar una fecha", () => {
    expect(() => enRelojDeNegocio("ayer por la tarde")).toThrow();
  });

  // `new Date()` acepta muchas más cosas que RFC3339, y varias las interpreta
  // en la zona del NAVEGADOR. Comprobar sólo `Number.isNaN(getTime())` dejaba
  // esa puerta abierta justo en el módulo cuya tesis es que el navegador
  // nunca manda.
  it("rechaza un formato que Date sí parsea pero en la zona del navegador", () => {
    // Con TZ=UTC esto devolvía "2026-06-06T10:00" y con TZ en México,
    // "2026-06-06T05:00". La respuesta dependía de la máquina.
    expect(() => enRelojDeNegocio("06/06/2026 10:00")).toThrow();
  });

  it("rechaza una fecha sin hora, que Date lee como medianoche UTC", () => {
    // Devolvía "2026-08-31T18:00": un día antes del que se pidió.
    expect(() => enRelojDeNegocio("2026-09-01")).toThrow();
  });

  it("exige el designador de zona, que es lo que hace RFC3339 a un instante", () => {
    expect(() => enRelojDeNegocio("2026-09-02T00:38:00")).toThrow();
  });

  it("acepta un offset explícito, no sólo Z", () => {
    expect(enRelojDeNegocio("2026-09-01T18:38:00-06:00")).toBe("2026-09-01T18:38");
  });
});

describe("desdeRelojDeNegocio", () => {
  it("las 18:38 del 1 de septiembre son las 00:38 UTC del 2", () => {
    expect(desdeRelojDeNegocio("2026-09-01T18:38")).toBe("2026-09-02T00:38:00Z");
  });

  it('no es `${reloj}:00.000Z`: estampar la Z adelanta la venta seis horas', () => {
    const reloj = "2026-09-01T18:38";

    expect(desdeRelojDeNegocio(reloj)).not.toBe(`${reloj}:00.000Z`);
  });

  it("es la inversa exacta de enRelojDeNegocio", () => {
    const instante = "2026-09-02T00:38:00Z";

    expect(desdeRelojDeNegocio(enRelojDeNegocio(instante))).toBe(instante);
  });

  it("rechaza un reloj mal formado", () => {
    expect(() => desdeRelojDeNegocio("2026-09-01")).toThrow();
  });

  it("rechaza un día que no existe en el calendario", () => {
    expect(() => desdeRelojDeNegocio("2026-02-30T10:00")).toThrow();
  });

  it("rechaza basura pegada al final en vez de ignorarla", () => {
    // El patrón no estaba anclado: cualquier cosa después del minuto se
    // descartaba en silencio y devolvía un instante como si nada.
    expect(() => desdeRelojDeNegocio("2026-09-01T18:38basura")).toThrow();
  });

  it("tolera los segundos, que algunos navegadores sí mandan", () => {
    expect(desdeRelojDeNegocio("2026-09-01T18:38:00")).toBe("2026-09-02T00:38:00Z");
  });
});

describe("relojDeNegocioSeguro", () => {
  // La variante tolerante existe por una razón concreta: el formulario de
  // replay de intentos fallidos edita cuerpos que el servidor RECHAZÓ, y su
  // guardia estructural (isVentaShapedBody) sólo exige que `fecha_venta` sea
  // un string — no valida el valor, a propósito, porque "ése es el trabajo
  // del formulario, que los muestra como errores por campo". Un instante
  // ilegible tiene que pintar un campo vacío que el operador corrige, no
  // tumbar la pantalla que existe para corregirlo.

  it("con un instante bueno da lo mismo que la estricta", () => {
    expect(relojDeNegocioSeguro("2026-09-02T00:38:00Z")).toBe("2026-09-01T18:38");
  });

  it("con un instante ilegible devuelve vacío en vez de lanzar", () => {
    expect(relojDeNegocioSeguro("")).toBe("");
    expect(relojDeNegocioSeguro("ayer")).toBe("");
    expect(relojDeNegocioSeguro("2026-13-45T99:99:99Z")).toBe("");
    expect(relojDeNegocioSeguro("2026-09-01")).toBe("");
  });
});
