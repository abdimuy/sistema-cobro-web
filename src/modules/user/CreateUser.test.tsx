import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderWithProviders, screen, waitFor } from "../../test/utils";
import { server } from "../../test/msw/server";
import { userHandlers } from "../../test/msw/handlers/user";
import {
  firebaseAuthSpies,
  firestoreSpies,
  makeFakeUserCredential,
  resetFirebaseMocks,
} from "../../test/firebaseMocks";

// `navigate` se espía para que el temporizador del final no arrastre la prueba
// a una navegación real después del unmount.
const { navigateSpy } = vi.hoisted(() => ({ navigateSpy: vi.fn() }));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigateSpy,
}));

// Primera vez que este repo mockea los SDK de Firebase. Se conserva el módulo
// real y sólo se sustituye lo que toca la red — ver src/test/firebaseMocks.ts.
vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  const { firebaseAuthModuleMock } = await import("../../test/firebaseMocks");
  return { ...actual, ...firebaseAuthModuleMock() };
});

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  const { firebaseFirestoreModuleMock } = await import("../../test/firebaseMocks");
  return { ...actual, ...firebaseFirestoreModuleMock() };
});

// Los dos catálogos del formulario salen por HTTP a otros endpoints; aquí sólo
// importa el alta, así que se sirven fijos.
vi.mock("./useGetRutas", () => ({
  default: () => ({
    rutas: [{ COBRADOR_ID: 7, COBRADOR: "RUTA 7 — MORELIA" }],
    error: "",
    isLoading: false,
  }),
}));

vi.mock("./useGetZonaCliente", () => ({
  default: () => ({
    zonasCliente: [{ ZONA_CLIENTE_ID: 12, ZONA_CLIENTE: "ZONA CENTRO" }],
    error: "",
    isLoading: false,
  }),
}));

import CreateUser from "./CreateUser";

const NOMBRE_REAL = "BRENDA GUADALUPE SÁNCHEZ RUIZ";
const CORREO = "brenda.sanchez@muebleriamsp.mx";
const UID_NUEVO = "fbuid-brenda-nueva";

// Cota superior del retraso del camino FELIZ. La prueba nunca fija 1500 ni
// 8000: afirma la RELACIÓN observable —el éxito navega antes de este punto y
// el fallo sigue en pantalla después—, que es el requisito de verdad. Antes
// esto se comprobaba espiando `setTimeout` y comparando los números exactos,
// que se rompe si alguien cambia la constante o si cualquier librería del
// árbol programa un temporizador con el mismo plazo.
const COTA_EXITO_MS = 2_000;
// Muy por encima de cualquier plazo razonable del camino de fallo.
const MUCHO_DESPUES_MS = 120_000;

function setup() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  renderWithProviders(<CreateUser />);
  return user;
}

async function llenarFormulario(
  user: ReturnType<typeof userEvent.setup>,
  telefono = "4431122334",
) {
  await user.type(screen.getByPlaceholderText("Nombre"), NOMBRE_REAL);
  await user.type(screen.getByPlaceholderText("Correo electrónico"), CORREO);
  await user.type(screen.getByPlaceholderText("Contraseña"), "unaClaveLarga1");
  if (telefono) {
    await user.type(screen.getByPlaceholderText("Teléfono"), telefono);
  }
  await user.click(screen.getByRole("button", { name: "Crear usuario" }));
}

beforeEach(() => {
  // `shouldAdvanceTime` deja correr el bucle de eventos (MSW y waitFor lo
  // necesitan) y a la vez permite saltar el reloj a voluntad.
  vi.useFakeTimers({ shouldAdvanceTime: true });
  resetFirebaseMocks();
  navigateSpy.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
  firebaseAuthSpies.createUserWithEmailAndPassword.mockResolvedValue(
    makeFakeUserCredential(UID_NUEVO, CORREO),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("CreateUser — el tercer paso del alta", () => {
  it("registra al usuario en el API con el uid de Firebase y el nombre real, y hace el signOut DESPUÉS", async () => {
    const orden: string[] = [];
    let seenBody: unknown = null;
    let seenAuth: string | null = null;

    server.use(
      ...userHandlers({
        crearUsuario: {
          assertCall: (body, headers) => {
            orden.push("api");
            seenBody = body;
            seenAuth = headers.get("authorization");
          },
        },
      }),
    );
    firebaseAuthSpies.signOut.mockImplementation(async () => {
      orden.push("signOut");
    });

    const user = setup();
    await llenarFormulario(user);

    await waitFor(() =>
      expect(screen.getByText("Usuario registrado exitosamente.")).toBeInTheDocument(),
    );

    expect(seenBody).toEqual({
      firebase_uid: UID_NUEVO,
      email: CORREO,
      nombre: NOMBRE_REAL,
      telefono: "4431122334",
    });
    // El token es SIEMPRE el del admin que opera la pantalla, no el del
    // usuario recién creado en la app secundaria.
    expect(seenAuth).toBe("Bearer token-del-admin");
    // El alta en el API va entre el setDoc y el signOut.
    expect(orden).toEqual(["api", "signOut"]);
    expect(firestoreSpies.setDoc).toHaveBeenCalledWith(
      { collection: "users", id: UID_NUEVO },
      expect.objectContaining({ NOMBRE: NOMBRE_REAL, EMAIL: CORREO }),
    );
    expect(screen.getByText("Usuario registrado exitosamente.")).toHaveClass(
      "text-green-500",
    );

    // Camino feliz: sale de la pantalla pronto.
    vi.advanceTimersByTime(COTA_EXITO_MS);
    expect(navigateSpy).toHaveBeenCalledWith("/settings");
  });

  it("si el API falla: avisa que el usuario SÍ se creó, cierra la sesión igual y no se va de la pantalla enseguida", async () => {
    server.use(...userHandlers({ crearUsuario: { networkError: true } }));

    const user = setup();
    await llenarFormulario(user);

    const mensaje = await screen.findByText(
      "Error: sin conexión con el servidor. El usuario sí se creó; falta registrarlo.",
    );
    expect(mensaje.textContent).toContain("Error");
    expect(mensaje.textContent).toContain("El usuario sí se creó");
    expect(mensaje.textContent).toContain("falta registrarlo");
    expect(mensaje).toHaveClass("text-red-500");

    // El alta no se considera fallida: Firebase y Firestore ya están escritos,
    // y la sesión del admin se restituye pase lo que pase en el API.
    expect(firestoreSpies.setDoc).toHaveBeenCalledTimes(1);
    expect(firebaseAuthSpies.signOut).toHaveBeenCalledTimes(1);

    // El mensaje se queda: pasado el plazo del camino feliz sigue sin navegar.
    vi.advanceTimersByTime(COTA_EXITO_MS);
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/El usuario sí se creó/)).toBeInTheDocument();

    // Y acaba yéndose: el aplazamiento no es un cuelgue.
    vi.advanceTimersByTime(MUCHO_DESPUES_MS);
    expect(navigateSpy).toHaveBeenCalledWith("/settings");
  });

  // El 409 ya NO es el caso del vendedor: cuando un cobrador nombra a alguien
  // vendedor desde el teléfono, el API crea la fila como VENDEDOR_ONLY y ahora
  // POST /v2/usuarios la promueve en sitio y contesta 201 — ese camino ni
  // siquiera llega a este mensaje.
  //
  // Lo que queda en el 409 son tres colisiones que NADIE resuelve al iniciar
  // sesión (fila desactivada, correo atado a otra cuenta de Firebase, o
  // firebase_uid ya en uso) y que el API no distingue: las tres llegan con
  // code "usuario_ya_existe". El texto se fija aquí por las dos mitades que
  // pueden romperse por separado: no debe mandar a capturar nada a mano (eso
  // es el genérico "falta registrarlo", y la fila ya existe), y no debe
  // prometer que la persona "queda lista al iniciar sesión" — lo prometía
  // antes y era falso.
  it("si el correo ya existía en el API (409): pide revisión manual y no promete nada automático", async () => {
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
            },
          },
        },
      }),
    );

    const user = setup();
    await llenarFormulario(user);

    const mensaje = await screen.findByText(
      "Error: el registro ya existe. El usuario sí se creó; requiere revisión manual.",
    );
    expect(mensaje).toHaveClass("text-red-500");
    expect(mensaje.textContent).toContain("Error");
    expect(mensaje.textContent).toContain("El usuario sí se creó");
    expect(mensaje.textContent).toContain("requiere revisión manual");
    // Lo que NO debe decir: que falta capturarlo en el sistema — ése es el
    // aviso genérico de cualquier otro fallo del API, y aquí la fila ya existe.
    expect(mensaje.textContent).not.toContain("falta registrarlo");
    // Ni que se arregla solo al entrar: ninguna de las tres causas del 409 se
    // resuelve en el login.
    expect(mensaje.textContent).not.toContain("iniciar sesión");

    expect(firebaseAuthSpies.signOut).toHaveBeenCalledTimes(1);
  });

  // El ancho de TELEFONO es VARCHAR(30) y authhttp/dto.go:25 lo valida con
  // `max=30`. El API contesta 422 con code "validation_failed" y el motivo
  // dentro de `errors[]`; sin leerlo, la operadora vería sólo el genérico
  // "uno o más campos no son válidos".
  it("un teléfono de más de 30 caracteres dice cuál campo está mal", async () => {
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

    const user = setup();
    await llenarFormulario(user, "4".repeat(31));

    const mensaje = await screen.findByText(/el teléfono es demasiado largo/);
    expect(mensaje).toHaveClass("text-red-500");
    expect(mensaje.textContent).toContain("El usuario sí se creó");
    expect(mensaje.textContent).not.toContain("uno o más campos no son válidos");
  });

  it("no llama al API cuando Firebase rechaza el correo por duplicado", async () => {
    let llamadasAlApi = 0;
    server.use(
      ...userHandlers({
        crearUsuario: {
          assertCall: () => {
            llamadasAlApi += 1;
          },
        },
      }),
    );
    firebaseAuthSpies.createUserWithEmailAndPassword.mockRejectedValue(
      Object.assign(new Error("email in use"), {
        code: "auth/email-already-in-use",
      }),
    );

    const user = setup();
    await llenarFormulario(user);

    await waitFor(() =>
      expect(
        screen.getByText("Error: este correo ya está registrado."),
      ).toBeInTheDocument(),
    );

    expect(llamadasAlApi).toBe(0);
    expect(firestoreSpies.setDoc).not.toHaveBeenCalled();
    expect(firebaseAuthSpies.signOut).not.toHaveBeenCalled();

    // Y no se va de la pantalla: no hay nada que confirmar.
    vi.advanceTimersByTime(MUCHO_DESPUES_MS);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  // Defecto PREEXISTENTE. Los tres mensajes de error de Firebase no llevaban
  // la palabra "Error" y el render elegía el color con
  // `message.includes("Error")`: la oficina los veía en VERDE, como si el alta
  // hubiera salido bien. Ahora el color lo fija un estado explícito; estas
  // pruebas afirman el COLOR (lo que se ve), no la presencia de la palabra.
  describe("los errores de Firebase se pintan en rojo", () => {
    it.each([
      ["auth/email-already-in-use", "Error: este correo ya está registrado."],
      ["auth/weak-password", "Error: la contraseña necesita 6 caracteres."],
      ["auth/invalid-email", "Error: el correo no es válido."],
      ["auth/network-request-failed", "Error al registrar el usuario. Intenta nuevamente."],
    ])("%s", async (code, textoEsperado) => {
      firebaseAuthSpies.createUserWithEmailAndPassword.mockRejectedValue(
        Object.assign(new Error(code), { code }),
      );

      const user = setup();
      await llenarFormulario(user);

      const mensaje = await screen.findByText(textoEsperado);
      expect(mensaje).toHaveClass("text-red-500");
      expect(mensaje).not.toHaveClass("text-green-500");
    });
  });
});
