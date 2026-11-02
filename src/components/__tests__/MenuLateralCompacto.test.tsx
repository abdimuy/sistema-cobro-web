import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { DESKTOP_MODULES } from "@/constants/modules";
import { AppLayout } from "../AppLayout";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    getAvailableModulesWithConfig: () => DESKTOP_MODULES.filter((m) => ["HOME", "CLIENTES"].includes(m.key)),
  }),
}));
vi.mock("@/context/UpdaterContext", () => ({
  UpdaterProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useUpdater: () => ({ state: { status: "idle" }, downloadAndInstall: vi.fn(), relaunchApp: vi.fn() }),
}));
vi.mock("../NavUser", () => ({ NavUser: () => null }));
vi.mock("../AppUpdater", () => ({ AppUpdater: () => null }));
vi.mock("../ThemeToggle", () => ({ ThemeToggle: () => null }));
vi.mock("../notifications/NotificationBell", () => ({ default: () => null }));
vi.mock("@/hooks/useEtiquetaModuloActual", () => ({ useEtiquetaModuloActual: () => "Inicio" }));

const CLAVE = "msp.menu_lateral.compacto";

function montar() {
  return render(
    <MemoryRouter>
      <AppLayout />
    </MemoryRouter>,
  );
}
const lateral = () => document.querySelector("[data-collapsible]") as HTMLElement;

describe("menú lateral compacto", () => {
  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  it("arranca expandido y el botón alterna a compacto (sólo íconos) y guarda la elección", async () => {
    const user = userEvent.setup();
    montar();
    expect(lateral().dataset.state).toBe("expanded");
    await user.click(screen.getByRole("button", { name: "Compactar menú" }));
    expect(lateral().dataset.state).toBe("collapsed");
    expect(lateral().dataset.collapsible).toBe("icon");
    expect(localStorage.getItem(CLAVE)).toBe("1");
    await user.click(screen.getByRole("button", { name: "Expandir menú" }));
    expect(lateral().dataset.state).toBe("expanded");
    expect(localStorage.getItem(CLAVE)).toBe("0");
  });

  it("restaura el estado compacto guardado al montar", () => {
    localStorage.setItem(CLAVE, "1");
    montar();
    expect(lateral().dataset.state).toBe("collapsed");
    expect(screen.getByRole("button", { name: "Expandir menú" })).toBeInTheDocument();
  });

  it("si localStorage falla, arranca expandido", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    montar();
    expect(lateral().dataset.state).toBe("expanded");
    vi.restoreAllMocks();
  });

  it("Ctrl+B alterna el menú", () => {
    montar();
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(lateral().dataset.state).toBe("collapsed");
  });

  it("en compacto, pasar el mouse por un ícono muestra su nombre a la derecha", async () => {
    localStorage.setItem(CLAVE, "1");
    const user = userEvent.setup();
    montar();
    await user.hover(screen.getByRole("link", { name: "Clientes" }));
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveTextContent("Clientes");
  });
});
