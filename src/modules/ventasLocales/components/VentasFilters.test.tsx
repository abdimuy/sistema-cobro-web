import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { VentasFilters } from "./VentasFilters";
import type { VentasParams } from "@/services/api/getVentasLocales";

const ZONAS = [
  { ZONA_CLIENTE_ID: 1, ZONA_CLIENTE: "ZONA NORTE" },
  { ZONA_CLIENTE_ID: 2, ZONA_CLIENTE: "ZONA SUR" },
];

const VENDEDORES = [
  {
    VENDEDOR_EMAIL: "ricardo.villalobos@muebleriamsp.mx",
    NOMBRE_VENDEDOR: "Ricardo Villalobos",
  },
];

function renderFilters(params: VentasParams = {}) {
  const onParamsChange = vi.fn();
  render(
    <VentasFilters
      params={params}
      onParamsChange={onParamsChange}
      zonas={ZONAS}
      vendedores={VENDEDORES}
    />
  );
  return { onParamsChange };
}

async function abrirFiltros() {
  await userEvent.click(screen.getByRole("button", { name: /filtros/i }));
}

describe("VentasFilters — sin filtro de almacén", () => {
  it("no ofrece almacén entre los filtros avanzados", async () => {
    renderFilters();
    await abrirFiltros();

    expect(screen.getByText("Filtros avanzados")).toBeInTheDocument();
    expect(screen.queryByText("Almacén")).not.toBeInTheDocument();
    expect(screen.queryByText(/todos los almacenes/i)).not.toBeInTheDocument();
  });

  it("conserva los demás filtros", async () => {
    renderFilters();
    await abrirFiltros();

    expect(screen.getByText("Tipo de venta")).toBeInTheDocument();
    expect(screen.getByText("Situación")).toBeInTheDocument();
    expect(screen.getByText("Sincronización")).toBeInTheDocument();
    expect(screen.getByText("Zona")).toBeInTheDocument();
    expect(screen.getByText("Vendedor")).toBeInTheDocument();
    expect(screen.getByText("Rango de precio")).toBeInTheDocument();
  });

  it("no cuenta almacenId como filtro activo", () => {
    renderFilters({ almacenId: 19 });

    expect(
      screen.queryByRole("button", { name: /limpiar filtros/i })
    ).not.toBeInTheDocument();
  });

  it("sí cuenta un filtro que el API sí aplica", () => {
    renderFilters({ zonaClienteId: 1 });

    expect(
      screen.getByRole("button", { name: /limpiar filtros/i })
    ).toBeInTheDocument();
  });

  it("limpiar filtros no manda almacenId", async () => {
    const { onParamsChange } = renderFilters({ zonaClienteId: 1 });

    await userEvent.click(
      screen.getByRole("button", { name: /limpiar filtros/i })
    );

    expect(onParamsChange).toHaveBeenCalledTimes(1);
    expect(onParamsChange.mock.calls[0][0]).not.toHaveProperty("almacenId");
  });
});
