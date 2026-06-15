import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WinbackDetailDrawer from "./WinbackDetailDrawer";
import { makeFakeWinbackItem } from "../application/__tests__/fakeWinbackPort";
import { formatMoney } from "./lib/format";

const fakeItem = makeFakeWinbackItem({
  nombre: "MUEBLES HERNANDEZ SA",
  resumen: "Cliente de alto valor sin compras recientes",
  monetary: "25000.00",
  telefono: "5512345678",
});

describe("WinbackDetailDrawer", () => {
  it("renders the client nombre when item is provided", () => {
    render(
      <WinbackDetailDrawer item={fakeItem} onOpenChange={vi.fn()} />,
    );
    expect(screen.getByText("MUEBLES HERNANDEZ SA")).toBeInTheDocument();
  });

  it("renders the resumen text", () => {
    render(
      <WinbackDetailDrawer item={fakeItem} onOpenChange={vi.fn()} />,
    );
    expect(
      screen.getByText("Cliente de alto valor sin compras recientes"),
    ).toBeInTheDocument();
  });

  it("renders the formatted monetary stat", () => {
    render(
      <WinbackDetailDrawer item={fakeItem} onOpenChange={vi.fn()} />,
    );
    // formatMoney("25000.00") → "$25,000" in es-MX locale
    expect(screen.getByText(formatMoney(fakeItem.monetary))).toBeInTheDocument();
  });

  it("renders the Llamar link with the correct tel: href", () => {
    render(
      <WinbackDetailDrawer item={fakeItem} onOpenChange={vi.fn()} />,
    );
    const link = screen.getByRole("link", { name: /llamar/i });
    expect(link).toHaveAttribute("href", `tel:${fakeItem.telefono}`);
  });

  it("renders no content when item is null", () => {
    render(
      <WinbackDetailDrawer item={null} onOpenChange={vi.fn()} />,
    );
    expect(screen.queryByText("MUEBLES HERNANDEZ SA")).not.toBeInTheDocument();
  });
});
