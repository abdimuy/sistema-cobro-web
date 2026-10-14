import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useCargaRemota } from "../useCargaRemota";
import { DomainError } from "../../../../domain/errors";

type Cargar = ((s: AbortSignal) => Promise<string>) | null;

function diferida() {
  let resolver: (v: string) => void = () => {};
  let rechazar: (e: unknown) => void = () => {};
  const promesa = new Promise<string>((res, rej) => {
    resolver = res;
    rechazar = rej;
  });
  return { promesa, resolver, rechazar };
}

describe("useCargaRemota", () => {
  it("carga y expone los datos", async () => {
    const cargar: Cargar = async () => "hoy";
    const { result } = renderHook(() => useCargaRemota(cargar));
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.datos).toBe("hoy"));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("con cargar=null no hace nada", () => {
    const { result } = renderHook(() => useCargaRemota<string>(null));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.datos).toBeNull();
  });

  it("una recarga fallida CONSERVA los datos y expone el error", async () => {
    let llamada = 0;
    const cargar: Cargar = async () => {
      llamada++;
      if (llamada === 2) throw new DomainError("network_error", "error de red");
      return "datos de las 16:40";
    };
    const { result } = renderHook(() => useCargaRemota(cargar));
    await waitFor(() => expect(result.current.datos).toBe("datos de las 16:40"));

    act(() => result.current.refresh());

    await waitFor(() => expect(result.current.error?.code).toBe("network_error"));
    expect(result.current.datos).toBe("datos de las 16:40");
  });

  it("una consulta NUEVA borra los datos anteriores (no se pinta 'semana' con datos de 'hoy')", async () => {
    const semana = diferida();
    const porHoy: Cargar = async () => "datos de hoy";
    const porSemana: Cargar = () => semana.promesa;
    const { result, rerender } = renderHook(({ c }: { c: Cargar }) => useCargaRemota(c), {
      initialProps: { c: porHoy },
    });
    await waitFor(() => expect(result.current.datos).toBe("datos de hoy"));

    rerender({ c: porSemana });

    expect(result.current.datos).toBeNull();
    expect(result.current.isLoading).toBe(true);
    await act(async () => semana.resolver("datos de semana"));
    expect(result.current.datos).toBe("datos de semana");
  });

  it("la respuesta tardía de una consulta vieja no pisa a la nueva", async () => {
    const vieja = diferida();
    const cargarVieja: Cargar = () => vieja.promesa;
    const cargarNueva: Cargar = async () => "nueva";
    const { result, rerender } = renderHook(({ c }: { c: Cargar }) => useCargaRemota(c), {
      initialProps: { c: cargarVieja },
    });
    rerender({ c: cargarNueva });
    await waitFor(() => expect(result.current.datos).toBe("nueva"));

    await act(async () => vieja.resolver("vieja"));

    expect(result.current.datos).toBe("nueva");
  });

  it("refresh con una petición en curso no la aborta ni lanza otra", async () => {
    const lenta = diferida();
    let llamadas = 0;
    let abortada = false;
    const cargar: Cargar = (signal) => {
      llamadas++;
      signal.addEventListener("abort", () => {
        abortada = true;
      });
      return lenta.promesa;
    };
    const { result } = renderHook(() => useCargaRemota(cargar));

    act(() => result.current.refresh());
    act(() => result.current.refresh());

    expect(llamadas).toBe(1);
    expect(abortada).toBe(false);
    await act(async () => lenta.resolver("por fin"));
    expect(result.current.datos).toBe("por fin");

    act(() => result.current.refresh());
    expect(llamadas).toBe(2);
  });

  it("el error de una recarga se conserva mientras se reintenta (sin parpadeo)", async () => {
    let llamada = 0;
    const reintento = diferida();
    const cargar: Cargar = () => {
      llamada++;
      if (llamada === 1) return Promise.resolve("datos de las 16:40");
      if (llamada === 2) return Promise.reject(new DomainError("network_error", "error de red"));
      return reintento.promesa;
    };
    const { result } = renderHook(() => useCargaRemota(cargar));
    await waitFor(() => expect(result.current.datos).toBe("datos de las 16:40"));
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.error?.code).toBe("network_error"));

    act(() => result.current.refresh());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error?.code).toBe("network_error");
    await act(async () => reintento.resolver("datos de las 16:41"));
    expect(result.current.error).toBeNull();
    expect(result.current.datos).toBe("datos de las 16:41");
  });
});
