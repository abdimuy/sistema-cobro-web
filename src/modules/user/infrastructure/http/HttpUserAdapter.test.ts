import { describe, expect, it } from "vitest";
import axios from "axios";

import { server } from "../../../../test/msw/server";
import { userHandlers } from "../../../../test/msw/handlers/user";

import { HttpUserAdapter } from "./HttpUserAdapter";
import { DomainError } from "../../domain/errors";

const TEST_BASE_URL = "http://api.test/v2";

function makeAdapter() {
  const client = axios.create({ baseURL: TEST_BASE_URL });
  return new HttpUserAdapter(client);
}

const INPUT = {
  firebaseUid: "fbuid-brenda",
  email: "brenda.sanchez@muebleriamsp.mx",
  nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
};

describe("HttpUserAdapter.crearUsuario", () => {
  it("POSTea el cuerpo exacto (con teléfono) y mapea el 201 al objeto de dominio", async () => {
    let seenBody: unknown = null;
    server.use(
      ...userHandlers({
        crearUsuario: {
          assertCall: (body) => {
            seenBody = body;
          },
          response: {
            id: "usr-brenda",
            firebase_uid: "fbuid-brenda",
            email: "brenda.sanchez@muebleriamsp.mx",
            nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
            telefono: "4431122334",
            almacen_id: 11058,
            activo: true,
            created_at: "2026-08-27T12:00:00Z",
            updated_at: "2026-08-27T12:00:00Z",
          },
        },
      }),
    );

    const usuario = await makeAdapter().crearUsuario({
      ...INPUT,
      telefono: "4431122334",
    });

    expect(seenBody).toEqual({
      firebase_uid: "fbuid-brenda",
      email: "brenda.sanchez@muebleriamsp.mx",
      nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
      telefono: "4431122334",
    });
    expect(usuario).toEqual({
      id: "usr-brenda",
      firebaseUid: "fbuid-brenda",
      email: "brenda.sanchez@muebleriamsp.mx",
      nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
      telefono: "4431122334",
      almacenId: 11058,
      activo: true,
    });
  });

  it("omite la clave `telefono` del cuerpo cuando el formulario la dejó vacía", async () => {
    let seenBody: Record<string, unknown> = {};
    server.use(
      ...userHandlers({
        crearUsuario: {
          assertCall: (body) => {
            seenBody = body as Record<string, unknown>;
          },
        },
      }),
    );

    const usuario = await makeAdapter().crearUsuario({ ...INPUT, telefono: "" });

    expect(seenBody).toEqual({
      firebase_uid: "fbuid-brenda",
      email: "brenda.sanchez@muebleriamsp.mx",
      nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
    });
    expect(Object.keys(seenBody)).not.toContain("telefono");
    expect(usuario.telefono).toBeNull();
  });

  it("omite también un teléfono que sólo trae espacios", async () => {
    let seenBody: Record<string, unknown> = {};
    server.use(
      ...userHandlers({
        crearUsuario: {
          assertCall: (body) => {
            seenBody = body as Record<string, unknown>;
          },
        },
      }),
    );

    await makeAdapter().crearUsuario({ ...INPUT, telefono: "   " });

    expect(Object.keys(seenBody)).not.toContain("telefono");
  });

  // ---------------------------------------------------------------------
  // Cuerpos de error REALES.
  //
  // POST /v2/usuarios vive en chi (internal/auth/infra/authhttp/routes.go:58)
  // y responde por internal/platform/response: un Problem Details de RFC 9457
  // PLANO. Los cuerpos de abajo están copiados de la forma que emite
  // response.go:96-105 y response.go:117-126, con los códigos verificados en
  // internal/auth/{domain/errors.go, infra/authhttp/{authn,authz}.go}.
  //
  // Importa que sean los REALES: un cuerpo inventado hace pasar la prueba con
  // el traductor roto, y el fallo se ve en producción como un mensaje
  // genérico — que es el modo de fallo más caro de diagnosticar.
  // ---------------------------------------------------------------------

  it("409 real (usuario_ya_existe) → mensaje de correo duplicado", async () => {
    server.use(
      ...userHandlers({
        crearUsuario: {
          error: {
            status: 409,
            body: {
              type: "about:blank",
              title: "Conflict",
              status: 409,
              detail: "el usuario ya existe",
              instance: "/v2/usuarios",
              code: "usuario_ya_existe",
              request_id: "req-1",
            },
          },
        },
      }),
    );

    await expect(makeAdapter().crearUsuario(INPUT)).rejects.toMatchObject({
      name: "DomainError",
      code: "usuario_ya_existe",
      message: "ya existe un usuario con ese correo",
    });
  });

  // El caso del ancho de columna: TELEFONO VARCHAR(30), validado con `max=30`
  // en authhttp/dto.go:25. El validador de struct corta ANTES del dominio, así
  // que el `code` de primer nivel es "validation_failed" y el motivo real sólo
  // existe dentro de `errors[]`. Si el traductor no lo lee, la operadora ve
  // "uno o más campos no son válidos" y no sabe qué corregir.
  it("422 real con telefono de más de 30 caracteres → dice que el teléfono es largo", async () => {
    server.use(
      ...userHandlers({
        crearUsuario: {
          error: {
            status: 422,
            body: {
              type: "about:blank",
              title: "Unprocessable Entity",
              status: 422,
              detail: "uno o más campos no son válidos",
              instance: "/v2/usuarios",
              code: "validation_failed",
              request_id: "req-2",
              errors: [
                {
                  field: "telefono",
                  code: "max",
                  message: '"telefono" no debe exceder 30 caracteres/elementos',
                },
              ],
            },
          },
        },
      }),
    );

    const err = await makeAdapter()
      .crearUsuario({ ...INPUT, telefono: "4".repeat(31) })
      .then(
        () => {
          throw new Error("se esperaba un rechazo");
        },
        (e: DomainError) => e,
      );

    expect(err).toBeInstanceOf(DomainError);
    expect(err.code).toBe("validation_failed");
    expect(err.message).toBe("el teléfono es demasiado largo");
    // Y sobre todo: NO es el genérico del backend.
    expect(err.message).not.toBe("uno o más campos no son válidos");
  });

  it("422 real con varios campos → los enumera todos", async () => {
    server.use(
      ...userHandlers({
        crearUsuario: {
          error: {
            status: 422,
            body: {
              type: "about:blank",
              title: "Unprocessable Entity",
              status: 422,
              detail: "uno o más campos no son válidos",
              code: "validation_failed",
              errors: [
                { field: "nombre", code: "required", message: "..." },
                { field: "email", code: "email", message: "..." },
              ],
            },
          },
        },
      }),
    );

    await expect(makeAdapter().crearUsuario(INPUT)).rejects.toMatchObject({
      code: "validation_failed",
      message: "falta el nombre; el correo no es válido",
    });
  });

  // 422 del dominio (internal/auth/app/usuarios.go:64-79): aquí el `detail`
  // del backend ya es buena copia en español, así que se deja pasar tal cual.
  it("422 real del dominio (nombre_invalid) → conserva el detail del backend", async () => {
    server.use(
      ...userHandlers({
        crearUsuario: {
          error: {
            status: 422,
            body: {
              type: "about:blank",
              title: "Unprocessable Entity",
              status: 422,
              detail: "el nombre contiene caracteres no permitidos",
              code: "nombre_invalid",
            },
          },
        },
      }),
    );

    await expect(makeAdapter().crearUsuario(INPUT)).rejects.toMatchObject({
      code: "nombre_invalid",
      message: "el nombre contiene caracteres no permitidos",
    });
  });

  // 401 — authn.go:114. El `detail` del backend ("encabezado authorization
  // ausente") no le dice nada a quien opera la pantalla; se reescribe.
  it("401 real (missing_authorization) → habla de la sesión, no del encabezado", async () => {
    server.use(
      ...userHandlers({
        crearUsuario: {
          error: {
            status: 401,
            body: {
              type: "about:blank",
              title: "Unauthorized",
              status: 401,
              detail: "encabezado authorization ausente",
              code: "missing_authorization",
            },
          },
        },
      }),
    );

    await expect(makeAdapter().crearUsuario(INPUT)).rejects.toMatchObject({
      code: "missing_authorization",
      message: "sesión expirada; vuelve a entrar",
    });
  });

  // 403 — authz.go:31-36, con el `fields.required_permission` que adjunta
  // WithField. Es el que sale cuando la operadora no tiene `usuarios:crear`.
  it("403 real del guard (permission_denied) → mensaje de permisos", async () => {
    server.use(
      ...userHandlers({
        crearUsuario: {
          error: {
            status: 403,
            body: {
              type: "about:blank",
              title: "Forbidden",
              status: 403,
              detail: "permiso denegado",
              code: "permission_denied",
              fields: { required_permission: "usuarios:crear" },
            },
          },
        },
      }),
    );

    await expect(makeAdapter().crearUsuario(INPUT)).rejects.toMatchObject({
      code: "permission_denied",
      message: "no tienes permisos para registrar usuarios",
    });
  });

  // Último recurso: algo que NO es el API contestó (proxy inverso, túnel, o el
  // 404/405 en texto plano de chi). Todo error del API trae `code`, así que
  // esta rama sólo la alcanza un intermediario.
  it("respuesta sin `code` (un proxy, no el API) → http_<status>", async () => {
    server.use(
      ...userHandlers({
        crearUsuario: { error: { status: 502, body: { title: "Bad Gateway" } } },
      }),
    );

    await expect(makeAdapter().crearUsuario(INPUT)).rejects.toMatchObject({
      name: "DomainError",
      code: "http_502",
      message: "Bad Gateway",
    });
  });

  it("traduce un fallo de red a DomainError(network_error)", async () => {
    server.use(...userHandlers({ crearUsuario: { networkError: true } }));

    await expect(makeAdapter().crearUsuario(INPUT)).rejects.toMatchObject({
      name: "DomainError",
      code: "network_error",
      message: "sin conexión con el servidor",
    });
  });

  it("rechaza una respuesta 201 malformada (sin id) como malformed_response", async () => {
    server.use(
      ...userHandlers({
        crearUsuario: {
          response: {
            firebase_uid: "fbuid-brenda",
            email: "brenda.sanchez@muebleriamsp.mx",
            nombre: "BRENDA GUADALUPE SÁNCHEZ RUIZ",
            activo: true,
            created_at: "2026-08-27T12:00:00Z",
            updated_at: "2026-08-27T12:00:00Z",
          } as never,
        },
      }),
    );

    await expect(makeAdapter().crearUsuario(INPUT)).rejects.toMatchObject({
      name: "DomainError",
      code: "malformed_response",
    });
  });
});
