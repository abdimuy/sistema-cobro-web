import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../presentation/hooks/useVentaEventos", () => ({
  useVentaEventos: vi.fn(() => ({ eventos: [], isLoading: false, error: null })),
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

  it("muestra chip 'teléfono' y resalta el teléfono cuando campo=telefono", () => {
    renderRow({
      visibleColumns: ["cliente", "telefono"],
      venta: { ...ARCHIVO, TELEFONO: "236 381 0042", COINCIDENCIAS: [coin("telefono", [seg("236 ", false), seg("381", true), seg(" 0042", false)])] },
    });
    expect(screen.getByText("teléfono")).toBeInTheDocument();
    expect(document.querySelector("mark")).toHaveTextContent("381");
  });

  it("muestra 'Coincide en artículos' aunque no sea columna", () => {
    renderRow({
      venta: { ...ARCHIVO, COINCIDENCIAS: [coin("articulos", [seg("Sala ", false), seg("Milán", true)])] },
    });
    expect(screen.getByText(/Coincide en/)).toBeInTheDocument();
    expect(document.querySelector("mark")).toHaveTextContent("Milán");
  });

  it("con cliente oculto el bloque de motivos aparece en la primera columna visible", () => {
    renderRow({
      visibleColumns: ["zona", "telefono"],
      venta: { ...ARCHIVO, COINCIDENCIAS: [coin("articulos", [seg("Milán", true)])] },
    });
    const celda = screen.getByText(/Coincide en/).closest("td") as HTMLTableCellElement;
    expect(celda).toBe(document.querySelector("tr")!.querySelector("td"));
  });

  it("tono de fila de Archivo distinto al de la app y token propio en hover", () => {
    renderRow({ venta: ARCHIVO });
    const tr = document.querySelector("tr") as HTMLTableRowElement;
    expect(tr.style.background).toBe("hsl(var(--fila-archivo))");
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
