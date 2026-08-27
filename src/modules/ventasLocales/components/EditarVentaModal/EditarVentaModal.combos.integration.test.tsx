import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";

// ── Mocks (declarados antes de importar el componente) ───────────────────────

// El modal arrastra el apiClient del módulo, que a su vez levanta Firebase.
// Aquí el puerto se inyecta a mano (ver `ventasLocalesContainer` más abajo),
// así que basta con que el SDK no toque la red.
vi.mock("../../../../../firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

// Los avisos se verifican por el CANAL usado (`toast.error` / `toast.success`),
// no por el texto: el color del aviso no debe deducirse de las palabras.
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() },
  Toaster: () => null,
}));

vi.mock("@/hooks/useGetAlmacenes", () => ({
  default: () => ({
    almacenes: [
      { ALMACEN_ID: 19, ALMACEN: "CAMIONETA 19", EXISTENCIAS: 0 },
      { ALMACEN_ID: 11058, ALMACEN: "EXHIBICION", EXISTENCIAS: 0 },
    ],
    getAlmacenById: () => undefined,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/useGetAlmacenById", () => ({
  default: () => ({
    almacen: { ALMACEN_ID: 19, ALMACEN: "CAMIONETA 19", EXISTENCIAS: 0 },
    articulos: [
      {
        ARTICULO_ID: 45077,
        ARTICULO: "Mesa lateral Roma",
        EXISTENCIAS: 4,
        LINEA_ARTICULO_ID: 1,
        LINEA_ARTICULO: "SALAS",
        PRECIOS: '{"PRECIO_LISTA":1800,"PRECIO_CORTO_PLAZO":1600,"PRECIO_CONTADO":1400}',
      },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

import { toast } from "sonner";
import { server } from "@/test/msw/server";
import { ventasEditHandlers, errorHuma } from "@/test/msw/handlers/ventasEdit";
import {
  ventaConComboDTO,
  ventaSoloCombosDTO,
  COMBO_ID,
  PRODUCTO_COMBO_1_ID,
  PRODUCTO_COMBO_2_ID,
  PRODUCTO_SUELTO_ID,
  VENTA_ID,
  ALMACEN_ORIGEN,
  ALMACEN_DESTINO,
  mesaSuelta,
  comboSala,
} from "@/test/msw/fixtures/ventaConCombo";
import { ventasLocalesContainer } from "../../presentation/composition/ventasLocalesContainer";
import { HttpVentaEditAdapter } from "../../infrastructure/http/HttpVentaEditAdapter";
import type { VentaV2 } from "@/services/api/ventaV2Types";
import EditarVentaModal from "./EditarVentaModal";

const TEST_BASE_URL = "http://api.test/v2";

beforeEach(() => {
  vi.clearAllMocks();
  ventasLocalesContainer.port = new HttpVentaEditAdapter(
    axios.create({ baseURL: TEST_BASE_URL }),
  );
});

function abrirModal(venta: VentaV2 = ventaConComboDTO()) {
  const onSuccess = vi.fn();
  render(
    <EditarVentaModal venta={venta} open onOpenChange={vi.fn()} onSuccess={onSuccess} />,
  );
  return { onSuccess };
}

async function irAProductos(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("tab", { name: /Productos/ }));
}

async function guardar(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Revisar y guardar" }));
  await user.click(await screen.findByRole("button", { name: "Confirmar" }));
}

type CuerpoLineas = {
  combos: Array<Record<string, unknown>>;
  productos: Array<Record<string, unknown>>;
};

describe("EditarVentaModal — editar los productos de un combo (el caso que motivó todo)", () => {
  it("cambia la cantidad de un producto DEL COMBO y guarda con una sola petición a /lineas", async () => {
    const user = userEvent.setup();
    const { handlers, llamadas } = ventasEditHandlers({ respuesta: ventaConComboDTO() });
    server.use(...handlers);

    const { onSuccess } = abrirModal();
    await irAProductos(user);

    const fila = screen.getByTestId(`combo-producto-row-${PRODUCTO_COMBO_2_ID}`);
    const cantidad = within(fila).getByDisplayValue("2");
    await user.clear(cantidad);
    await user.type(cantidad, "5");
    await user.tab();

    // El pie deja de decir "Sin cambios".
    expect(screen.queryByText("Sin cambios")).not.toBeInTheDocument();
    expect(screen.getByText(/cambios pendientes/)).toBeInTheDocument();

    await guardar(user);

    await waitFor(() => expect(llamadas.lineas).toHaveLength(1));
    expect(llamadas.lineas[0].ventaID).toBe(VENTA_ID);

    const body = llamadas.lineas[0].body as CuerpoLineas;
    expect(body.combos).toEqual([
      {
        id: COMBO_ID,
        nombre: "Sala Roma 3 piezas",
        precio_anual: "18500.00",
        precio_corto: "16900.00",
        precio_contado: "14500.00",
        cantidad: "1",
        almacen_origen_id: ALMACEN_ORIGEN,
        almacen_destino_id: ALMACEN_DESTINO,
      },
    ]);
    expect(body.productos).toHaveLength(3);
    expect(body.productos[1]).toEqual({
      id: PRODUCTO_COMBO_2_ID,
      articulo_id: 45013,
      articulo: "Sillón individual Roma",
      cantidad: "5",
      precio_anual: "3250.00",
      precio_corto: "2950.00",
      precio_contado: "2500.00",
      combo_id: COMBO_ID,
      almacen_origen_id: null,
      almacen_destino_id: null,
    });

    // Los endpoints viejos no se tocan.
    expect(llamadas.combos).toBe(0);
    expect(llamadas.productos).toBe(0);

    expect(toast.success).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it("agrega un producto DENTRO del combo desde el propio combo", async () => {
    const user = userEvent.setup();
    const { handlers, llamadas } = ventasEditHandlers({ respuesta: ventaConComboDTO() });
    server.use(...handlers);

    abrirModal();
    await irAProductos(user);

    await user.click(screen.getByRole("button", { name: /^Producto$/ }));
    expect(await screen.findByText("En Sala Roma 3 piezas")).toBeInTheDocument();
    await user.click(screen.getByText("Mesa lateral Roma"));

    await guardar(user);

    await waitFor(() => expect(llamadas.lineas).toHaveLength(1));
    const body = llamadas.lineas[0].body as CuerpoLineas;
    const agregado = body.productos.find((p) => p.articulo_id === 45077);
    expect(agregado).toMatchObject({
      articulo: "Mesa lateral Roma",
      cantidad: "1",
      combo_id: COMBO_ID,
      almacen_origen_id: null,
      almacen_destino_id: null,
    });
    expect(llamadas.combos).toBe(0);
    expect(llamadas.productos).toBe(0);
  });
});

describe("EditarVentaModal — quitar un combo se lleva sus productos", () => {
  it("el cuerpo enviado no lleva el combo ni ninguno de sus productos", async () => {
    const user = userEvent.setup();
    const { handlers, llamadas } = ventasEditHandlers({
      respuesta: ventaConComboDTO({ combos: [] }),
    });
    server.use(...handlers);

    abrirModal();
    await irAProductos(user);

    const filaCombo = screen.getByTestId(`combo-row-${COMBO_ID}`);
    await user.click(within(filaCombo).getByTitle("Eliminar"));

    await guardar(user);

    await waitFor(() => expect(llamadas.lineas).toHaveLength(1));
    const body = llamadas.lineas[0].body as CuerpoLineas;
    expect(body.combos).toEqual([]);
    expect(body.productos.map((p) => p.id)).toEqual([PRODUCTO_SUELTO_ID]);
    expect(body.productos.every((p) => p.combo_id === null)).toBe(true);
  });
});

describe("EditarVentaModal — el pie refleja los cambios de combos", () => {
  it("editar el nombre del combo deja de decir «Sin cambios»", async () => {
    const user = userEvent.setup();
    const { handlers } = ventasEditHandlers({ respuesta: ventaConComboDTO() });
    server.use(...handlers);

    abrirModal();
    expect(screen.getByText("Sin cambios")).toBeInTheDocument();

    await irAProductos(user);
    const nombre = screen.getByLabelText("Nombre del combo Sala Roma 3 piezas");
    await user.clear(nombre);
    await user.type(nombre, "Sala Roma 4 piezas");

    expect(screen.queryByText("Sin cambios")).not.toBeInTheDocument();
    expect(screen.getByText(/cambios pendientes/)).toBeInTheDocument();
  });

  it("editar el precio del combo deja de decir «Sin cambios»", async () => {
    const user = userEvent.setup();
    const { handlers } = ventasEditHandlers({ respuesta: ventaConComboDTO() });
    server.use(...handlers);

    abrirModal();
    await irAProductos(user);
    expect(screen.getByText("Sin cambios")).toBeInTheDocument();

    const filaCombo = screen.getByTestId(`combo-row-${COMBO_ID}`);
    const contado = within(filaCombo).getByDisplayValue("14500");
    await user.clear(contado);
    await user.type(contado, "13900");
    await user.tab();

    expect(screen.queryByText("Sin cambios")).not.toBeInTheDocument();
  });
});

describe("EditarVentaModal — una cantidad inválida se marca antes de guardar", () => {
  it("marca el campo en rojo y bloquea el guardado sin salir a la red", async () => {
    const user = userEvent.setup();
    const { handlers, llamadas } = ventasEditHandlers({ respuesta: ventaConComboDTO() });
    server.use(...handlers);

    abrirModal();
    await irAProductos(user);

    const filaCombo = screen.getByTestId(`combo-row-${COMBO_ID}`);
    const cantidad = within(filaCombo).getByDisplayValue("1");
    await user.clear(cantidad);
    await user.type(cantidad, "-3");
    await user.tab();

    expect(within(filaCombo).getByDisplayValue("-3")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Revisar y guardar" })).toBeDisabled();
    expect(llamadas.lineas).toHaveLength(0);
  });
});

describe("EditarVentaModal — errores del API", () => {
  it("un 409 venta_no_editable se avisa por el canal de error con el mensaje del servidor", async () => {
    const user = userEvent.setup();
    const { handlers } = ventasEditHandlers({
      error: errorHuma(
        409,
        "Conflict",
        "venta_no_editable",
        "la venta no se puede editar en su estado actual",
      ),
    });
    server.use(...handlers);

    abrirModal();
    await irAProductos(user);

    const fila = screen.getByTestId(`combo-producto-row-${PRODUCTO_COMBO_1_ID}`);
    const cantidad = within(fila).getByDisplayValue("1");
    await user.clear(cantidad);
    await user.type(cantidad, "4");
    await user.tab();

    await guardar(user);

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    const [titulo, opciones] = vi.mocked(toast.error).mock.calls[0];
    expect(titulo).toContain("productos y combos");
    expect((opciones as { description: string }).description).toContain(
      "la venta no se puede editar en su estado actual",
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("un 422 de referencia de combo llega al usuario con el mensaje del servidor", async () => {
    const user = userEvent.setup();
    const { handlers } = ventasEditHandlers({
      error: errorHuma(
        422,
        "Unprocessable Entity",
        "producto_combo_referencia_invalida",
        "el combo referenciado por el producto no existe en la venta",
      ),
    });
    server.use(...handlers);

    abrirModal();
    await irAProductos(user);

    const filaCombo = screen.getByTestId(`combo-row-${COMBO_ID}`);
    await user.click(within(filaCombo).getByTitle("Eliminar"));
    await guardar(user);

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    const [, opciones] = vi.mocked(toast.error).mock.calls[0];
    expect((opciones as { description: string }).description).toContain(
      "el combo referenciado por el producto no existe en la venta",
    );
  });
});

describe("EditarVentaModal — venta 100 % combos", () => {
  it("agregar un combo funciona y sale con un almacén válido", async () => {
    const user = userEvent.setup();
    const { handlers, llamadas } = ventasEditHandlers({ respuesta: ventaSoloCombosDTO() });
    server.use(...handlers);

    abrirModal(ventaSoloCombosDTO());
    await irAProductos(user);

    await user.click(screen.getByRole("button", { name: "+ Agregar combo" }));
    await user.type(
      await screen.findByPlaceholderText("ej. Sala + Comedor"),
      "Comedor Sevilla 6 sillas",
    );

    const agregar = screen.getByRole("button", { name: "Agregar" });
    expect(agregar).toBeEnabled();
    expect(screen.queryByText("Elegí origen y destino.")).not.toBeInTheDocument();
    await user.click(agregar);

    await guardar(user);

    await waitFor(() => expect(llamadas.lineas).toHaveLength(1));
    const body = llamadas.lineas[0].body as CuerpoLineas;
    const nuevo = body.combos.find((c) => c.nombre === "Comedor Sevilla 6 sillas");
    expect(nuevo).toMatchObject({
      cantidad: "1",
      almacen_origen_id: ALMACEN_ORIGEN,
      almacen_destino_id: ALMACEN_DESTINO,
    });
  });
});

// La venta SIN combos es el caso mayoritario y el que más tenía que perder con
// este cambio: ProductosTableInline perdió la columna Combo y la rama "Hereda
// combo", y AgregarProductoPanel cambió de firma.
const ventaSinCombos = (): VentaV2 =>
  ventaConComboDTO({ combos: [], productos: [mesaSuelta] });

describe("EditarVentaModal — venta sin ningún combo (el caso mayoritario)", () => {
  it("edita un producto suelto y guarda por /lineas con combos vacío", async () => {
    const user = userEvent.setup();
    const { handlers, llamadas } = ventasEditHandlers({ respuesta: ventaSinCombos() });
    server.use(...handlers);

    abrirModal(ventaSinCombos());
    await irAProductos(user);

    expect(screen.getByText("Sin combos en esta venta.")).toBeInTheDocument();

    const fila = screen.getByText("Mesa de centro Bilbao").closest("tr") as HTMLElement;
    const cantidad = within(fila).getByDisplayValue("1");
    await user.clear(cantidad);
    await user.type(cantidad, "3");
    await user.tab();

    await guardar(user);

    await waitFor(() => expect(llamadas.lineas).toHaveLength(1));
    const body = llamadas.lineas[0].body as CuerpoLineas;
    expect(body.combos).toEqual([]);
    expect(body.productos).toEqual([
      {
        id: PRODUCTO_SUELTO_ID,
        articulo_id: 45090,
        articulo: "Mesa de centro Bilbao",
        cantidad: "3",
        precio_anual: "2400.00",
        precio_corto: "2200.00",
        precio_contado: "1900.00",
        combo_id: null,
        almacen_origen_id: ALMACEN_ORIGEN,
        almacen_destino_id: ALMACEN_DESTINO,
      },
    ]);
    expect(llamadas.combos).toBe(0);
    expect(llamadas.productos).toBe(0);
  });

  it("agregar un producto SUELTO sigue naciendo sin combo y con sus dos almacenes", async () => {
    const user = userEvent.setup();
    const { handlers, llamadas } = ventasEditHandlers({ respuesta: ventaSinCombos() });
    server.use(...handlers);

    abrirModal(ventaSinCombos());
    await irAProductos(user);

    await user.click(screen.getByRole("button", { name: "+ Agregar producto" }));
    // Sin combo destino el panel no anuncia ningún combo.
    expect(screen.queryByText(/^En /)).not.toBeInTheDocument();
    await user.click(await screen.findByText("Mesa lateral Roma"));

    await guardar(user);

    await waitFor(() => expect(llamadas.lineas).toHaveLength(1));
    const body = llamadas.lineas[0].body as CuerpoLineas;
    const agregado = body.productos.find((p) => p.articulo_id === 45077);
    expect(agregado).toMatchObject({
      combo_id: null,
      almacen_origen_id: ALMACEN_ORIGEN,
      almacen_destino_id: ALMACEN_DESTINO,
    });
  });
});

describe("EditarVentaModal — un cambio que no toca líneas no manda líneas", () => {
  it("guardar sólo la nota deja /lineas y los dos viejos en cero", async () => {
    const user = userEvent.setup();
    const { handlers, llamadas } = ventasEditHandlers({ respuesta: ventaConComboDTO() });
    server.use(...handlers);

    abrirModal();
    await user.click(screen.getByRole("tab", { name: /Plan/ }));
    const nota = document.querySelector("textarea") as HTMLTextAreaElement;
    await user.type(nota, "ENTREGAR POR LA TARDE");

    await guardar(user);

    await waitFor(() => expect(llamadas.header).toBe(1));
    expect(llamadas.lineas).toHaveLength(0);
    expect(llamadas.combos).toBe(0);
    expect(llamadas.productos).toBe(0);
    expect(toast.success).toHaveBeenCalled();
  });

  it("sin ningún cambio el guardado ni siquiera se puede intentar", () => {
    const { handlers } = ventasEditHandlers({ respuesta: ventaConComboDTO() });
    server.use(...handlers);

    abrirModal();

    expect(screen.getByText("Sin cambios")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revisar y guardar" })).toBeDisabled();
  });
});

describe("EditarVentaModal — los decimales de una fila anidada", () => {
  it("teclear 1250.50 en un hijo de combo manda 1250.50, no 125050", async () => {
    const user = userEvent.setup();
    const { handlers, llamadas } = ventasEditHandlers({ respuesta: ventaConComboDTO() });
    server.use(...handlers);

    abrirModal();
    await irAProductos(user);

    const fila = screen.getByTestId(`combo-producto-row-${PRODUCTO_COMBO_2_ID}`);
    const contado = within(fila).getByDisplayValue("2500");
    await user.clear(contado);
    await user.type(contado, "1250.50");
    await user.tab();

    await guardar(user);

    await waitFor(() => expect(llamadas.lineas).toHaveLength(1));
    const body = llamadas.lineas[0].body as CuerpoLineas;
    const sillon = body.productos.find((p) => p.id === PRODUCTO_COMBO_2_ID);
    expect(sillon?.precio_contado).toBe("1250.50");
  });
});

// El combo casi nunca vale lo que suman sus partes — para eso es un combo.
const comboConDescuento = {
  ...comboSala,
  precio_anual: "15000.00",
  precio_corto: "14000.00",
  precio_contado: "12000.00",
};
const ventaComboConDescuento = (): VentaV2 =>
  ventaConComboDTO({ combos: [comboConDescuento] });

describe("EditarVentaModal — los totales que enseña son los que el servidor guarda", () => {
  it("Total anual = sueltos + combos, sin sumar los hijos del combo", () => {
    const { handlers } = ventasEditHandlers({ respuesta: ventaComboConDescuento() });
    server.use(...handlers);

    abrirModal(ventaComboConDescuento());

    // 2,400 (mesa suelta) + 15,000 (combo) = 17,400. Sumar los hijos del combo
    // en vez del combo daba 20,900: un número que la venta nunca iba a tener.
    const totalAnual = screen.getByText("Total anual").parentElement;
    expect(totalAnual).toHaveTextContent("$17,400.00");
  });

  it("editar un hijo del combo NO mueve el total, porque el servidor tampoco lo mueve", async () => {
    const user = userEvent.setup();
    const { handlers } = ventasEditHandlers({ respuesta: ventaComboConDescuento() });
    server.use(...handlers);

    abrirModal(ventaComboConDescuento());
    await irAProductos(user);

    const fila = screen.getByTestId(`combo-producto-row-${PRODUCTO_COMBO_1_ID}`);
    const anual = within(fila).getByDisplayValue("12000");
    await user.clear(anual);
    await user.type(anual, "999");
    await user.tab();

    expect(screen.getByText("Total anual").parentElement).toHaveTextContent("$17,400.00");
  });

  it("editar el precio del combo SÍ mueve el total", async () => {
    const user = userEvent.setup();
    const { handlers } = ventasEditHandlers({ respuesta: ventaComboConDescuento() });
    server.use(...handlers);

    abrirModal(ventaComboConDescuento());
    await irAProductos(user);

    const filaCombo = screen.getByTestId(`combo-row-${COMBO_ID}`);
    const anual = within(filaCombo).getByDisplayValue("15000");
    await user.clear(anual);
    await user.type(anual, "16000");
    await user.tab();

    expect(screen.getByText("Total anual").parentElement).toHaveTextContent("$18,400.00");
  });

  it("quitar el combo baja el total a lo que queda suelto", async () => {
    const user = userEvent.setup();
    const { handlers } = ventasEditHandlers({ respuesta: ventaComboConDescuento() });
    server.use(...handlers);

    abrirModal(ventaComboConDescuento());
    await irAProductos(user);

    await user.click(
      within(screen.getByTestId(`combo-row-${COMBO_ID}`)).getByTitle("Eliminar"),
    );

    expect(screen.getByText("Total anual").parentElement).toHaveTextContent("$2,400.00");
  });
});
