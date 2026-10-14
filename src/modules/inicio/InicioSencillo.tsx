import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

// Inicio para quien no tiene "Desempeño de cobradores" (D9): sus pantallas.
export function InicioSencillo() {
  const { userData } = useAuth();
  const { getAvailableModulesWithConfig } = usePermissions();
  const modulos = getAvailableModulesWithConfig().filter((m) => m.path !== "/");
  const nombre = userData?.NOMBRE?.trim().split(/\s+/)[0];
  return (
    <section className="flex flex-col gap-6 px-10 pt-9">
      <div>
        <h1 className="font-serif text-4xl">{nombre ? `Hola, ${nombre}` : "Inicio"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Elige a dónde ir</p>
      </div>
      {modulos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tienes pantallas asignadas. Pide acceso a un administrador.</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          {modulos.map((m) => (
            <li key={m.key}>
              <Link
                to={m.path}
                className="flex h-14 items-center gap-3 rounded-xl border border-border px-4 text-sm hover:bg-muted"
              >
                {m.icon && <m.icon aria-hidden className="h-4 w-4 text-muted-foreground" />}
                {m.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
