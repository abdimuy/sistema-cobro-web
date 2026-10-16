// Todos los mappers de error del escritorio sacan el código con codigoDeError:
// el cuerpo real de Huma (code= en errors[]) y el de chi (code de primer nivel)
// deben dar el mismo código en cada módulo.
import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { CUERPO_422_ZONA } from "./cuerposVentas422";
import { apperrorToDomainError as bandeja } from "@/modules/bandeja/infrastructure/mappers/errorMapper";
import { apperrorToDomainError as cartera } from "@/modules/cartera/infrastructure/mappers/errorMapper";
import { apperrorToDomainError as clientes } from "@/modules/clientes/infrastructure/mappers/errorMapper";
import { apperrorToDomainError as configuracion } from "@/modules/configuracion/infrastructure/mappers/errorMapper";
import { apperrorToDomainError as desempeno } from "@/modules/desempeno/infrastructure/mappers/errorMapper";
import { apperrorToDomainError as failedIntents } from "@/modules/failedIntents/infrastructure/mappers/apperrorToDomainError";
import { apperrorToDomainError as rutas } from "@/modules/rutas/infrastructure/mappers/errorMapper";
import { apperrorToDomainError as user } from "@/modules/user/infrastructure/mappers/errorMapper";
import { apperrorToDomainError as usuariosRoles } from "@/modules/usuariosRoles/infrastructure/mappers/errorMapper";
import { mapAxiosError as ventasLocales } from "@/modules/ventasLocales/infrastructure/mappers/errorMapper";
import { apperrorToDomainError as winback } from "@/modules/winback/infrastructure/mappers/errorMapper";

function con(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response: AxiosResponse = { status, statusText: "", data, headers: {}, config };
  return new AxiosError(`Request failed with status code ${status}`, "ERR_BAD_REQUEST", config, {}, response);
}

const MAPPERS: Array<[string, (e: unknown) => { code: string }]> = [
  ["bandeja", bandeja],
  ["cartera", cartera],
  ["clientes", clientes],
  ["configuracion", configuracion],
  ["desempeno", desempeno],
  ["failedIntents", failedIntents],
  ["rutas", rutas],
  ["user", user],
  ["usuariosRoles", usuariosRoles],
  ["ventasLocales", ventasLocales],
  ["winback", winback],
];

describe.each(MAPPERS)("mapper de %s", (_m, mapear) => {
  it("cuerpo de Huma: code= en errors[]", () => {
    expect(mapear(con(422, CUERPO_422_ZONA)).code).toBe("venta_zona_no_coincide_cliente");
  });

  it("cuerpo de chi: code de primer nivel", () => {
    expect(mapear(con(403, { title: "Forbidden", status: 403, code: "permission_denied" })).code).toBe(
      "permission_denied",
    );
  });

  it("sin código: http_<status>", () => {
    expect(mapear(con(502, "<html>bad gateway</html>")).code).toBe("http_502");
  });
});
