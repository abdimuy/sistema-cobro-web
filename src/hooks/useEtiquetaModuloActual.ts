import { useLocation } from "react-router-dom";
import { DESKTOP_MODULES } from "@/constants/modules";
import type { ModuleConfig } from "@/types/auth";
import { modulosParaMenu } from "@/utils/permissions";
import { usePermissions } from "./usePermissions";

function moduloDe(pathname: string, modulos: readonly ModuleConfig[]): ModuleConfig | undefined {
  return modulos.find((m) => pathname === m.path || (m.path !== "/" && pathname.startsWith(m.path)));
}

// Nombre de la pantalla actual para la cabecera. Busca primero en los módulos
// del usuario tal como los pinta el menú: con Desempeño de cobradores, "/" se
// llama así y no "Inicio" (D9). Si la ruta no es de sus módulos, cae al
// registro completo.
export function useEtiquetaModuloActual(): string {
  const { pathname } = useLocation();
  const { getAvailableModulesWithConfig } = usePermissions();
  const mod =
    moduloDe(pathname, modulosParaMenu(getAvailableModulesWithConfig())) ?? moduloDe(pathname, DESKTOP_MODULES);
  return mod?.label ?? "Inicio";
}
