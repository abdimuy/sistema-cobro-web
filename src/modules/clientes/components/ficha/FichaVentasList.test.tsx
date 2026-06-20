import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FichaVentasList } from "./FichaVentasList";
import { makeFakeVentaCliente } from "../../application/__tests__/fakeClientesPort";
import type { VentaCliente } from "../../domain/entities/VentaCliente";

function renderList(
  ventas: ReadonlyArray<VentaCliente>,
  onVentaClick = vi.fn(),
) {
  return render(
    <FichaVentasList
      ventas={ventas}
      isLoading={false}
      isLoadingMore={false}
      error={null}
      hasMore={false}
      loadMore={vi.fn()}
      onVentaClick={onVentaClick}
    />,
  );
}

describe("FichaVentasList", () => {
  // ── liquidation signal ────────────────────────────────────────────────────

  it("renders 'Liquidada' badge when saldoVenta is 0", () => {
    const venta = makeFakeVentaCliente({ saldoVenta: "0.00" });
    renderList([venta]);
    expect(screen.getByLabelText("Liquidada")).toBeInTheDocument();
  });

  it("does not render 'Liquidada' when saldo > 0", () => {
    const venta = makeFakeVentaCliente({ saldoVenta: "5000.00" });
    renderList([venta]);
    expect(screen.queryByLabelText("Liquidada")).not.toBeInTheDocument();
  });

  it("renders 'debe' caption for owing ventas", () => {
    const venta = makeFakeVentaCliente({ saldoVenta: "6000.00" });
    renderList([venta]);
    expect(screen.getByText("debe")).toBeInTheDocument();
  });

  it("does not render 'debe' caption for liquidated ventas", () => {
    const venta = makeFakeVentaCliente({ saldoVenta: "0.00" });
    renderList([venta]);
    expect(screen.queryByText("debe")).not.toBeInTheDocument();
  });

  // ── second line: article + almacén ───────────────────────────────────────

  it("renders primerArticulo in the second line", () => {
    const venta = makeFakeVentaCliente({
      primerArticulo: "Recámara Ariel 5 Piezas",
      numArticulos: 1,
    });
    renderList([venta]);
    expect(screen.getByText("Recámara Ariel 5 Piezas")).toBeInTheDocument();
  });

  it("renders '+N más' tag when numArticulos > 1", () => {
    const venta = makeFakeVentaCliente({
      primerArticulo: "Colchón Restonic Ghana Matrimonial",
      numArticulos: 3,
    });
    renderList([venta]);
    expect(screen.getByText("+2 más")).toBeInTheDocument();
  });

  it("does not render '+N más' when numArticulos <= 1", () => {
    const venta = makeFakeVentaCliente({
      primerArticulo: "Sala Imperial 3-2-1",
      numArticulos: 1,
    });
    renderList([venta]);
    expect(screen.queryByText(/\+\d+ más/)).not.toBeInTheDocument();
  });

  it("does not render article part when primerArticulo is empty", () => {
    const venta = makeFakeVentaCliente({
      primerArticulo: "",
      numArticulos: 0,
    });
    renderList([venta]);
    // Article span absent; almacen should still show
    expect(screen.queryByText(/\+\d+ más/)).not.toBeInTheDocument();
  });

  it("renders almacen in the second line", () => {
    const venta = makeFakeVentaCliente({
      almacen: "Tienda de Exhibición",
    });
    renderList([venta]);
    expect(screen.getByText("Tienda de Exhibición")).toBeInTheDocument();
  });

  // ── hora next to fecha ────────────────────────────────────────────────────

  it("renders hora trimmed to HH:MM next to the date", () => {
    const venta = makeFakeVentaCliente({ hora: "17:48:00" });
    renderList([venta]);
    expect(screen.getByText("· 17:48")).toBeInTheDocument();
  });

  it("renders hora as-is when already HH:MM", () => {
    const venta = makeFakeVentaCliente({ hora: "09:05" });
    renderList([venta]);
    expect(screen.getByText("· 09:05")).toBeInTheDocument();
  });

  // ── row click ─────────────────────────────────────────────────────────────

  it("calls onVentaClick with doctoPvId when row is clicked", async () => {
    const user = userEvent.setup();
    const onVentaClick = vi.fn();
    const venta = makeFakeVentaCliente({ doctoPvId: 30015, saldoVenta: "3200.00" });
    renderList([venta], onVentaClick);
    // Click on the folio (inside the row)
    await user.click(screen.getByText("CV-00542"));
    expect(onVentaClick).toHaveBeenCalledWith(30015);
  });

  // ── empty / loading / error ───────────────────────────────────────────────

  it("renders empty state when no ventas", () => {
    renderList([]);
    expect(screen.getByText("Sin ventas registradas")).toBeInTheDocument();
  });
});
