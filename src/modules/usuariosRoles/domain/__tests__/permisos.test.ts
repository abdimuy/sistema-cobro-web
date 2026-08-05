import { describe, expect, it } from "vitest";
import { agruparPermisosPorCategoria, unionEfectivaPermisos } from "../permisos";
import type { Permiso } from "../entities";

const PERMISO_USUARIOS_VER: Permiso = {
  codigo: "usuarios:ver",
  description: "Ver usuarios",
  categoria: "usuarios",
};
const PERMISO_USUARIOS_EDITAR: Permiso = {
  codigo: "usuarios:editar",
  description: "Editar usuarios",
  categoria: "usuarios",
};
const PERMISO_ROLES_VER: Permiso = {
  codigo: "roles:ver",
  description: "Ver roles",
  categoria: "roles",
};
const PERMISO_ROLES_EDITAR: Permiso = {
  codigo: "roles:editar",
  description: "Editar roles",
  categoria: "roles",
};
const PERMISO_COBRANZA_VER: Permiso = {
  codigo: "cobranza:ver",
  description: "Ver cobranza",
  categoria: "cobranza",
};

describe("agruparPermisosPorCategoria", () => {
  it.each<{ nombre: string; permisos: Permiso[]; esperado: ReturnType<typeof agruparPermisosPorCategoria> }>([
    {
      nombre: "lista vacía retorna []",
      permisos: [],
      esperado: [],
    },
    {
      nombre: "una sola categoría con un permiso",
      permisos: [PERMISO_USUARIOS_VER],
      esperado: [{ categoria: "usuarios", permisos: [PERMISO_USUARIOS_VER] }],
    },
    {
      nombre: "una sola categoría con varios permisos ordenados por codigo",
      permisos: [PERMISO_USUARIOS_VER, PERMISO_USUARIOS_EDITAR],
      esperado: [
        {
          categoria: "usuarios",
          permisos: [PERMISO_USUARIOS_EDITAR, PERMISO_USUARIOS_VER],
        },
      ],
    },
    {
      nombre: "varias categorías retornadas en orden alfabético (no orden de entrada)",
      permisos: [PERMISO_USUARIOS_VER, PERMISO_ROLES_VER, PERMISO_COBRANZA_VER],
      esperado: [
        { categoria: "cobranza", permisos: [PERMISO_COBRANZA_VER] },
        { categoria: "roles", permisos: [PERMISO_ROLES_VER] },
        { categoria: "usuarios", permisos: [PERMISO_USUARIOS_VER] },
      ],
    },
    {
      nombre: "orden de entrada distinto produce el mismo resultado (estable)",
      permisos: [PERMISO_ROLES_EDITAR, PERMISO_USUARIOS_VER, PERMISO_ROLES_VER, PERMISO_USUARIOS_EDITAR],
      esperado: [
        {
          categoria: "roles",
          permisos: [PERMISO_ROLES_EDITAR, PERMISO_ROLES_VER],
        },
        {
          categoria: "usuarios",
          permisos: [PERMISO_USUARIOS_EDITAR, PERMISO_USUARIOS_VER],
        },
      ],
    },
  ])("$nombre", ({ permisos, esperado }) => {
    expect(agruparPermisosPorCategoria(permisos)).toEqual(esperado);
  });

  it("es estable sin importar el orden de entrada (mismo input, distinto orden -> mismo output)", () => {
    const orden1 = [PERMISO_USUARIOS_EDITAR, PERMISO_ROLES_VER, PERMISO_USUARIOS_VER];
    const orden2 = [PERMISO_ROLES_VER, PERMISO_USUARIOS_VER, PERMISO_USUARIOS_EDITAR];

    expect(agruparPermisosPorCategoria(orden1)).toEqual(agruparPermisosPorCategoria(orden2));
  });
});

describe("unionEfectivaPermisos", () => {
  it.each<{ nombre: string; permisosPorRol: Permiso[][]; esperado: Permiso[] }>([
    {
      nombre: "lista vacía retorna []",
      permisosPorRol: [],
      esperado: [],
    },
    {
      nombre: "un solo rol retorna sus permisos ordenados por codigo",
      permisosPorRol: [[PERMISO_USUARIOS_VER, PERMISO_ROLES_VER]],
      esperado: [PERMISO_ROLES_VER, PERMISO_USUARIOS_VER],
    },
    {
      nombre: "roles disjuntos se combinan (merge)",
      permisosPorRol: [[PERMISO_USUARIOS_VER], [PERMISO_ROLES_VER], [PERMISO_COBRANZA_VER]],
      esperado: [PERMISO_COBRANZA_VER, PERMISO_ROLES_VER, PERMISO_USUARIOS_VER],
    },
    {
      nombre: "codigos repetidos entre roles se deduplican, se conserva el primero",
      permisosPorRol: [
        [PERMISO_USUARIOS_VER],
        [{ ...PERMISO_USUARIOS_VER, description: "version distinta, no debe aparecer" }, PERMISO_ROLES_VER],
      ],
      esperado: [PERMISO_ROLES_VER, PERMISO_USUARIOS_VER],
    },
    {
      nombre: "listas vacías intercaladas no afectan el resultado",
      permisosPorRol: [[], [PERMISO_USUARIOS_VER], []],
      esperado: [PERMISO_USUARIOS_VER],
    },
  ])("$nombre", ({ permisosPorRol, esperado }) => {
    expect(unionEfectivaPermisos(permisosPorRol)).toEqual(esperado);
  });

  it("al deduplicar conserva el objeto de la PRIMERA ocurrencia (identidad, no solo igualdad)", () => {
    const original = PERMISO_USUARIOS_VER;
    const duplicado = { ...PERMISO_USUARIOS_VER, description: "otra descripcion" };

    const resultado = unionEfectivaPermisos([[original], [duplicado]]);

    expect(resultado).toEqual([original]);
    expect(resultado[0]).toBe(original);
    expect(resultado[0].description).toBe("Ver usuarios");
  });
});
