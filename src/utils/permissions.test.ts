import { describe, it, expect } from "vitest";
import { canUserAccessModule, filterModulesByPermissions } from "./permissions";
import { desktopModules } from "../constants/desktopModules";
import { DESKTOP_MODULES } from "../constants/modules";
import { ROLES } from "../constants/roles";
import type { UserData } from "../types/auth";

const usuario = (rol: UserData["ROL"], modulosDesktop: string[] = []): UserData => ({
  ID: "u1",
  EMAIL: "prueba@muebleriamsp.mx",
  ROL: rol,
  MODULOS_DESKTOP: modulosDesktop,
});

describe("canUserAccessModule", () => {
  it("concede a un operador el módulo que trae en MODULOS_DESKTOP", () => {
    const operador = usuario(ROLES.OPERADOR, ["BANDEJA", "CLIENTES", "RUTAS"]);

    expect(canUserAccessModule(operador, "BANDEJA")).toBe(true);
    expect(canUserAccessModule(operador, "CLIENTES")).toBe(true);
    expect(canUserAccessModule(operador, "RUTAS")).toBe(true);
  });

  it("niega al operador el módulo que NO trae en MODULOS_DESKTOP", () => {
    const operador = usuario(ROLES.OPERADOR, ["BANDEJA"]);

    expect(canUserAccessModule(operador, "CLIENTES")).toBe(false);
  });

  it("no deja que el interruptor conceda un módulo reservado por rol", () => {
    const operador = usuario(ROLES.OPERADOR, ["USUARIOS", "CONFIGURACION"]);

    expect(canUserAccessModule(operador, "USUARIOS")).toBe(false);
    expect(canUserAccessModule(operador, "CONFIGURACION")).toBe(false);
  });

  it("mantiene los módulos reservados para admin y super admin", () => {
    expect(canUserAccessModule(usuario(ROLES.ADMIN), "CONFIGURACION")).toBe(true);
    expect(canUserAccessModule(usuario(ROLES.SUPER_ADMIN), "CONFIGURACION")).toBe(true);
    expect(canUserAccessModule(usuario(ROLES.SUPER_ADMIN), "USUARIOS")).toBe(true);
  });

  it("deja Inicio abierto a cualquier usuario autenticado y niega todo sin usuario", () => {
    expect(canUserAccessModule(usuario(ROLES.VIEWER), "HOME")).toBe(true);
    expect(canUserAccessModule(null, "HOME")).toBe(false);
  });

  it("niega todo cuando el usuario no tiene ROL — es el caso que da pantalla vacía", () => {
    const sinRol = { ...usuario(ROLES.OPERADOR, ["BANDEJA"]), ROL: undefined as unknown as UserData["ROL"] };

    expect(canUserAccessModule(sinRol, "BANDEJA")).toBe(false);
    expect(canUserAccessModule(sinRol, "HOME")).toBe(true);
  });

  it("respeta los módulos fijos del supervisor", () => {
    const supervisor = usuario(ROLES.SUPERVISOR, ["BANDEJA"]);

    expect(canUserAccessModule(supervisor, "SALES")).toBe(true);
    expect(canUserAccessModule(supervisor, "BANDEJA")).toBe(false);
  });
});

describe("filterModulesByPermissions", () => {
  it("entrega al operador exactamente lo que el menú lateral debe pintar", () => {
    const operador = usuario(ROLES.OPERADOR, ["BANDEJA", "CONFIGURACION"]);

    const claves = filterModulesByPermissions(operador).map((m) => m.key);

    expect(claves).toContain("HOME");
    expect(claves).toContain("BANDEJA");
    // CONFIGURACION está en su MODULOS_DESKTOP pero es reservado: si el menú lo
    // pintara, al hacer clic el guardia de rutas lo regresaría a Inicio.
    expect(claves).not.toContain("CONFIGURACION");
  });
});

describe("desktopModules (interruptores de la pantalla de usuarios)", () => {
  it("ofrece un interruptor para cada pantalla concedible, incluidas las nuevas", () => {
    const claves = desktopModules.map((m) => m.key);

    expect(claves).toEqual(
      expect.arrayContaining(["CLIENTES", "RUTAS", "BANDEJA", "CARTERA", "FAILED_INTENTS"]),
    );
  });

  it("no ofrece interruptor para lo que el interruptor no puede conceder", () => {
    const claves = desktopModules.map((m) => m.key);

    expect(claves).not.toContain("HOME");
    expect(claves).not.toContain("USUARIOS");
    expect(claves).not.toContain("CONFIGURACION");
  });

  it("no vuelve a quedarse atrás: cubre todo módulo sin requiredRole salvo Inicio", () => {
    const esperados = DESKTOP_MODULES
      .filter((m) => m.key !== "HOME")
      .filter((m) => !m.requiredRole?.length)
      .map((m) => m.key);

    expect(desktopModules.map((m) => m.key)).toEqual(esperados);
  });
});
