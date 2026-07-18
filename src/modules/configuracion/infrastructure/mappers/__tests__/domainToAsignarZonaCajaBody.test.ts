import { describe, it, expect } from "vitest";
import { domainToAsignarZonaCajaBody } from "../domainToAsignarZonaCajaBody";

describe("domainToAsignarZonaCajaBody", () => {
  it("mapea los 4 ids seleccionados a snake_case", () => {
    const body = domainToAsignarZonaCajaBody({
      zonaClienteId: 12,
      cajaId: 501,
      cajeroId: 601,
      vendedorId: 701,
      cobradorId: 801,
    });

    expect(body).toEqual({
      caja_id: 501,
      cajero_id: 601,
      vendedor_id: 701,
      cobrador_id: 801,
    });
  });

  it("envía el sentinel -1 (sin asignar) explícitamente, nunca lo omite", () => {
    const body = domainToAsignarZonaCajaBody({
      zonaClienteId: 12,
      cajaId: -1,
      cajeroId: -1,
      vendedorId: 701,
      cobradorId: -1,
    });

    expect(body).toEqual({
      caja_id: -1,
      cajero_id: -1,
      vendedor_id: 701,
      cobrador_id: -1,
    });
    expect("caja_id" in body).toBe(true);
    expect("cajero_id" in body).toBe(true);
    expect("cobrador_id" in body).toBe(true);
  });

  it("no incluye zona_cliente_id en el body (viaja en la URL)", () => {
    const body = domainToAsignarZonaCajaBody({
      zonaClienteId: 12,
      cajaId: 1,
      cajeroId: 2,
      vendedorId: 3,
      cobradorId: 4,
    });

    expect("zona_cliente_id" in body).toBe(false);
    expect("zonaClienteId" in body).toBe(false);
  });
});
