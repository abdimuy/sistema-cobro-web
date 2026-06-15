import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WinbackTable from "./WinbackTable";
import { makeFakeWinbackItem } from "../application/__tests__/fakeWinbackPort";
import { Segmento, EstadoPago, Tier } from "../domain/values";
import { DomainError } from "../domain/errors";

function mustCreate<T>(v: T | DomainError): T {
  if (v instanceof DomainError) {
    throw new Error(`VO.create failed: ${v.message}`);
  }
  return v;
}

const itemA = makeFakeWinbackItem({
  clienteId: 1,
  nombre: "MUEBLES GÓMEZ SA",
  zona: "NORTE",
  score: 90,
});

const itemB = makeFakeWinbackItem({
  clienteId: 2,
  nombre: "DISTRIBUIDORA TORRES",
  zona: "SUR",
  score: 60,
  segmento: mustCreate(Segmento.create("FRIO")),
  estadoPago: mustCreate(EstadoPago.create("ATRASADO")),
  tier: mustCreate(Tier.create("C")),
});

describe("WinbackTable", () => {
  describe("with items", () => {
    it("renders the nombre of each item", () => {
      render(
        <WinbackTable
          items={[itemA, itemB]}
          isLoading={false}
          onRowClick={vi.fn()}
        />,
      );

      expect(screen.getByText("MUEBLES GÓMEZ SA")).toBeInTheDocument();
      expect(screen.getByText("DISTRIBUIDORA TORRES")).toBeInTheDocument();
    });

    it("calls onRowClick with the correct item when a row is clicked", async () => {
      const onRowClick = vi.fn();
      render(
        <WinbackTable
          items={[itemA, itemB]}
          isLoading={false}
          onRowClick={onRowClick}
        />,
      );

      const row = screen.getByText("MUEBLES GÓMEZ SA").closest("tr");
      expect(row).toBeTruthy();
      await userEvent.click(row!);

      expect(onRowClick).toHaveBeenCalledTimes(1);
      expect(onRowClick).toHaveBeenCalledWith(itemA);
    });

    it("calls onRowClick with item B when its row is clicked", async () => {
      const onRowClick = vi.fn();
      render(
        <WinbackTable
          items={[itemA, itemB]}
          isLoading={false}
          onRowClick={onRowClick}
        />,
      );

      const row = screen.getByText("DISTRIBUIDORA TORRES").closest("tr");
      await userEvent.click(row!);

      expect(onRowClick).toHaveBeenCalledWith(itemB);
    });

    it("renders score values", () => {
      render(
        <WinbackTable
          items={[itemA, itemB]}
          isLoading={false}
          onRowClick={vi.fn()}
        />,
      );

      expect(screen.getByText("90")).toBeInTheDocument();
      expect(screen.getByText("60")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows skeleton elements and hides item nombres when isLoading=true", () => {
      render(
        <WinbackTable
          items={[itemA, itemB]}
          isLoading={true}
          onRowClick={vi.fn()}
        />,
      );

      const skeletons = screen.getAllByTestId("winback-skeleton");
      expect(skeletons.length).toBeGreaterThan(0);

      // Item names should not be rendered
      expect(screen.queryByText("MUEBLES GÓMEZ SA")).not.toBeInTheDocument();
      expect(screen.queryByText("DISTRIBUIDORA TORRES")).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows the Spanish empty-state message when items is empty and not loading", () => {
      render(
        <WinbackTable items={[]} isLoading={false} onRowClick={vi.fn()} />,
      );

      expect(screen.getByText("Sin clientes para mostrar")).toBeInTheDocument();
    });
  });

  describe("pagination footer", () => {
    it("renders Anterior and Siguiente buttons", () => {
      render(
        <WinbackTable
          items={[itemA, itemB]}
          isLoading={false}
          onRowClick={vi.fn()}
        />,
      );

      expect(screen.getByRole("button", { name: /anterior/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /siguiente/i })).toBeInTheDocument();
    });

    it("shows page indicator text", () => {
      render(
        <WinbackTable
          items={[itemA, itemB]}
          isLoading={false}
          onRowClick={vi.fn()}
        />,
      );

      expect(screen.getByText(/página 1 de/i)).toBeInTheDocument();
    });
  });
});
