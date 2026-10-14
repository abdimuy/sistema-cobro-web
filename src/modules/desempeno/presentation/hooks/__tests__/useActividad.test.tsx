import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useActividad, useCatalogos } from "../useActividad";
import { DesempenoProvider } from "../../context/DesempenoProvider";
import {
  FakeDesempenoPort,
  makeActividadPago,
  makePaginaActividad,
} from "../../../application/__tests__/fakeDesempenoPort";
import { FILTROS_ACTIVIDAD_INICIALES, type FiltrosActividad } from "../../../domain/entities";
import { DomainError } from "../../../domain/errors";

function envolver(port: FakeDesempenoPort) {
  return ({ children }: { children: ReactNode }) => (
    <DesempenoProvider port={port}>{children}</DesempenoProvider>
  );
}

describe("useActividad", () => {
  it("pide la primera página (cursor nulo, 100 por página) y guarda los totales del filtro", async () => {
    const port = new FakeDesempenoPort();
    const { result } = renderHook(() => useActividad("uid-juan", FILTROS_ACTIVIDAD_INICIALES), {
      wrapper: envolver(port),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(port.actividadCalls[0].pagina).toEqual({ cursor: null, limit: 100 });
    expect(result.current.items).toHaveLength(5);
    expect(result.current.totales?.n).toBe(5);
    expect(result.current.hayMas).toBe(false);
  });

  it("cargarMas sigue el cursor del servidor y agrega al final sin tocar los totales", async () => {
    const port = new FakeDesempenoPort();
    const extra = makeActividadPago({ id: "pago:15080001", hora: "2026-10-13T20:00:00Z" });
    port.actividadResponse = (pagina) =>
      pagina.cursor === null
        ? makePaginaActividad({ siguienteCursor: "c2" })
        : makePaginaActividad({
            items: [extra],
            siguienteCursor: null,
            totales: { n: 999, importe: "0.00", porTipo: { pago: 0, visita: 0, condonacion: 0 } },
          });
    const { result } = renderHook(() => useActividad("uid-juan", FILTROS_ACTIVIDAD_INICIALES), {
      wrapper: envolver(port),
    });
    await waitFor(() => expect(result.current.hayMas).toBe(true));

    act(() => result.current.cargarMas());

    await waitFor(() => expect(result.current.items).toHaveLength(6));
    expect(port.actividadCalls[1].pagina).toEqual({ cursor: "c2", limit: 100 });
    expect(result.current.items[5].id).toBe("pago:15080001");
    expect(result.current.totales?.n).toBe(5);
    expect(result.current.hayMas).toBe(false);
  });

  it("filtros nuevos reinician la lista y una página vieja no se mezcla", async () => {
    const port = new FakeDesempenoPort();
    let liberarVieja: () => void = () => {};
    port.actividadResponse = () =>
      new Promise((res) => {
        liberarVieja = () => res(makePaginaActividad());
      });
    const { result, rerender } = renderHook(
      ({ f }: { f: FiltrosActividad }) => useActividad("uid-juan", f),
      { wrapper: envolver(port), initialProps: { f: FILTROS_ACTIVIDAD_INICIALES } },
    );
    port.actividadResponse = makePaginaActividad({ items: [makeActividadPago()] });
    rerender({ f: { ...FILTROS_ACTIVIDAD_INICIALES, tipos: ["pago"] } });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => liberarVieja());

    expect(result.current.items).toHaveLength(1);
  });

  it("una página de 'cargar más' que llega después de cambiar los filtros no se mezcla", async () => {
    const port = new FakeDesempenoPort();
    let liberarMas: () => void = () => {};
    port.actividadResponse = (pagina) =>
      pagina.cursor === null
        ? makePaginaActividad({ siguienteCursor: "c2" })
        : new Promise((res) => {
            liberarMas = () =>
              res(makePaginaActividad({ items: [makeActividadPago({ id: "pago:vieja" })] }));
          });
    const { result, rerender } = renderHook(
      ({ f }: { f: FiltrosActividad }) => useActividad("uid-juan", f),
      { wrapper: envolver(port), initialProps: { f: FILTROS_ACTIVIDAD_INICIALES } },
    );
    await waitFor(() => expect(result.current.hayMas).toBe(true));
    act(() => result.current.cargarMas());

    port.actividadResponse = makePaginaActividad({ items: [makeActividadPago()] });
    rerender({ f: { ...FILTROS_ACTIVIDAD_INICIALES, tipos: ["pago"] } });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => liberarMas());

    expect(result.current.items.map((a) => a.id)).toEqual(["pago:15082369"]);
    expect(result.current.isLoadingMas).toBe(false);
  });

  it("dos clics seguidos en 'cargar más' piden la página una sola vez", async () => {
    const port = new FakeDesempenoPort();
    port.actividadResponse = (pagina) =>
      pagina.cursor === null
        ? makePaginaActividad({ siguienteCursor: "c2" })
        : makePaginaActividad({ items: [makeActividadPago({ id: "pago:2" })] });
    const { result } = renderHook(() => useActividad("uid-juan", FILTROS_ACTIVIDAD_INICIALES), {
      wrapper: envolver(port),
    });
    await waitFor(() => expect(result.current.hayMas).toBe(true));
    act(() => {
      result.current.cargarMas();
      result.current.cargarMas();
    });
    await waitFor(() => expect(result.current.items).toHaveLength(6));
    expect(port.actividadCalls.filter((c) => c.pagina.cursor === "c2")).toHaveLength(1);
  });

  it("expone el error del servidor", async () => {
    const port = new FakeDesempenoPort();
    port.throwOnNext.listarActividad = new DomainError(
      "desempeno_parametro_invalido",
      "el rango máximo es de 92 días",
    );
    const { result } = renderHook(() => useActividad("uid-juan", FILTROS_ACTIVIDAD_INICIALES), {
      wrapper: envolver(port),
    });
    await waitFor(() => expect(result.current.error?.message).toBe("el rango máximo es de 92 días"));
  });
});

describe("useCatalogos", () => {
  it("pide los catálogos de filtros una vez", async () => {
    const port = new FakeDesempenoPort();
    const { result } = renderHook(() => useCatalogos(), { wrapper: envolver(port) });
    await waitFor(() => expect(result.current.catalogos).not.toBeNull());
    expect(result.current.catalogos?.tiposVisita).toHaveLength(5);
    expect(port.catalogosCalls).toBe(1);
  });

  it("si fallan, avisa con el error y no inventa valores", async () => {
    const port = new FakeDesempenoPort();
    port.throwOnNext.obtenerCatalogos = new DomainError(
      "desempeno_firestore_unavailable",
      "no se pudieron leer los catálogos",
    );
    const { result } = renderHook(() => useCatalogos(), { wrapper: envolver(port) });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.catalogos).toBeNull();
  });
});
