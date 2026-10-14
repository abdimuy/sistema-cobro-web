import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DESKTOP_MODULES } from "@/constants/modules";
import { ROLES } from "@/constants/roles";
import { canUserAccessModule } from "@/utils/permissions";
import type { UserData } from "@/types/auth";
import Inicio from "../Inicio";

// Permisos REALES: usePermissions y canUserAccessModule sin sustituir; solo la
// sesión (useAuth) es de prueba, armada igual que AuthContext (delega en
// canUserAccessModule).
const sesion = { usuario: null as UserData | null };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    userData: sesion.usuario,
    canAccessModule: (k: string) => canUserAccessModule(sesion.usuario, k),
    getAvailableModules: () =>
      DESKTOP_MODULES.filter((m) => canUserAccessModule(sesion.usuario, m.key)).map((m) => m.key),
  }),
}));
vi.mock("@/modules/desempeno", () => ({
  Desempeno: ({ puedeConfigurar }: { puedeConfigurar: boolean }) => (
    <div data-testid="desempeno">{`configurar:${puedeConfigurar}`}</div>
  ),
}));

function usuario(rol: UserData["ROL"], modulos: string[] = []): UserData {
  return { ID: "u1", EMAIL: "martha.rios@muebleriamsp.mx", NOMBRE: "Martha Ríos Coyotl", ROL: rol, MODULOS_DESKTOP: modulos };
}

function montar(u: UserData) {
  sesion.usuario = u;
  render(
    <MemoryRouter>
      <Inicio />
    </MemoryRouter>,
  );
}

describe("Inicio (D9)", () => {
  it("con el interruptor, Inicio es Desempeño de cobradores (y Configurar si tiene Usuarios)", () => {
    montar(usuario(ROLES.OPERADOR, ["DESEMPENO_COBRADORES", "USUARIOS"]));
    expect(screen.getByTestId("desempeno")).toHaveTextContent("configurar:true");
  });

  it("con el interruptor pero sin Usuarios, no se ofrece Configurar", () => {
    montar(usuario(ROLES.OPERADOR, ["DESEMPENO_COBRADORES"]));
    expect(screen.getByTestId("desempeno")).toHaveTextContent("configurar:false");
  });

  it("SUPER_ADMIN lo ve sin encender nada (anti-bloqueo de canUserAccessModule)", () => {
    montar(usuario(ROLES.SUPER_ADMIN));
    expect(screen.getByTestId("desempeno")).toHaveTextContent("configurar:true");
  });

  it("sin el interruptor, un inicio sencillo con sus pantallas (sin Inicio ni Desempeño)", () => {
    montar(usuario(ROLES.ADMIN, ["CLIENTES", "RUTAS"]));
    expect(screen.queryByTestId("desempeno")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hola, Martha" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clientes" })).toHaveAttribute("href", "/clientes");
    expect(screen.getByRole("link", { name: "Rutas" })).toHaveAttribute("href", "/rutas");
    expect(screen.queryByRole("link", { name: "Inicio" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Pagos y visitas/i)).not.toBeInTheDocument();
  });

  it("sin pantallas asignadas lo dice", () => {
    montar(usuario(ROLES.OPERADOR));
    expect(screen.getByText(/No tienes pantallas asignadas/)).toBeInTheDocument();
  });
});
