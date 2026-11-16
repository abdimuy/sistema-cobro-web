import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useBandejaGarantias } from "../useGarantias";

const mocks = vi.hoisted(() => ({
  listar: vi.fn(),
}));

vi.mock("../../composition/crearGarantiasPort", () => ({
  crearGarantiasPort: () => ({
    listar: mocks.listar,
  }),
}));

describe("useBandejaGarantias - actualización", () => {
  beforeEach(() => {
    mocks.listar.mockReset();
    mocks.listar.mockResolvedValue({
      items: [],
      has_more: false,
      next_cursor: null,
    });
  });

  it("vuelve a consultar al cambiar la revisión", async () => {
    const filtros = { estado: "en_proceso" };

    const { rerender } = renderHook(
      ({ revision }) =>
        useBandejaGarantias(filtros, "cursor-prueba", revision),
      {
        initialProps: { revision: 0 },
      },
    );

    await waitFor(() => {
      expect(mocks.listar).toHaveBeenCalledTimes(1);
    });

    const primera = mocks.listar.mock.calls[0];

    rerender({ revision: 1 });

    await waitFor(() => {
      expect(mocks.listar).toHaveBeenCalledTimes(2);
    });

    const segunda = mocks.listar.mock.calls[1];

    expect(segunda[0]).toEqual(primera[0]);
    expect(segunda[1]).toEqual(primera[1]);
    expect(segunda[1]).toEqual({
      limit: 20,
      cursor: "cursor-prueba",
    });

    expect(primera[2].aborted).toBe(true);
  });
});
