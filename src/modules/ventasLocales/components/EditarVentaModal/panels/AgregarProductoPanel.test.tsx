import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ArticuloAlmacen } from "@/hooks/useGetAlmacenById";
import { AgregarProductoPanel } from "./AgregarProductoPanel";

let articulos: ArticuloAlmacen[] = [];
vi.mock("@/hooks/useGetAlmacenById", () => ({
  default: () => ({ almacen: null, articulos, loading: false, error: null, refetch: vi.fn() }),
}));

const articulo = (id: number, nombre: string, precios: string): ArticuloAlmacen => ({
  ARTICULO_ID: id,
  ARTICULO: nombre,
  EXISTENCIAS: 3,
  LINEA_ARTICULO_ID: 1,
  LINEA_ARTICULO: "MUEBLES",
  PRECIOS: precios,
});

// Cadena con la forma real del API.
const ROPERO = articulo(101, "ROPERO 3 PUERTAS", "Precio de lista:6150.000000,Precio 4 Meses:4100.000000,Precio 1 Meses:3485.000000");
const SIN_ANUAL = articulo(102, "BURÓ CHICO", "Precio 4 Meses:900.000000,Precio 1 Meses:750.000000");
const SIN_CONTADO = articulo(103, "SILLA PLEGABLE", "Precio de lista:800.000000,Precio 4 Meses:600.000000");

function montar(tipoVenta: "CONTADO" | "CREDITO") {
  const onAgregar = vi.fn();
  render(
    <AgregarProductoPanel
      open
      onOpenChange={vi.fn()}
      almacenes={{ almacenOrigenID: 19, almacenDestinoID: 11058 }}
      productosExistentes={[]}
      tipoVenta={tipoVenta}
      onAgregar={onAgregar}
    />,
  );
  return onAgregar;
}

describe("AgregarProductoPanel · precios de la línea nueva", () => {
  beforeEach(() => {
    articulos = [ROPERO, SIN_ANUAL, SIN_CONTADO];
  });

  it("venta CONTADO: agrega 0 / 0 / contado del catálogo", async () => {
    const onAgregar = montar("CONTADO");
    await userEvent.click(screen.getByText("ROPERO 3 PUERTAS"));
    expect(onAgregar).toHaveBeenCalledTimes(1);
    expect(onAgregar.mock.calls[0][0]).toMatchObject({
      articuloId: 101,
      precioAnual: 0,
      precioCortoPlazo: 0,
      precioContado: 3485,
    });
  });

  it("venta CRÉDITO: agrega los tres precios del catálogo", async () => {
    const onAgregar = montar("CREDITO");
    await userEvent.click(screen.getByText("ROPERO 3 PUERTAS"));
    expect(onAgregar.mock.calls[0][0]).toMatchObject({
      precioAnual: 6150,
      precioCortoPlazo: 4100,
      precioContado: 3485,
    });
  });

  it("venta CRÉDITO sin precio anual en el catálogo: avisa y no agrega", async () => {
    const onAgregar = montar("CREDITO");
    await userEvent.click(screen.getByText("BURÓ CHICO"));
    expect(onAgregar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "BURÓ CHICO: el producto no tiene precio anual en el catálogo",
    );
  });

  it("venta CONTADO sin precio de contado: avisa y no agrega; el siguiente bueno sí entra y borra el aviso", async () => {
    const onAgregar = montar("CONTADO");
    await userEvent.click(screen.getByText("SILLA PLEGABLE"));
    expect(onAgregar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("no tiene precio de contado");
    await userEvent.click(screen.getByText("ROPERO 3 PUERTAS"));
    expect(onAgregar).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("con precios_ordenados manda ése aunque la cadena vieja diga otra cosa", async () => {
    articulos = [
      {
        ...articulo(104, "COMEDOR 6 SILLAS", "Precio 1 Meses:1.000000"),
        PRECIOS_ORDENADOS: [
          { tipo: "contado", precio_empresa_id: 42, nombre: "Precio 1 Meses", precio: "9800.000000" },
        ],
      },
    ];
    const onAgregar = montar("CONTADO");
    await userEvent.click(screen.getByText("COMEDOR 6 SILLAS"));
    expect(onAgregar.mock.calls[0][0]).toMatchObject({ precioAnual: 0, precioCortoPlazo: 0, precioContado: 9800 });
  });

  it("la fila muestra el precio que se va a usar", () => {
    montar("CONTADO");
    expect(screen.getByText(/Contado\s+\$3,485/)).toBeInTheDocument();
  });
});
