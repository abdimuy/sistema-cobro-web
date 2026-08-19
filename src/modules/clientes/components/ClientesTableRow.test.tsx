import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ClientesTableRow } from "./ClientesTableRow";
import { DEFAULT_COLUMN_WIDTHS, type ColumnId } from "./columns";
import type { Cliente } from "../domain/entities";

const CLIENTE: Cliente = {
  clienteId: 4821,
  nombre: "María Fernanda Olvera",
  zona: "ZONA NORTE",
  telefono: "3312345678",
  direccionCorta: "Av. Hidalgo 142",
  score: 72,
  segmento: null,
  estadoPago: null,
  tienePulso: false,
  recenciaDias: 12,
  saldo: "1250.00",
};

const VISIBLE: ColumnId[] = ["cliente", "zona"];

function renderRow(props: Partial<React.ComponentProps<typeof ClientesTableRow>> = {}) {
  return render(
    <table>
      <tbody>
        <ClientesTableRow
          cliente={CLIENTE}
          visibleColumns={VISIBLE}
          pinnedColumns={["cliente"]}
          pinnedOffsets={{ cliente: 0 }}
          columnWidths={DEFAULT_COLUMN_WIDTHS}
          onRowClick={vi.fn()}
          {...props}
        />
      </tbody>
    </table>
  );
}

const pinnedCell = () =>
  screen.getByText(CLIENTE.nombre).closest("td") as HTMLTableCellElement;

const row = () => pinnedCell().closest("tr") as HTMLTableRowElement;

describe("ClientesTableRow — fondo de la celda anclada", () => {
  it("no hereda el fondo del <tr> ni usa un token sin hsl()", () => {
    renderRow();

    // `var(--card)` a secas no es un color válido: la variable guarda canales.
    expect(pinnedCell().style.background).not.toBe("inherit");
    expect(pinnedCell().style.background).not.toBe("var(--card)");
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
});
