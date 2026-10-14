import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invoke(...args),
}));

import { registrar } from "../bitacora";

describe("bitacora.registrar", () => {
  beforeEach(() => {
    invoke.mockReset();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("manda el mensaje al comando nativo para que quede en el archivo de log", () => {
    invoke.mockResolvedValue(undefined);
    registrar("info", "ventana repintada");
    expect(invoke).toHaveBeenCalledWith("registrar_frontend", {
      nivel: "info",
      mensaje: "ventana repintada",
    });
  });

  it("no lanza si no hay backend de Tauri (navegador o pruebas)", () => {
    invoke.mockImplementation(() => {
      throw new Error("window.__TAURI_INTERNALS__ undefined");
    });
    expect(() => registrar("error", "x")).not.toThrow();
  });

  it("no deja una promesa rechazada sin atender si el comando falla", async () => {
    invoke.mockRejectedValue(new Error("sin backend"));
    registrar("warn", "x");
    // Si la promesa quedara sin catch, vitest reportaría unhandled rejection.
    await new Promise((r) => setTimeout(r, 0));
    expect(invoke).toHaveBeenCalled();
  });
});
