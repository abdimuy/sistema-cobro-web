import { describe, expect, it } from "vitest";
import { listarIntentosAgrupados } from "./listarIntentosAgrupados";
import { FakeRepoPort, makeFakeIntent } from "../__tests__/fakeRepoPort";
import { DomainError } from "../../domain/errors";

const T = (hhmm: string) => new Date(`2026-08-19T${hhmm}:00.000Z`);

describe("listarIntentosAgrupados", () => {
  it("parte la página en las dos colecciones de la pantalla", async () => {
    const port = new FakeRepoPort();
    port.listResponse = {
      items: [
        makeFakeIntent({
          id: "sin-stock",
          idempotencyKey: "venta-1",
          httpStatus: 422,
          errorCode: "articulo_sin_existencia",
        }),
        makeFakeIntent({
          id: "servidor",
          idempotencyKey: "venta-2",
          httpStatus: 503,
          errorCode: null,
        }),
      ],
      nextCursor: "c1",
      hasMore: true,
    };

    const out = await listarIntentosAgrupados(port, { pageSize: 30 });

    expect(out.necesitanAccion.map((g) => g.id)).toEqual(["sin-stock"]);
    expect(out.seReintentan.map((g) => g.id)).toEqual(["servidor"]);
    expect(out.nextCursor).toBe("c1");
    expect(out.hasMore).toBe(true);
  });

  it("ventas y pagos van mezclados: el módulo es etiqueta, no pestaña", async () => {
    const port = new FakeRepoPort();
    port.listResponse = {
      items: [
        makeFakeIntent({
          id: "pago",
          idempotencyKey: "pago-1",
          path: "/v2/cobranza/pagos",
          receivedAt: T("13:10"),
          httpStatus: 422,
          errorCode: "monto_invalido",
        }),
        makeFakeIntent({
          id: "venta",
          idempotencyKey: "venta-1",
          path: "/v2/ventas",
          receivedAt: T("13:20"),
          httpStatus: 422,
          errorCode: "articulo_sin_existencia",
        }),
      ],
      nextCursor: null,
      hasMore: false,
    };

    const out = await listarIntentosAgrupados(port, {});

    expect(out.necesitanAccion.map((g) => g.modulo)).toEqual(["pagos", "ventas"]);
    expect(out.seReintentan).toHaveLength(0);
  });

  it("ordena por quien lleva más tiempo esperando, no por el último intento", async () => {
    // La venta que reintenta cada minuto tiene el `ultimo` más fresco; si el
    // orden fuera por ahí, se pondría siempre al frente y la que se rindió
    // hace horas —la que de verdad necesita a alguien— caería al fondo.
    const port = new FakeRepoPort();
    port.listResponse = {
      items: [
        makeFakeIntent({
          id: "reciente",
          idempotencyKey: "b",
          receivedAt: T("15:00"),
          httpStatus: 422,
          errorCode: "campo_invalido",
        }),
        makeFakeIntent({
          id: "vieja",
          idempotencyKey: "a",
          receivedAt: T("09:00"),
          httpStatus: 422,
          errorCode: "campo_invalido",
        }),
      ],
      nextCursor: null,
      hasMore: false,
    };

    const out = await listarIntentosAgrupados(port, {});

    expect(out.necesitanAccion.map((g) => g.id)).toEqual(["vieja", "reciente"]);
  });

  it("trece filas de la misma venta rinden UN renglón que dice trece", async () => {
    const port = new FakeRepoPort();
    port.listResponse = {
      items: Array.from({ length: 13 }, (_, i) =>
        makeFakeIntent({
          id: `id-${i}`,
          idempotencyKey: "venta-77",
          receivedAt: new Date(`2026-08-19T13:${String(20 + i).padStart(2, "0")}:00.000Z`),
          httpStatus: 422,
          errorCode: "articulo_sin_existencia",
        }),
      ),
      nextCursor: null,
      hasMore: false,
    };

    const out = await listarIntentosAgrupados(port, {});

    expect(out.necesitanAccion).toHaveLength(1);
    expect(out.necesitanAccion[0].intentos).toBe(13);
  });

  it("ningún renglón sale con el título vacío ni con 'error desconocido'", async () => {
    const port = new FakeRepoPort();
    port.listResponse = {
      items: [
        makeFakeIntent({ id: "a", idempotencyKey: "a", httpStatus: 422, errorCode: null, errorMessage: null }),
        makeFakeIntent({ id: "b", idempotencyKey: "b", httpStatus: 500, errorCode: null, errorMessage: "" }),
        makeFakeIntent({ id: "c", idempotencyKey: "c", httpStatus: 403, errorCode: "permiso", errorMessage: "sin permiso" }),
      ],
      nextCursor: null,
      hasMore: false,
    };

    const out = await listarIntentosAgrupados(port, {});
    const todos = [...out.necesitanAccion, ...out.seReintentan];

    expect(todos).toHaveLength(3);
    for (const g of todos) {
      expect(g.titulo.trim()).not.toBe("");
      expect(g.titulo.toLowerCase()).not.toContain("error desconocido");
    }
  });

  it("hereda la validación del page_size en vez de duplicarla", async () => {
    const port = new FakeRepoPort();
    await expect(listarIntentosAgrupados(port, { pageSize: 999 })).rejects.toMatchObject({
      code: "page_size_excedido",
    });
    expect(port.listCalls).toHaveLength(0);
  });

  it("propaga la señal de aborto y los errores del puerto sin envolverlos", async () => {
    const port = new FakeRepoPort();
    const ctrl = new AbortController();
    await listarIntentosAgrupados(port, { status: "new" }, ctrl.signal);
    expect(port.listCalls[0].signal).toBe(ctrl.signal);

    const e = new DomainError("network_error", "fallo de red");
    port.throwOnNext.list = e;
    await expect(listarIntentosAgrupados(port, {})).rejects.toBe(e);
  });

  it("cae de pie con la página vacía", async () => {
    const port = new FakeRepoPort();
    port.listResponse = { items: [], nextCursor: null, hasMore: false };
    const out = await listarIntentosAgrupados(port, {});
    expect(out.necesitanAccion).toEqual([]);
    expect(out.seReintentan).toEqual([]);
  });
});
