import { describe, expect, it } from "vitest";
import { categoriaDePunto } from "../categoriaPunto";

const visita = (trato: string) => ({ tipo: "visita" as const, visita: { trato } as never });

describe("categoriaDePunto (sólo mapea campos del servidor)", () => {
  it("pago -> pago", () => expect(categoriaDePunto({ tipo: "pago", visita: null })).toBe("pago"));
  it("visita con trato pagado/parcial -> pago", () => {
    expect(categoriaDePunto(visita("pagado"))).toBe("pago");
    expect(categoriaDePunto(visita("parcial"))).toBe("pago");
  });
  it("visita escalar -> no pagó; nadie (No estaba) -> visita en ámbar", () => {
    expect(categoriaDePunto(visita("escalar"))).toBe("no_pago");
    expect(categoriaDePunto(visita("nadie"))).toBe("visita");
  });
  it("otras visitas -> visita sin pago; condonación -> neutro", () => {
    expect(categoriaDePunto(visita("regresas"))).toBe("visita");
    expect(categoriaDePunto({ tipo: "condonacion", visita: null })).toBe("otro");
  });
});
