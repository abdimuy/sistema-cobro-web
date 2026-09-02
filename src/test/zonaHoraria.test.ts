import { describe, expect, it } from "vitest";

import {
  ZONA_DE_NEGOCIO,
  desdeRelojDeNegocio,
  enRelojDeNegocio,
} from "@/utils/tiempoDeNegocio";

// Por qué existe este archivo
// ───────────────────────────
// La suite corría con la zona horaria de la máquina que la ejecutara: la de
// quien programa en Culiacán, la del runner de CI en UTC. Una prueba que
// formatea fechas pasaba o fallaba según dónde se corriera, así que la única
// forma de tenerla "estable" era escribir fixtures que no distinguieran las
// zonas — y eso es exactamente lo que pasó.
//
// El fixture de EditarVentaHero.test.tsx usa `2026-08-19T12:00:00Z`: el
// mediodía UTC es la única hora que cae en el MISMO día de calendario en toda
// América. Con ese dato, un componente que pinta el reloj UTC crudo y uno que
// convierte a la zona local dan la misma respuesta, y la prueba no puede
// distinguirlos. Ese es el motivo por el que la suite estaba verde mientras el
// campo de fecha de venta mostraba el día equivocado en producción.
//
// Fijar TZ en `vitest.config.ts` cierra el hueco: cualquiera que corra la
// suite obtiene la misma zona, y una prueba puede usar una hora que sí
// distingue (18:38, pasadas las 18:00, cuando México ya va un día atrás de
// UTC) sin volverse dependiente de la máquina.
//
// Y la zona elegida es UTC, no la del negocio. Eso también es deliberado: si
// la suite corriera en la zona del negocio, "anclado al negocio" y "anclado
// al navegador" darían la misma respuesta y ninguna prueba podría
// distinguirlos. Sería elegir otra vez el valor que deja verde cualquier
// implementación. En UTC, una conversión anclada al navegador falla.

describe("la suite fija la zona horaria", () => {
  it("vitest.config.ts declara TZ", () => {
    expect(process.env.TZ).toBe("UTC");
  });

  it("y el runtime la respeta: el reloj del worker es UTC", () => {
    // Si TZ no llegara al worker, `Date` seguiría con la zona de la máquina y
    // este offset sería el que fuera. 0 = UTC.
    const instante = new Date("2026-09-02T00:38:00Z");

    expect(instante.getTimezoneOffset()).toBe(0);
    expect(instante.getDate()).toBe(instante.getUTCDate());
  });
});

describe("la conversión de la fecha de venta no depende del navegador", () => {
  // Estas tres fallan si alguien vuelve a traducir el instante con un
  // `slice(0, 16)` o a reestampar la Z sobre el reloj local.

  it("el reloj del negocio NO es el recorte del ISO", () => {
    const instante = "2026-09-02T00:38:00Z";

    expect(instante.slice(0, 16)).toBe("2026-09-02T00:38");
    expect(enRelojDeNegocio(instante)).toBe("2026-09-01T18:38");
  });

  it("el instante NO es el reloj con la Z encima", () => {
    const reloj = "2026-09-01T18:38";

    expect(desdeRelojDeNegocio(reloj)).toBe("2026-09-02T00:38:00Z");
    expect(desdeRelojDeNegocio(reloj)).not.toBe(`${reloj}:00.000Z`);
  });

  it("la respuesta la manda la zona del negocio, no TZ", () => {
    // El control positivo del anclaje: con la zona pasada a mano el resultado
    // cambia, con TZ no. Si la conversión se hiciera contra el reloj del
    // navegador, estas dos darían lo mismo y la prueba no protegería nada.
    const instante = "2026-09-02T00:38:00Z";

    expect(enRelojDeNegocio(instante, "UTC")).toBe("2026-09-02T00:38");
    expect(enRelojDeNegocio(instante, ZONA_DE_NEGOCIO)).toBe("2026-09-01T18:38");
    expect(enRelojDeNegocio(instante)).toBe(enRelojDeNegocio(instante, ZONA_DE_NEGOCIO));
  });
});
