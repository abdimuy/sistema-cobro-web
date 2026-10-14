import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registrar = vi.fn();
vi.mock("@/lib/bitacora", () => ({
  registrar: (...args: unknown[]) => registrar(...args),
}));

import { forzarRepintado, instalarRespaldoDeRepintado } from "../repintado";

function fijarVisibilidad(estado: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => estado,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("instalarRespaldoDeRepintado", () => {
  let reloj = 0;
  const ahora = () => reloj;
  let repintar: ReturnType<typeof vi.fn>;
  let desinstalar: () => void;

  beforeEach(() => {
    reloj = 1_000_000;
    registrar.mockReset();
    repintar = vi.fn();
    desinstalar = instalarRespaldoDeRepintado({ ausenciaMinimaMs: 60_000, ahora, repintar });
  });
  afterEach(() => {
    desinstalar();
    fijarVisibilidad("visible");
  });

  it("repinta al volver a ser visible tras una ausencia larga, y lo registra", () => {
    fijarVisibilidad("hidden");
    reloj += 5 * 60_000;
    fijarVisibilidad("visible");
    expect(repintar).toHaveBeenCalledTimes(1);
    expect(registrar).toHaveBeenCalledWith("info", expect.stringContaining("repintado"));
  });

  it("no repinta tras una ausencia corta", () => {
    fijarVisibilidad("hidden");
    reloj += 10_000;
    fijarVisibilidad("visible");
    expect(repintar).not.toHaveBeenCalled();
  });

  it("también cuenta la ausencia por pérdida de foco de la ventana", () => {
    window.dispatchEvent(new Event("blur"));
    reloj += 2 * 60_000;
    window.dispatchEvent(new Event("focus"));
    expect(repintar).toHaveBeenCalledTimes(1);
  });

  it("repinta una sola vez aunque lleguen visibilidad y foco juntos", () => {
    window.dispatchEvent(new Event("blur"));
    fijarVisibilidad("hidden");
    reloj += 2 * 60_000;
    fijarVisibilidad("visible");
    window.dispatchEvent(new Event("focus"));
    expect(repintar).toHaveBeenCalledTimes(1);
  });

  it("al desinstalar deja de escuchar", () => {
    desinstalar();
    fijarVisibilidad("hidden");
    reloj += 10 * 60_000;
    fijarVisibilidad("visible");
    expect(repintar).not.toHaveBeenCalled();
  });
});

describe("aviso nativo de despertar", () => {
  it("repinta en cuanto el lado nativo avisa, sin esperar ausencia, y deja de escuchar al desinstalar", () => {
    let avisar: (motivo: string) => void = () => {};
    const dejarDeEscuchar = vi.fn();
    const repintar = vi.fn();
    const desinstalar = instalarRespaldoDeRepintado({
      repintar,
      escucharNativo: (cb) => {
        avisar = cb;
        return dejarDeEscuchar;
      },
    });

    avisar("despertar");
    expect(repintar).toHaveBeenCalledTimes(1);
    expect(registrar).toHaveBeenCalledWith("info", expect.stringContaining("despertar"));

    desinstalar();
    expect(dejarDeEscuchar).toHaveBeenCalledTimes(1);
  });
});

describe("forzarRepintado", () => {
  it("cambia la opacidad de la raíz un cuadro y la restaura", () => {
    const cuadros: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cuadros.push(cb);
      return cuadros.length;
    });
    const raiz = document.documentElement;
    raiz.style.opacity = "";

    forzarRepintado();
    expect(raiz.style.opacity).toBe("0.999");

    while (cuadros.length) cuadros.shift()!(0);
    expect(raiz.style.opacity).toBe("");
    vi.restoreAllMocks();
  });
});
