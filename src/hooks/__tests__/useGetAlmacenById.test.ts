import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("../../../firebase", () => ({ auth: { currentUser: null } }));

import useGetAlmacenById from "../useGetAlmacenById";

const CADENA = "Precio de lista:6150.000000,Precio 4 Meses:4100.000000,Precio 1 Meses:3485.000000";
const base = {
  articulo_id: 101,
  articulo: "ROPERO 3 PUERTAS",
  existencias: 3,
  linea_articulo_id: 1,
  linea_articulo: "MUEBLES",
  precios: CADENA,
};
const ordenados = [{ tipo: "contado", precio_empresa_id: 42, nombre: "Precio 1 Meses", precio: "3485.000000" }];

function servidor(items: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        new Response(
          JSON.stringify(
            url.endsWith("/articulos") ? { items } : { almacen_id: 19, almacen: "CAMIONETA 19", existencias: 3 },
          ),
          { status: 200 },
        ),
      ),
    ),
  );
}

describe("useGetAlmacenById · precios", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("pasa precios_ordenados del servidor nuevo y la cadena vieja intacta", async () => {
    servidor([{ ...base, precios_ordenados: ordenados }]);
    const { result } = renderHook(() => useGetAlmacenById(19));
    await waitFor(() => expect(result.current.articulos).toHaveLength(1));
    expect(result.current.articulos[0].PRECIOS).toBe(CADENA);
    expect(result.current.articulos[0].PRECIOS_ORDENADOS).toEqual(ordenados);
  });

  it("servidor viejo sin precios_ordenados: el campo no aparece", async () => {
    servidor([base]);
    const { result } = renderHook(() => useGetAlmacenById(19));
    await waitFor(() => expect(result.current.articulos).toHaveLength(1));
    expect(result.current.articulos[0]).not.toHaveProperty("PRECIOS_ORDENADOS");
  });
});
