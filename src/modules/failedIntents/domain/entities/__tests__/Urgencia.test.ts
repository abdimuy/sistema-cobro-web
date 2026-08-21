import { describe, expect, it } from "vitest";
import { Urgencia } from "../Urgencia";
import { Causa } from "../Causa";
import { DomainError } from "../../errors";

describe("Urgencia.create", () => {
  it("acepta los dos valores", () => {
    expect((Urgencia.create("necesita_accion") as Urgencia).value).toBe("necesita_accion");
    expect((Urgencia.create("se_reintenta") as Urgencia).value).toBe("se_reintenta");
  });

  it("rechaza cualquier otro", () => {
    expect(Urgencia.create("urgente")).toBeInstanceOf(DomainError);
    expect(Urgencia.create("")).toBeInstanceOf(DomainError);
  });
});

describe("Urgencia.desde", () => {
  it("es total: toda causa del catálogo tiene urgencia", () => {
    for (const v of Causa.values()) {
      const u = Urgencia.desde(Causa.create(v) as Causa);
      expect(Urgencia.values()).toContain(u.value);
    }
  });

  it("nadie repone inventario ni corrige un campo por reintentar", () => {
    expect(Urgencia.desde(Causa.create("falta_inventario") as Causa).necesitaAccion()).toBe(true);
    expect(Urgencia.desde(Causa.create("cuerpo_ilegible") as Causa).necesitaAccion()).toBe(true);
  });

  it("servidor caído, subida cortada y sin clasificar se curan solos", () => {
    expect(Urgencia.desde(Causa.create("servidor_no_respondio") as Causa).necesitaAccion()).toBe(
      false,
    );
    expect(Urgencia.desde(Causa.create("subida_cortada") as Causa).necesitaAccion()).toBe(false);
    expect(Urgencia.desde(Causa.create("desconocida") as Causa).necesitaAccion()).toBe(false);
  });

  it("es pura: misma causa, misma urgencia", () => {
    const causa = Causa.desde("articulo_sin_existencia", 422);
    expect(Urgencia.desde(causa).equals(Urgencia.desde(causa))).toBe(true);
  });
});
