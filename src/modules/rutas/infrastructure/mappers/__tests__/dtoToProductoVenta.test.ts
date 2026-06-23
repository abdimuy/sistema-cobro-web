import { describe, it, expect } from "vitest";
import { dtoToProductoVenta } from "../dtoToProductoVenta";
import { DomainError } from "../../../domain/errors";

type ProductoVentaRaw = {
  articulo_id: number;
  nombre: string;
  unidades: string;
  precio_unitario: string;
  precio_total_neto: string;
  pctje_dscto: string;
};

function buildValidDTO(overrides: Partial<ProductoVentaRaw> = {}): ProductoVentaRaw {
  return {
    articulo_id: 42,
    nombre: "SALA MODERNA 3 PIEZAS",
    unidades: "1.00000",
    precio_unitario: "8500.00",
    precio_total_neto: "8500.00",
    pctje_dscto: "0.00",
    ...overrides,
  };
}

describe("dtoToProductoVenta", () => {
  it("happy path: mapea nombre, cantidad e importe correctamente", () => {
    const dto = buildValidDTO();
    const producto = dtoToProductoVenta(dto);

    expect(producto.nombre).toBe("SALA MODERNA 3 PIEZAS");
    expect(producto.cantidad).toBe("1.00000");
    expect(producto.importe).toBe("8500.00");
  });

  it("happy path: preserva los valores exactos de los strings decimales", () => {
    const dto = buildValidDTO({ unidades: "2.00000", precio_total_neto: "17000.00" });
    const producto = dtoToProductoVenta(dto);

    expect(producto.cantidad).toBe("2.00000");
    expect(producto.importe).toBe("17000.00");
  });

  it("lanza DomainError con code producto_invalido si nombre no es string", () => {
    const dto = buildValidDTO({ nombre: 123 as unknown as string });
    expect(() => dtoToProductoVenta(dto)).toThrowError(
      expect.objectContaining({ code: "producto_invalido" }),
    );
  });

  it("lanza DomainError con code producto_invalido si nombre es cadena vacía", () => {
    const dto = buildValidDTO({ nombre: "" });
    expect(() => dtoToProductoVenta(dto)).toThrowError(
      expect.objectContaining({ code: "producto_invalido" }),
    );
  });

  it("lanza DomainError con code producto_invalido si unidades no es string", () => {
    const dto = buildValidDTO({ unidades: 1 as unknown as string });
    expect(() => dtoToProductoVenta(dto)).toThrowError(
      expect.objectContaining({ code: "producto_invalido" }),
    );
  });

  it("lanza DomainError con code producto_invalido si precio_total_neto no es string", () => {
    const dto = buildValidDTO({ precio_total_neto: 8500 as unknown as string });
    expect(() => dtoToProductoVenta(dto)).toThrowError(
      expect.objectContaining({ code: "producto_invalido" }),
    );
  });

  it("DomainError hereda de Error", () => {
    const dto = buildValidDTO({ nombre: "" });
    expect(() => dtoToProductoVenta(dto)).toThrow(DomainError);
  });
});
