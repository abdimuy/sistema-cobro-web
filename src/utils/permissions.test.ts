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

  it("el interruptor concede Usuarios y Configuración a un operador", () => {
    const conUsuarios = usuario(ROLES.OPERADOR, ["USUARIOS"]);
    const conConfiguracion = usuario(ROLES.OPERADOR, ["CONFIGURACION"]);

    expect(canUserAccessModule(conUsuarios, "USUARIOS")).toBe(true);
    expect(canUserAccessModule(conUsuarios, "CONFIGURACION")).toBe(false);
    expect(canUserAccessModule(conConfiguracion, "CONFIGURACION")).toBe(true);
    expect(canUserAccessModule(conConfiguracion, "USUARIOS")).toBe(false);
  });

  it("sin interruptor, un admin ya no ve nada más que Inicio", () => {
    const admin = usuario(ROLES.ADMIN);

    expect(canUserAccessModule(admin, "HOME")).toBe(true);
    for (const modulo of DESKTOP_MODULES.filter((m) => m.key !== "HOME")) {
      expect(canUserAccessModule(admin, modulo.key)).toBe(false);
    }
  });

  it("el admin ve exactamente lo que trae encendido, ni más ni menos", () => {
    const admin = usuario(ROLES.ADMIN, ["CARTERA"]);

    expect(canUserAccessModule(admin, "CARTERA")).toBe(true);
    expect(canUserAccessModule(admin, "USUARIOS")).toBe(false);
  });

  it("el supervisor ya no hereda SALES/VENTAS_LOCALES/GARANTIAS por su rol", () => {
    const supervisor = usuario(ROLES.SUPERVISOR, ["BANDEJA"]);

    expect(canUserAccessModule(supervisor, "SALES")).toBe(false);
    expect(canUserAccessModule(supervisor, "VENTAS_LOCALES")).toBe(false);
    expect(canUserAccessModule(supervisor, "GARANTIAS")).toBe(false);
    expect(canUserAccessModule(supervisor, "BANDEJA")).toBe(true);
  });

  it("anti-bloqueo: el super admin ve todo aunque tenga la lista vacía", () => {
    const superAdmin = usuario(ROLES.SUPER_ADMIN);

    for (const modulo of DESKTOP_MODULES) {
      expect(canUserAccessModule(superAdmin, modulo.key)).toBe(true);
    }
  });

  it("deja Inicio abierto a cualquier usuario autenticado y niega todo sin usuario", () => {
    expect(canUserAccessModule(usuario(ROLES.VIEWER), "HOME")).toBe(true);
    expect(canUserAccessModule(null, "HOME")).toBe(false);
  });

  it("niega todo cuando el usuario no tiene ROL, salvo Inicio", () => {
    const sinRol = { ...usuario(ROLES.OPERADOR, ["BANDEJA"]), ROL: undefined as unknown as UserData["ROL"] };

    // Sin ROL la lista sigue mandando: el rol ya no es un camino de acceso.
    expect(canUserAccessModule(sinRol, "BANDEJA")).toBe(true);
    expect(canUserAccessModule(sinRol, "CLIENTES")).toBe(false);
    expect(canUserAccessModule(sinRol, "HOME")).toBe(true);
  });

  it("niega cuando MODULOS_DESKTOP no viene en el documento", () => {
    const sinLista: UserData = { ID: "u2", EMAIL: "x@muebleriamsp.mx", ROL: ROLES.OPERADOR };

    expect(canUserAccessModule(sinLista, "BANDEJA")).toBe(false);
    expect(canUserAccessModule(sinLista, "HOME")).toBe(true);
  });
});

describe("filterModulesByPermissions", () => {
  it("entrega al operador exactamente lo que el menú lateral debe pintar", () => {
    const operador = usuario(ROLES.OPERADOR, ["BANDEJA", "CONFIGURACION"]);

    const claves = filterModulesByPermissions(operador).map((m) => m.key);

    // El orden es el del registro DESKTOP_MODULES, no el de MODULOS_DESKTOP.
    expect(claves).toEqual(["HOME", "CONFIGURACION", "BANDEJA"]);
  });

  it("al admin sin interruptores le deja sólo Inicio", () => {
    const claves = filterModulesByPermissions(usuario(ROLES.ADMIN)).map((m) => m.key);

    expect(claves).toEqual(["HOME"]);
  });
});

describe("desktopModules (interruptores de la pantalla de usuarios)", () => {
  it("ofrece un interruptor para cada pantalla concedible, incluidas las nuevas", () => {
    const claves = desktopModules.map((m) => m.key);

    expect(claves).toEqual(
      expect.arrayContaining([
        "CLIENTES",
        "RUTAS",
        "BANDEJA",
        "CARTERA",
        "FAILED_INTENTS",
        "USUARIOS",
        "CONFIGURACION",
      ]),
    );
  });

  it("no ofrece interruptor para Inicio, que siempre está", () => {
    expect(desktopModules.map((m) => m.key)).not.toContain("HOME");
  });

  it("cubre todas las pantallas salvo Inicio — hoy son 13", () => {
    const esperados = DESKTOP_MODULES.filter((m) => m.key !== "HOME").map((m) => m.key);

    expect(desktopModules.map((m) => m.key)).toEqual(esperados);
    expect(desktopModules).toHaveLength(13);
  });

  it("cada interruptor corresponde a un módulo que la regla puede conceder", () => {
    for (const interruptor of desktopModules) {
      const usuarioConEse = usuario(ROLES.OPERADOR, [interruptor.key]);
      expect(canUserAccessModule(usuarioConEse, interruptor.key)).toBe(true);
    }
  });
});
