import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GestionArticulosForm } from "../GestionArticulosForm";

const mocks = vi.hoisted(() => ({
  agregarArticulo: vi.fn(),
  avanzarArticulo: vi.fn(),
  crearIdentidad: vi.fn(),
}));

vi.mock("../../presentation/composition/crearGarantiasPort", () => ({
  crearGarantiasPort: () => ({
    agregarArticulo: mocks.agregarArticulo,
    avanzarArticulo: mocks.avanzarArticulo,
  }),
}));

vi.mock("../../domain/comandos", () => ({
  nuevaIdentidadComando: mocks.crearIdentidad,
}));

const identidad = {
  claveIdempotencia: "11111111-1111-4111-8111-111111111111",
  deviceCreatedAt: "2026-11-14T15:00:00.000Z",
};

const articulo = {
  id: "articulo-1",
  clave: "PISO-001",
  etapa: "en_taller",
};

const transiciones = [{
  origen: "piso",
  etapa: "en_taller",
  siguientes: ["reparado_taller"],
}];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.crearIdentidad.mockReturnValue(identidad);
  mocks.agregarArticulo.mockResolvedValue({ ok: true });
  mocks.avanzarArticulo.mockResolvedValue({ ok: true });
});

describe("GestionArticulosForm", () => {
  it("no muestra operaciones sin permisos", () => {
    render(
      <GestionArticulosForm
        garantiaId="garantia-1"
        origen="piso"
        estado="abierto"
        articulos={[]}
        transiciones={transiciones}
        permisos={[]}
        onSuccess={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("region", { name: "Gestión de artículos" }),
    ).not.toBeInTheDocument();
  });

  it("agrega un artículo después de confirmar", async () => {
    const onSuccess = vi.fn();

    render(
      <GestionArticulosForm
        garantiaId="garantia-1"
        origen="piso"
        estado="abierto"
        articulos={[]}
        transiciones={transiciones}
        permisos={["garantias:crear"]}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.change(screen.getByLabelText("Clave del artículo"), {
      target: { value: "PISO-002" },
    });

    fireEvent.change(screen.getByLabelText("Descripción"), {
      target: { value: "Silla de prueba" },
    });

    fireEvent.click(screen.getByRole("button", {
      name: "Preparar artículo",
    }));

    expect(mocks.agregarArticulo).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", {
      name: "Confirmar",
    }));

    await waitFor(() => {
      expect(mocks.agregarArticulo).toHaveBeenCalledWith(
        "garantia-1",
        {
          clave: "PISO-002",
          description: "Silla de prueba",
        },
        identidad,
      );
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it("permite avanzar sólo a la siguiente etapa válida", async () => {
    const onSuccess = vi.fn();

    render(
      <GestionArticulosForm
        garantiaId="garantia-1"
        origen="piso"
        estado="en_proceso"
        articulos={[articulo]}
        transiciones={transiciones}
        permisos={["garantias:actualizar"]}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.change(screen.getByLabelText("Artículo"), {
      target: { value: "articulo-1" },
    });

    fireEvent.click(screen.getByRole("button", {
      name: "Preparar avance",
    }));

    expect(mocks.avanzarArticulo).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Siguiente etapa"), {
      target: { value: "reparado_taller" },
    });

    fireEvent.click(screen.getByRole("button", {
      name: "Preparar avance",
    }));

    fireEvent.click(screen.getByRole("button", {
      name: "Confirmar",
    }));

    await waitFor(() => {
      expect(mocks.avanzarArticulo).toHaveBeenCalledWith(
        "garantia-1",
        "articulo-1",
        { etapa_destino: "reparado_taller" },
        identidad,
      );
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it("reintenta con la misma clave de idempotencia", async () => {
    mocks.agregarArticulo
      .mockRejectedValueOnce(new Error("fallo temporal"))
      .mockResolvedValueOnce({ ok: true });

    render(
      <GestionArticulosForm
        garantiaId="garantia-1"
        origen="piso"
        estado="abierto"
        articulos={[]}
        transiciones={transiciones}
        permisos={["garantias:crear"]}
        onSuccess={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Clave del artículo"), {
      target: { value: "PISO-003" },
    });

    fireEvent.click(screen.getByRole("button", {
      name: "Preparar artículo",
    }));

    fireEvent.click(screen.getByRole("button", {
      name: "Confirmar",
    }));

    expect(await screen.findByText("fallo temporal")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", {
      name: "Reintentar",
    }));

    await waitFor(() => {
      expect(mocks.agregarArticulo).toHaveBeenCalledTimes(2);
    });

    expect(mocks.agregarArticulo.mock.calls[0]).toEqual(
      mocks.agregarArticulo.mock.calls[1],
    );

    expect(mocks.crearIdentidad).toHaveBeenCalledOnce();
  });
});
