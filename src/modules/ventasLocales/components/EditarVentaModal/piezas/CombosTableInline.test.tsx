import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CombosTableInline } from "./CombosTableInline";
import { ProductosTableInline } from "./ProductosTableInline";
import type {
  ComboFormData,
  ProductoFormData,
  ValidationError,
} from "../../../presentation/hooks/useVentaEditState";

const COMBO_ID = "a1b2c3d4-1111-4a2b-9c3d-000000000011";
const SOFA_ID = "a1b2c3d4-2222-4a2b-9c3d-000000000021";
const SILLON_ID = "a1b2c3d4-2222-4a2b-9c3d-000000000022";
const MESA_ID = "a1b2c3d4-3333-4a2b-9c3d-000000000031";

function combo(overrides: Partial<ComboFormData> = {}): ComboFormData {
  return {
    id: COMBO_ID,
    nombre: "Sala Roma 3 piezas",
    precioAnual: 18500,
    precioCortoPlazo: 16900,
    precioContado: 14500,
    cantidad: 1,
    almacenOrigenID: 19,
    almacenDestinoID: 11058,
    isNew: false,
    isDeleted: false,
    ...overrides,
  };
}

// El orden de esta lista ES el índice global que reciben los callbacks.
function productos(): ProductoFormData[] {
  return [
    {
      id: SOFA_ID,
      articuloId: 45012,
      articulo: "Sofá 3 plazas Roma",
      cantidad: 1,
      precioAnual: 12000,
      precioCortoPlazo: 11000,
      precioContado: 9500,
      comboID: COMBO_ID,
      almacenOrigenID: null,
      almacenDestinoID: null,
      isNew: false,
      isDeleted: false,
    },
    {
      id: MESA_ID,
      articuloId: 45090,
      articulo: "Mesa de centro Bilbao",
      cantidad: 1,
      precioAnual: 2400,
      precioCortoPlazo: 2200,
      precioContado: 1900,
      comboID: null,
      almacenOrigenID: 19,
      almacenDestinoID: 11058,
      isNew: false,
      isDeleted: false,
    },
    {
      id: SILLON_ID,
      articuloId: 45013,
      articulo: "Sillón individual Roma",
      cantidad: 2,
      precioAnual: 3250,
      precioCortoPlazo: 2950,
      precioContado: 2500,
      comboID: COMBO_ID,
      almacenOrigenID: null,
      almacenDestinoID: null,
      isNew: false,
      isDeleted: false,
    },
  ];
}

function setup(overrides: {
  combos?: ComboFormData[];
  productos?: ProductoFormData[];
  errors?: ValidationError[];
} = {}) {
  const handlers = {
    onUpdate: vi.fn(),
    onRemove: vi.fn(),
    onRestore: vi.fn(),
    onUpdateProducto: vi.fn(),
    onRemoveProducto: vi.fn(),
    onRestoreProducto: vi.fn(),
    onAgregarProducto: vi.fn(),
  };
  render(
    <CombosTableInline
      combos={overrides.combos ?? [combo()]}
      productos={overrides.productos ?? productos()}
      almacenes={[{ id: 19, nombre: "CAMIONETA 19" }]}
      errors={overrides.errors ?? []}
      {...handlers}
    />,
  );
  return handlers;
}

describe("CombosTableInline — los productos del combo se editan anidados", () => {
  it("muestra bajo el combo sólo sus productos, no los sueltos", () => {
    setup();

    expect(screen.getByTestId(`combo-producto-row-${SOFA_ID}`)).toBeInTheDocument();
    expect(screen.getByTestId(`combo-producto-row-${SILLON_ID}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`combo-producto-row-${MESA_ID}`)).not.toBeInTheDocument();
    expect(screen.queryByText("Mesa de centro Bilbao")).not.toBeInTheDocument();
  });

  it("editar la cantidad de un producto anidado avisa con su ÍNDICE GLOBAL", async () => {
    const user = userEvent.setup();
    const handlers = setup();

    // El sillón es el índice 2 de la lista completa, no el 1 dentro del combo.
    const fila = screen.getByTestId(`combo-producto-row-${SILLON_ID}`);
    const cantidad = within(fila).getByDisplayValue("2");
    await user.clear(cantidad);
    await user.type(cantidad, "5");
    await user.tab();

    expect(handlers.onUpdateProducto).toHaveBeenCalledWith(2, "cantidad", 5);
  });

  it("quitar un producto anidado avisa con su índice global", async () => {
    const user = userEvent.setup();
    const handlers = setup();

    const fila = screen.getByTestId(`combo-producto-row-${SOFA_ID}`);
    await user.click(within(fila).getByTitle("Eliminar"));

    expect(handlers.onRemoveProducto).toHaveBeenCalledWith(0);
  });

  it("cada combo ofrece agregar un producto dentro de él", async () => {
    const user = userEvent.setup();
    const handlers = setup();

    await user.click(screen.getByRole("button", { name: /producto/i }));

    expect(handlers.onAgregarProducto).toHaveBeenCalledWith(
      expect.objectContaining({ id: COMBO_ID, almacenOrigenID: 19 }),
    );
  });

  it("un combo sin productos lo dice y sigue aceptando altas", () => {
    setup({ productos: [productos()[1]] });

    expect(screen.getByText("Combo vacío")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /producto/i })).toBeEnabled();
  });

  it("con el combo quitado no se restaura un producto suelto por su cuenta", () => {
    const conCascada = productos().map((p) =>
      p.comboID === COMBO_ID ? { ...p, isDeleted: true, deletedByCombo: true } : p,
    );
    setup({ combos: [combo({ isDeleted: true })], productos: conCascada });

    const fila = screen.getByTestId(`combo-producto-row-${SOFA_ID}`);
    expect(within(fila).getByTitle("Restaurar")).toBeDisabled();
  });
});

describe("CombosTableInline — los bordes rojos ya no son código muerto", () => {
  it("marca la cantidad del combo cuando la validación la rechaza", () => {
    setup({
      combos: [combo({ cantidad: -2 })],
      errors: [
        { field: `combos[${COMBO_ID}].cantidad`, message: "la cantidad debe ser mayor a cero" },
      ],
    });

    const fila = screen.getByTestId(`combo-row-${COMBO_ID}`);
    expect(within(fila).getByDisplayValue("-2")).toHaveAttribute("aria-invalid", "true");
  });

  it("marca la cantidad de un producto anidado", () => {
    setup({
      errors: [
        { field: `productos[${SOFA_ID}].cantidad`, message: "la cantidad debe ser mayor a cero" },
      ],
    });

    const fila = screen.getByTestId(`combo-producto-row-${SOFA_ID}`);
    expect(within(fila).getByDisplayValue("1")).toHaveAttribute("aria-invalid", "true");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Varios combos, cada uno con varios productos, y sueltos intercalados.
//
// El caso de arriba tiene UN combo cuyo primer hijo cae además en el índice
// global 0, así que un callback indexado por la posición DENTRO del combo lo
// pasaría igual. Con dos combos y un orden que no agrupa, la posición local y
// la global sólo coinciden por accidente: aquí un error de índice edita el
// producto de otro combo en silencio, que es peor que no poder editarlo.
// ─────────────────────────────────────────────────────────────────────────────

const COMBO_A = "aaaaaaaa-1111-4a2b-9c3d-00000000000a";
const COMBO_B = "bbbbbbbb-1111-4a2b-9c3d-00000000000b";

function comboAB(): ComboFormData[] {
  return [
    combo({ id: COMBO_A, nombre: "Sala Roma" }),
    combo({ id: COMBO_B, nombre: "Recámara Oslo", precioContado: 9000 }),
  ];
}

function producto(
  id: string,
  articulo: string,
  comboID: string | null,
  cantidad: number,
): ProductoFormData {
  return {
    id,
    articuloId: 1,
    articulo,
    cantidad,
    precioAnual: 1,
    precioCortoPlazo: 1,
    precioContado: 1,
    comboID,
    almacenOrigenID: comboID === null ? 19 : null,
    almacenDestinoID: comboID === null ? 11058 : null,
    isNew: false,
    isDeleted: false,
  };
}

// Orden deliberadamente revuelto: ni agrupado por combo ni en el orden de la
// lista de combos.
function productosEntrelazados(): ProductoFormData[] {
  return [
    producto("p0", "Mesa suelta", null, 10),          // índice global 0
    producto("p1", "Lámpara Oslo", COMBO_B, 11),      // 1 · combo B, 1.º
    producto("p2", "Sofá Roma", COMBO_A, 12),         // 2 · combo A, 1.º
    producto("p3", "Banco suelto", null, 13),         // 3
    producto("p4", "Buró Oslo", COMBO_B, 14),         // 4 · combo B, 2.º
    producto("p5", "Sillón Roma", COMBO_A, 15),       // 5 · combo A, 2.º
  ];
}

function setupEntrelazado() {
  return setup({ combos: comboAB(), productos: productosEntrelazados() });
}

describe("CombosTableInline — varios combos entrelazados con productos sueltos", () => {
  it("cada combo agrupa SOLO sus productos, en el orden de formData", () => {
    setupEntrelazado();

    const filas = Array.from(document.querySelectorAll("tr[data-testid]")).map((tr) =>
      tr.getAttribute("data-testid"),
    );
    expect(filas).toEqual([
      `combo-row-${COMBO_A}`,
      "combo-producto-row-p2",
      "combo-producto-row-p5",
      `combo-row-${COMBO_B}`,
      "combo-producto-row-p1",
      "combo-producto-row-p4",
    ]);
    // Los sueltos no se cuelan bajo ningún combo.
    expect(screen.queryByText("Mesa suelta")).not.toBeInTheDocument();
    expect(screen.queryByText("Banco suelto")).not.toBeInTheDocument();
  });

  it("editar el 2.º hijo del combo B avisa con el índice global 4, no con el 1 local", async () => {
    const user = userEvent.setup();
    const handlers = setupEntrelazado();

    const fila = screen.getByTestId("combo-producto-row-p4");
    const cantidad = within(fila).getByDisplayValue("14");
    await user.clear(cantidad);
    await user.type(cantidad, "7");
    await user.tab();

    expect(handlers.onUpdateProducto).toHaveBeenCalledWith(4, "cantidad", 7);
    // Y con NINGÚN otro índice: editar una fila no puede tocar otra.
    for (const [idx] of handlers.onUpdateProducto.mock.calls) {
      expect(idx).toBe(4);
    }
  });

  it("editar el 1.º hijo del combo A avisa con el índice global 2, no con el 0", async () => {
    const user = userEvent.setup();
    const handlers = setupEntrelazado();

    const fila = screen.getByTestId("combo-producto-row-p2");
    const precio = within(fila).getAllByDisplayValue("1")[0];
    await user.clear(precio);
    await user.type(precio, "9");
    await user.tab();

    for (const [idx] of handlers.onUpdateProducto.mock.calls) {
      expect(idx).toBe(2);
    }
  });

  it("quitar el 2.º hijo del combo A avisa con el índice global 5", async () => {
    const user = userEvent.setup();
    const handlers = setupEntrelazado();

    await user.click(
      within(screen.getByTestId("combo-producto-row-p5")).getByTitle("Eliminar"),
    );

    expect(handlers.onRemoveProducto).toHaveBeenCalledTimes(1);
    expect(handlers.onRemoveProducto).toHaveBeenCalledWith(5);
  });

  it("el «+ Producto» de cada combo pasa SU combo", async () => {
    const user = userEvent.setup();
    const handlers = setupEntrelazado();

    const botones = screen.getAllByRole("button", { name: /^Producto$/ });
    expect(botones).toHaveLength(2);

    await user.click(botones[1]);
    expect(handlers.onAgregarProducto).toHaveBeenCalledWith(
      expect.objectContaining({ id: COMBO_B, nombre: "Recámara Oslo" }),
    );
  });

  it("editar el combo B avisa con su índice en la lista de combos", async () => {
    const user = userEvent.setup();
    const handlers = setupEntrelazado();

    const fila = screen.getByTestId(`combo-row-${COMBO_B}`);
    const nombre = within(fila).getByLabelText("Nombre del combo Recámara Oslo");
    await user.type(nombre, "!");

    expect(handlers.onUpdate).toHaveBeenCalledWith(1, "nombre", "Recámara Oslo!");
  });
});

describe("ProductosTableInline — sólo sueltos, con el índice global", () => {
  it("no pinta los hijos de combo y borra el suelto por su índice global", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <ProductosTableInline
        productos={productosEntrelazados()}
        almacenes={[{ id: 19, nombre: "CAMIONETA 19" }]}
        errors={[]}
        onUpdate={vi.fn()}
        onRemove={onRemove}
        onRestore={vi.fn()}
      />,
    );

    expect(screen.getByText("Mesa suelta")).toBeInTheDocument();
    expect(screen.getByText("Banco suelto")).toBeInTheDocument();
    expect(screen.queryByText("Sofá Roma")).not.toBeInTheDocument();
    expect(screen.queryByText("Lámpara Oslo")).not.toBeInTheDocument();

    const fila = screen.getByText("Banco suelto").closest("tr");
    await user.click(within(fila as HTMLElement).getByTitle("Eliminar"));

    expect(onRemove).toHaveBeenCalledWith(3);
  });
});
