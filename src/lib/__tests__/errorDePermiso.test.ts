import { describe, expect, it } from "vitest";
import { esErrorDePermiso, mensajeErrorFotos } from "../errorDePermiso";

describe("esErrorDePermiso", () => {
  it.each(["http_403", "permiso_denegado", "permission_denied", "forbidden"])("%s es de permiso", (code) => {
    expect(esErrorDePermiso({ code })).toBe(true);
    expect(mensajeErrorFotos({ code })).toBe("No tienes permiso para ver las fotos");
  });

  it.each(["http_500", "network_error", "timeout", "error_inesperado", "http_401"])("%s no es de permiso", (code) => {
    expect(esErrorDePermiso({ code })).toBe(false);
    expect(mensajeErrorFotos({ code })).toBe("No se pudieron cargar las fotos");
  });

  it("null no es de permiso", () => {
    expect(esErrorDePermiso(null)).toBe(false);
  });
});
