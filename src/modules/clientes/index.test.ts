import { describe, expect, it } from "vitest";
import * as clientes from "./index";

describe("índice público de Clientes", () => {
  it("expone lo que reutiliza Desempeño", () => {
    expect(typeof clientes.ClienteFicha).toBe("function");
    expect(typeof clientes.VentaModal).toBe("function");
    expect(typeof clientes.PagoModal).toBe("function");
    expect(typeof clientes.ClientesContainer).toBe("function");
    expect(typeof clientes.ClientesProvider).toBe("function");
  });
});
