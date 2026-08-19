import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

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
