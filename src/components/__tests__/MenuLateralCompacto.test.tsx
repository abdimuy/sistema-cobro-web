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

  it("el botón junto al logo compacta, guarda la elección y ya no existe el botón del pie", async () => {
    const user = userEvent.setup();
    montar();
    expect(lateral().dataset.state).toBe("expanded");
    const boton = screen.getByRole("button", { name: "Compactar menú" });
    // Está en el encabezado, junto al logo, no en el pie.
    expect(lateral().querySelector("[data-sidebar=header]")).toContainElement(boton);
    expect(lateral().querySelector("[data-sidebar=footer]")).not.toContainElement(boton);
    await user.click(boton);
    expect(lateral().dataset.state).toBe("collapsed");
    expect(lateral().dataset.collapsible).toBe("icon");
    expect(localStorage.getItem(CLAVE)).toBe("1");
    expect(screen.queryByRole("button", { name: "Compactar menú" })).not.toBeInTheDocument();
  });

  it("en compacto, el hover sobre el logo ofrece Expandir y el clic expande", async () => {
    localStorage.setItem(CLAVE, "1");
    const user = userEvent.setup();
    montar();
    const expandir = screen.getByRole("button", { name: "Expandir menú" });
    await user.hover(expandir);
    expect((await screen.findAllByText(/Expandir menú \((⌘B|Ctrl\+B)\)/)).length).toBeGreaterThan(0);
    await user.click(expandir);
    expect(lateral().dataset.state).toBe("expanded");
    expect(localStorage.getItem(CLAVE)).toBe("0");
  });

  it("el logo sigue siendo un enlace a Inicio", () => {
    montar();
    expect(screen.getByRole("link", { name: /Muebles San Pablo/ })).toHaveAttribute("href", "/");
  });

  it("el riel del borde alterna compacto/expandido", async () => {
    const user = userEvent.setup();
    montar();
    const riel = document.querySelector("[data-sidebar=rail]") as HTMLElement;
    expect(riel).toHaveAttribute("aria-label", "Alternar menú lateral");
    await user.click(riel);
    expect(lateral().dataset.state).toBe("collapsed");
    expect(localStorage.getItem(CLAVE)).toBe("1");
    await user.click(riel);
    expect(lateral().dataset.state).toBe("expanded");
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
