import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { http, passthrough } from "msw";
import { server } from "../../../../test/msw/server";
import { DomainError } from "../../domain/errors";

// Firebase real no: sesión sin usuario (la petición sale sin token).
vi.mock("../../../../../firebase", () => ({
  auth: { authStateReady: () => Promise.resolve(), currentUser: null },
}));

import { apiClient, TIEMPO_LIMITE_MS } from "./apiClient";
import { HttpDesempenoAdapter } from "./HttpDesempenoAdapter";

describe("apiClient de desempeño: tiempo límite", () => {
  const original = { timeout: apiClient.defaults.timeout, baseURL: apiClient.defaults.baseURL };
  let colgado: Server;
  let base = "";
  beforeAll(async () => {
    colgado = createServer(() => {});
    await new Promise<void>((r) => colgado.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${(colgado.address() as AddressInfo).port}`;
  });
  afterAll(() => {
    colgado.closeAllConnections();
    colgado.close();
  });
  afterEach(() => {
    apiClient.defaults.timeout = original.timeout;
    apiClient.defaults.baseURL = original.baseURL;
  });

  it("una petición colgada se corta a los 45 s", () => {
    expect(TIEMPO_LIMITE_MS).toBe(45_000);
    expect(apiClient.defaults.timeout).toBe(45_000);
  });

  it("servidor que no responde: termina en un error con mensaje en español (y se puede reintentar)", async () => {
    // Servidor HTTP de verdad que acepta la conexión y nunca contesta. MSW la
    // deja pasar: así el límite lo aplica el XMLHttpRequest real, no un simulacro.
    server.use(http.all(`${base}/*`, () => passthrough()));
    apiClient.defaults.baseURL = `${base}/v2`;
    // Mismo cliente (interceptor y adapter reales) con el límite acortado para la prueba.
    apiClient.defaults.timeout = 200;
    const port = new HttpDesempenoAdapter(apiClient);
    const error = await port
      .obtenerTablero({ periodo: "hoy", pausaMin: 45, horario: null })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).code).toBe("timeout");
    expect((error as DomainError).message).toBe("el servidor tardó demasiado en responder");
  });
});
