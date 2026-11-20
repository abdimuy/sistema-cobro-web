import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../presentation/hooks/useVentaEventos", () => ({
  useVentaEventos: vi.fn(() => ({ eventos: [], isLoading: false, error: null })),
}));

// Sin red: la vista previa de fotos monta AuthenticatedImage al abrirse.
vi.mock("./detalle/AuthenticatedImage", () => ({
  default: ({ alt }: { alt?: string }) => <span data-testid="img-falsa">{alt}</span>,
}));

import { useVentaEventos } from "../presentation/hooks/useVentaEventos";
import { VentasTableRow } from "./VentasTableRow";
import { DEFAULT_COLUMN_WIDTHS, type ColumnId } from "./columns";
import type { VentaLocal } from "@/services/api/getVentasLocales";

const VENTA: VentaLocal = {
  LOCAL_SALE_ID: "9f1c0a52-1d2b-4b9e-8a44-1f3c5d7e9b01",
  USER_EMAIL: "ricardo.villalobos@muebleriamsp.mx",
  ALMACEN_ID: 19,
  NOMBRE_CLIENTE: "María Fernanda Olvera",
  FECHA_VENTA: "2026-08-10T18:00:00Z",
  LATITUD: 20.67,
  LONGITUD: -103.34,
  DIRECCION: "Av. Hidalgo 142",
  PRECIO_TOTAL: 12500,
  TELEFONO: "3312345678",
};

const mockUseVentaEventos = vi.mocked(useVentaEventos);

const VISIBLE: ColumnId[] = ["cliente", "zona"];

function renderRow(props: Partial<React.ComponentProps<typeof VentasTableRow>> = {}) {
  return render(
    <table>
      <tbody>
        <VentasTableRow
          venta={VENTA}
          visibleColumns={VISIBLE}
          pinnedColumns={["cliente"]}
          pinnedOffsets={{ cliente: 0 }}
          columnWidths={DEFAULT_COLUMN_WIDTHS}
          onViewDetails={vi.fn()}
          getAlmacenName={() => "ALM 19"}
          {...props}
        />
      </tbody>
    </table>
  );
}

const pinnedCell = () =>
  screen.getByText(VENTA.NOMBRE_CLIENTE).closest("td") as HTMLTableCellElement;

const row = () => pinnedCell().closest("tr") as HTMLTableRowElement;

describe("VentasTableRow — fondo de la celda anclada", () => {
  it("la celda anclada no hereda el fondo del <tr>", () => {
    renderRow();

    // `inherit` heredaba `transparent` y dejaba ver por debajo las columnas
    // que se desplazan.
    expect(pinnedCell().style.background).not.toBe("inherit");
    expect(pinnedCell().style.position).toBe("sticky");
  });

  it("pinta un color opaco por token en la fila normal", () => {
    renderRow();

    expect(pinnedCell().style.background).toBe("hsl(var(--card))");
    expect(row().style.background).toBe("hsl(var(--card))");
  });

  it("acompaña a la cebra en las filas pares", () => {
    renderRow({ zebra: true });

    expect(pinnedCell().style.background).toBe("hsl(var(--muted))");
    expect(row().style.background).toBe("hsl(var(--muted))");
  });

  it("acompaña al hover en lugar de quedarse apagada", () => {
    renderRow();

    fireEvent.mouseEnter(row());
    expect(pinnedCell().style.background).toBe("hsl(var(--accent))");
    expect(row().style.background).toBe(pinnedCell().style.background);

    fireEvent.mouseLeave(row());
    expect(pinnedCell().style.background).toBe("hsl(var(--card))");
  });

  it("la celda no anclada se queda sin fondo propio", () => {
    renderRow();

    const zonaCell = screen.getByText("—").closest("td") as HTMLTableCellElement;
    expect(zonaCell.style.position).toBe("");
    expect(zonaCell.style.background).toBe("");
  });
});

describe("VentasTableRow — columna de zona", () => {
  it("muestra el nombre de zona que trae la venta", () => {
    renderRow({ venta: { ...VENTA, ZONA_CLIENTE: "ZONA NORTE" } });

    expect(screen.getByText("ZONA NORTE")).toBeInTheDocument();
  });

  it("muestra — cuando la venta no trae nombre de zona", () => {
    renderRow({ venta: { ...VENTA, ZONA_CLIENTE_ID: 7 } });

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("VentasTableRow — nombres de usuario en vez de UUID", () => {
  const UUID_CREADOR = "0f8a1c22-6f5b-4a1e-9d3c-77b2a4e6d180";
  const COLUMNAS_USUARIO: ColumnId[] = [
    "cliente",
    "creador",
    "updatedBy",
    "aprobadoBy",
    "canceladoBy",
  ];

  it("muestra el nombre cuando el API lo manda", () => {
    renderRow({
      visibleColumns: COLUMNAS_USUARIO,
      venta: {
        ...VENTA,
        CREATED_BY: UUID_CREADOR,
        CREATED_BY_NOMBRE: "Gabriel Roque Méndez",
        UPDATED_BY: UUID_CREADOR,
        UPDATED_BY_NOMBRE: "Sayuri Vianey Morales",
        APROBADO_BY: UUID_CREADOR,
        APROBADO_BY_NOMBRE: "Jesús Guillermo Soto",
        CANCELADO_BY: UUID_CREADOR,
        CANCELADO_BY_NOMBRE: "Maribel Mendoza Blanco",
      },
    });

    expect(screen.getByText("Gabriel Roque Méndez")).toBeInTheDocument();
    expect(screen.getByText("Sayuri Vianey Morales")).toBeInTheDocument();
    expect(screen.getByText("Jesús Guillermo Soto")).toBeInTheDocument();
    expect(screen.getByText("Maribel Mendoza Blanco")).toBeInTheDocument();
    expect(screen.queryByText(UUID_CREADOR.slice(0, 8))).not.toBeInTheDocument();
  });

  it("cae al UUID recortado sólo cuando el nombre no viene", () => {
    renderRow({
      visibleColumns: ["cliente", "aprobadoBy"],
      venta: { ...VENTA, APROBADO_BY: UUID_CREADOR },
    });

    expect(screen.getByText(UUID_CREADOR.slice(0, 8))).toBeInTheDocument();
  });

  it("sin nombre ni UUID, el creador cae al correo histórico", () => {
    renderRow({ visibleColumns: ["cliente", "creador"], venta: VENTA });

    expect(screen.getByText("ricardo.villalobos")).toBeInTheDocument();
  });
});

describe("VentasTableRow — columna de fase", () => {
  it("dibuja el anillo con la fase de la venta", () => {
    renderRow({
      visibleColumns: ["fase", "cliente"],
      pinnedColumns: ["fase", "cliente"],
      pinnedOffsets: { fase: 0, cliente: 186 },
      venta: { ...VENTA, SITUACION: "aprobada", SINCRONIZACION: "pendiente" },
    });

    expect(screen.getByText("Aprobada")).toBeInTheDocument();
    expect(screen.getByTestId("fase-anillo")).toHaveAttribute("data-arcos", "3");
  });

  it("la celda de fase queda anclada, con el mismo fondo que la fila", () => {
    renderRow({
      visibleColumns: ["fase", "cliente"],
      pinnedColumns: ["fase", "cliente"],
      pinnedOffsets: { fase: 0, cliente: 186 },
    });

    const celdaFase = screen.getByTestId("fase-anillo").closest("td") as HTMLTableCellElement;
    expect(celdaFase.style.position).toBe("sticky");
    expect(celdaFase.style.left).toBe("0px");
    expect(celdaFase.style.background).toBe("hsl(var(--card))");
  });

  it("en densidad compacta el anillo baja a 18 px", () => {
    renderRow({ visibleColumns: ["fase", "cliente"], density: "compact" });

    expect(screen.getByTestId("fase-anillo")).toHaveAttribute("width", "18");
  });
});

describe("VentasTableRow — Archivo y coincidencias", () => {
  const ARCHIVO: VentaLocal = {
    ...VENTA,
    LOCAL_SALE_ID: "arch-1832",
    ORIGEN: "archivo",
    NOMBRE_CLIENTE: "JOSÉ LUIS GARCÍA RAMOS",
    TIPO_VENTA: undefined,
    ESTADO: undefined,
  } as unknown as VentaLocal;
  const seg = (texto: string, coincide: boolean) => ({ texto, coincide });
  const coin = (
    campo: "cliente" | "telefono" | "articulos",
    segmentos: { texto: string; coincide: boolean }[],
  ) => ({ campo, segmentos, aproximada: false, recortado: false });
  const COLS_FASE: ColumnId[] = [
    "fase", "cliente", "telefono", "situacion", "microsipFolio", "tipo", "estado",
  ];

  beforeEach(() => mockUseVentaEventos.mockClear());

  it("fila de Archivo muestra el badge Archivo y NO llama useVentaEventos", () => {
    renderRow({ venta: ARCHIVO, visibleColumns: COLS_FASE });
    expect(screen.getByText("Archivo")).toBeInTheDocument();
    expect(screen.queryByTestId("fase-anillo")).toBeNull();
    expect(mockUseVentaEventos).not.toHaveBeenCalled();
  });

  it("Archivo: círculo violeta con la etiqueta accesible y sin anillo de fase", () => {
    const { container } = renderRow({ venta: ARCHIVO, visibleColumns: COLS_FASE });
    const marca = screen.getByRole("img", { name: "Venta del sistema anterior" });
    expect(marca).toHaveAttribute("title", "Venta del sistema anterior");
    const circulo = marca.firstElementChild as HTMLElement;
    expect(circulo.className).toContain("h-[30px]");
    expect(circulo.className).toContain("rounded-full");
    expect(circulo.style.boxShadow).toContain("var(--archivo-borde)");
    expect(circulo.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector('[data-testid="fase-anillo"]')).toBeNull();
  });

  it("Archivo: línea 'Sistema anterior · año' en hora de oficina, sin fotos si la lista no las cuenta", () => {
    renderRow({
      venta: { ...ARCHIVO, FECHA_VENTA: "2020-01-01T03:00:00Z", IMAGENES_COUNT: 0 },
      visibleColumns: ["cliente"],
    });
    const linea = screen.getByText("Sistema anterior").parentElement as HTMLElement;
    // 03:00Z del 1 de enero es 31 de diciembre de 2019 en la oficina.
    expect(linea.textContent).toBe("Sistema anterior·2019");
    expect(linea.textContent).not.toMatch(/foto/);
  });

  it("Archivo: con conteo de imágenes muestra '1 foto' / 'n fotos'", () => {
    const { unmount } = renderRow({
      venta: { ...ARCHIVO, IMAGENES_COUNT: 1 },
      visibleColumns: ["cliente"],
    });
    expect(screen.getByText("1 foto")).toBeInTheDocument();
    unmount();
    renderRow({ venta: { ...ARCHIVO, IMAGENES_COUNT: 3 }, visibleColumns: ["cliente"] });
    expect(screen.getByText("3 fotos")).toBeInTheDocument();
  });

  it("Archivo: franja violeta en la primera celda; la app no lleva franja ni línea", () => {
    renderRow({ venta: ARCHIVO, visibleColumns: ["cliente", "situacion"] });
    const td = document.querySelector("td") as HTMLTableCellElement;
    expect(td.style.boxShadow).toContain("inset 3px 0 0 var(--archivo-borde)");
  });

  it("Archivo: 'Solo consulta' lleva el candado", () => {
    renderRow({ venta: ARCHIVO, visibleColumns: ["situacion"] });
    const t = screen.getByText("Solo consulta");
    expect(t.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("app: sin línea 'Sistema anterior' ni candado", () => {
    renderRow({ visibleColumns: ["cliente", "situacion"] });
    expect(screen.queryByText("Sistema anterior")).toBeNull();
    expect(document.querySelector("tr")!.style.background).not.toContain("archivo");
  });

  it("fila de app sigue montando FaseCell", () => {
    // El hook se llama solo al abrir el panel de la fase; montarla se ve en el anillo.
    renderRow({ visibleColumns: ["fase", "cliente"] });
    expect(screen.getByTestId("fase-anillo")).toBeInTheDocument();
  });

  it("Archivo: Situación 'Solo consulta' y Folio '—'", () => {
    renderRow({ venta: ARCHIVO, visibleColumns: ["cliente", "situacion", "microsipFolio"] });
    expect(screen.getByText("Solo consulta")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(1);
  });

  it("Archivo: no renderiza ninguna <img> (sin miniaturas)", () => {
    const { container } = renderRow({ venta: ARCHIVO, visibleColumns: COLS_FASE });
    expect(container.querySelector("img")).toBeNull();
  });

  it("clic en el nombre de Archivo llama onViewDetails", () => {
    const onViewDetails = vi.fn();
    renderRow({ venta: ARCHIVO, onViewDetails });
    fireEvent.click(screen.getByRole("button", { name: ARCHIVO.NOMBRE_CLIENTE }));
    expect(onViewDetails).toHaveBeenCalled();
  });

  it("resalta con <mark> el segmento coincidente del cliente", () => {
    renderRow({
      venta: { ...ARCHIVO, COINCIDENCIAS: [coin("cliente", [seg("JOSÉ LUIS ", false), seg("GARCÍA", true), seg(" RAMOS", false)])] },
    });
    const mark = document.querySelector("mark");
    expect(mark).toHaveTextContent("GARCÍA");
  });

  it("coincidencia en columna visible: resalta ahí y la línea muestra la dirección en gris, sin etiquetas", () => {
    renderRow({
      visibleColumns: ["cliente", "telefono"],
      venta: { ...ARCHIVO, DIRECCION: "Calle Hidalgo 18", TELEFONO: "236 381 0042", COINCIDENCIAS: [coin("telefono", [seg("236 ", false), seg("381", true), seg(" 0042", false)])] },
    });
    expect(document.querySelector("mark")).toHaveTextContent("381");
    expect(screen.getByTestId("coincidencia-linea")).toHaveTextContent("Calle Hidalgo 18");
    expect(document.querySelector(".coincide-chip")).toBeNull();
    expect(screen.queryByText("Sistema anterior")).toBeNull();
  });

  it("coincidencia en artículos: una línea con +N si hay más campos ocultos", () => {
    renderRow({
      venta: { ...ARCHIVO, COINCIDENCIAS: [coin("articulos", [seg("Sala ", false), seg("Milán", true)]), coin("telefono", [seg("1832", true)])] },
      visibleColumns: ["cliente"],
    });
    const linea = screen.getByTestId("coincidencia-linea");
    expect(linea.querySelector("mark")).toHaveTextContent("Milán");
    expect(linea).toHaveTextContent("+1");
    expect(screen.getByRole("button", { name: /Coincide en artículos: Sala Milán/ })).toBeInTheDocument();
  });

  it("con cliente oculto el bloque de motivos aparece en la primera columna visible", () => {
    renderRow({
      visibleColumns: ["zona", "telefono"],
      venta: { ...ARCHIVO, COINCIDENCIAS: [coin("articulos", [seg("Milán", true)])] },
    });
    const celda = screen.getByTestId("coincidencia-linea").closest("td") as HTMLTableCellElement;
    expect(celda).toBe(document.querySelector("tr")!.querySelector("td"));
  });

  it("tono de fila de Archivo distinto al de la app y token propio en hover", () => {
    renderRow({ venta: ARCHIVO });
    const tr = document.querySelector("tr") as HTMLTableRowElement;
    expect(tr.style.background).toContain("var(--archivo-fondo)");
    fireEvent.mouseEnter(tr);
    expect(tr.style.background).toBe("hsl(var(--accent))");
  });

  it("fila de app sin coincidencias no renderiza <mark> ni chips", () => {
    const { container } = renderRow();
    expect(container.querySelector("mark")).toBeNull();
    expect(container.querySelector(".coincide-chip")).toBeNull();
  });
});

describe("VentasTableRow — fixes finales", () => {
  it("teléfono resaltado conserva el formato (331) 234-5678", () => {
    const venta = {
      ...VENTA,
      COINCIDENCIAS: [
        {
          campo: "telefono",
          segmentos: [
            { texto: "331", coincide: true },
            { texto: "2345678", coincide: false },
          ],
          aproximada: false,
          recortado: false,
        },
      ],
    } as unknown as VentaLocal;
    renderRow({ venta, visibleColumns: ["cliente", "telefono"] });
    const cell = screen.getByText(/234-5678/).closest("td") as HTMLElement;
    expect(cell.textContent).toContain("(331) 234-5678");
    const marks = cell.querySelectorAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe("331");
  });

  it("Archivo con created_by nil UUID y sin nombre muestra — y no 00000000", () => {
    const venta = {
      ...VENTA,
      ORIGEN: "archivo",
      CREATED_BY: "00000000-0000-0000-0000-000000000000",
      USER_EMAIL: undefined,
    } as unknown as VentaLocal;
    renderRow({ venta, visibleColumns: ["cliente", "creador"] });
    expect(screen.queryByText("00000000")).toBeNull();
    const celda = screen.getByText("—").closest("td") as HTMLElement;
    expect(celda).toBeInTheDocument();
  });

  it("'Ver detalles' del menú entrega la fila como destino del foco, no el ítem que se desmonta", async () => {
    const onViewDetails = vi.fn();
    renderRow({ onViewDetails });
    const user = userEvent.setup();
    const trigger = document.querySelector(
      'button[aria-haspopup="menu"]',
    ) as HTMLElement;
    await user.click(trigger);
    await user.click(await screen.findByText("Ver detalles"));
    expect(onViewDetails).toHaveBeenCalledWith(row());
  });

  const abrirMenu = async () => {
    const user = userEvent.setup();
    const trigger = document.querySelector(
      'button[aria-haspopup="menu"]',
    ) as HTMLElement;
    await user.click(trigger);
    return { user, trigger };
  };

  it("tras otro ítem del menú (Copiar ID) el foco vuelve al disparador", async () => {
    renderRow();
    const { user, trigger } = await abrirMenu();
    await user.click(await screen.findByText("Copiar ID"));
    await vi.waitFor(() => expect(trigger).toHaveFocus());
  });

  it("con Escape el foco vuelve al disparador", async () => {
    renderRow();
    const { user, trigger } = await abrirMenu();
    await screen.findByText("Ver detalles");
    await user.keyboard("{Escape}");
    await vi.waitFor(() => expect(trigger).toHaveFocus());
  });

  it("tras 'Ver detalles' Radix no devuelve el foco al disparador", async () => {
    renderRow();
    const { user, trigger } = await abrirMenu();
    await user.click(await screen.findByText("Ver detalles"));
    await new Promise((r) => setTimeout(r, 50));
    expect(trigger).not.toHaveFocus();
  });
});

describe("VentasTableRow — vista previa de fotos", () => {
  const fotos = [1, 2, 3].map((n) => ({
    id: `img-${n}`,
    descripcion: null,
    created_at: "2026-08-10T18:30:00Z",
    mime: "image/jpeg",
  }));

  it("con fotos muestra la pila antes del nombre; sin fotos, el espacio", () => {
    const { unmount } = renderRow({ venta: { ...VENTA, IMAGENES: fotos } });
    const pila = screen.getByRole("button", { name: "3 fotos de María Fernanda Olvera. Abrir" });
    const nombre = screen.getByText(VENTA.NOMBRE_CLIENTE);
    expect(pila.compareDocumentPosition(nombre) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    unmount();

    renderRow();
    expect(screen.queryByRole("button", { name: /fotos? de/ })).toBeNull();
    expect(screen.getByTestId("fotos-espacio")).toBeInTheDocument();
  });

  it("Archivo: la pila pide abrir el panel en la foto 0 sin abrir el detalle", async () => {
    const onAbrirFotoArchivo = vi.fn();
    const onViewDetails = vi.fn();
    renderRow({
      venta: { ...VENTA, ORIGEN: "archivo", IMAGENES: fotos } as VentaLocal,
      onAbrirFotoArchivo,
      onViewDetails,
    });
    await userEvent.click(screen.getByRole("button", { name: /3 fotos de/ }));
    expect(onAbrirFotoArchivo).toHaveBeenCalledTimes(1);
    expect(onAbrirFotoArchivo.mock.calls[0]?.[0]).toBe(0);
    expect(onViewDetails).not.toHaveBeenCalled();
  });

  it("app: clic en una miniatura abre el visor y NO el detalle; clics dentro del visor tampoco", async () => {
    const onViewDetails = vi.fn();
    renderRow({ venta: { ...VENTA, IMAGENES: fotos }, onViewDetails });
    await userEvent.tab();
    await userEvent.click(await screen.findByRole("button", { name: "Ver foto: Foto 3" }));
    expect(onViewDetails).not.toHaveBeenCalled();
    // El visor real (en portal) está abierto: cualquier clic dentro de él.
    const zoom = await screen.findByTitle(/Zoom in/);
    await userEvent.click(zoom);
    expect(onViewDetails).not.toHaveBeenCalled();
  });

  it("Archivo: clic en la miniatura 4 pide abrir en la foto 4 y NO abre el detalle", async () => {
    const onAbrirFotoArchivo = vi.fn();
    const onViewDetails = vi.fn();
    const cinco = [1, 2, 3, 4, 5].map((n) => ({ ...fotos[0]!, id: `i${n}` }));
    renderRow({
      venta: { ...VENTA, ORIGEN: "archivo", IMAGENES: cinco } as VentaLocal,
      onAbrirFotoArchivo,
      onViewDetails,
    });
    await userEvent.tab();
    await userEvent.click(await screen.findByRole("button", { name: "Ver foto: Foto 4" }));
    expect(onAbrirFotoArchivo.mock.calls[0]?.[0]).toBe(3);
    expect(onViewDetails).not.toHaveBeenCalled();
  });

  it("clic en la foto grande de la tarjeta no abre el detalle", async () => {
    const onViewDetails = vi.fn();
    renderRow({ venta: { ...VENTA, IMAGENES: fotos }, onViewDetails });
    await userEvent.tab();
    await userEvent.click(await screen.findByRole("button", { name: /^Abrir foto:/ }));
    expect(onViewDetails).not.toHaveBeenCalled();
  });
});
