import { describe, expect, it } from "vitest";
import { agrupar } from "./IntentoAgrupado";
import { makeFakeIntent, resumenDe } from "../../application/__tests__/fakeRepoPort";

// El renglón tiene que decir DE QUIÉN es el trabajo.
//
// En ventas el cuerpo trae el nombre y ya salía en el título. En pagos NO lo
// trae —medido sobre capturas reales: trae cliente_id, el id del cargo y el
// nombre del cobrador— así que el título era "RUTA 27 - ALEJANDRO CHAVARRIA".
// Eso dice quién lo capturó, no de quién es el dinero, que es lo que busca la
// oficina. El servidor ahora resuelve el nombre aparte y el renglón lo prefiere.

describe("quien", () => {
  it("prefiere el nombre del cliente sobre el título cuando el servidor lo resolvió", () => {
    const [g] = agrupar([
      makeFakeIntent({
        id: "p1",
        idempotencyKey: "pago-1",
        path: "/v2/cobranza/pagos",
        httpStatus: 422,
        errorCode: "x",
        resumen: resumenDe({ titulo: "RUTA 27 - ALEJANDRO CHAVARRIA", cliente: "ROSA MARÍA DÍAZ" }),
      }),
    ]);

    expect(g.quien).toBe("ROSA MARÍA DÍAZ");
  });

  it("no tira al cobrador: queda en capturadoPor, que es la otra pregunta", () => {
    const [g] = agrupar([
      makeFakeIntent({
        id: "p1",
        idempotencyKey: "pago-1",
        path: "/v2/cobranza/pagos",
        httpStatus: 422,
        errorCode: "x",
        resumen: resumenDe({ titulo: "RUTA 27 - ALEJANDRO CHAVARRIA", cliente: "ROSA MARÍA DÍAZ" }),
      }),
    ]);

    expect(g.capturadoPor).toBe("RUTA 27 - ALEJANDRO CHAVARRIA");
  });

  it("sin cliente resuelto cae al título, como antes", () => {
    const [g] = agrupar([
      makeFakeIntent({
        id: "p1",
        idempotencyKey: "pago-1",
        path: "/v2/cobranza/pagos",
        httpStatus: 422,
        errorCode: "x",
        resumen: resumenDe({ titulo: "RUTA 27 - ALEJANDRO CHAVARRIA" }),
      }),
    ]);

    expect(g.quien).toBe("RUTA 27 - ALEJANDRO CHAVARRIA");
    expect(g.capturadoPor).toBeNull();
  });

  // En ventas el título YA es el cliente, así que no hay nada que duplicar.
  it("en ventas no inventa un capturadoPor", () => {
    const [g] = agrupar([
      makeFakeIntent({
        id: "v1",
        idempotencyKey: "venta-1",
        path: "/v2/ventas",
        httpStatus: 422,
        errorCode: "x",
        resumen: resumenDe({ titulo: "JAQUELINE SANCHEZ ROMERO" }),
      }),
    ]);

    expect(g.quien).toBe("JAQUELINE SANCHEZ ROMERO");
    expect(g.capturadoPor).toBeNull();
  });
});
