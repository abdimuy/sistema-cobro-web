import { usePermissions } from "@/hooks/usePermissions";
import { Desempeno } from "@/modules/desempeno";
import { InicioSencillo } from "./InicioSencillo";

// "/" (D9): con el interruptor DESEMPENO_COBRADORES (o SUPER_ADMIN), la
// pantalla de desempeño; sin él, un inicio sencillo. "Configurar" del tablero
// lleva a Usuarios (/settings), por eso pide el módulo USUARIOS.
export default function Inicio() {
  const { canAccessModule } = usePermissions();
  if (canAccessModule("DESEMPENO_COBRADORES")) {
    return <Desempeno puedeConfigurar={canAccessModule("USUARIOS")} />;
  }
  return <InicioSencillo />;
}
