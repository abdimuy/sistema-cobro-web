import { useMemo, useState } from "react";
import type { ArticuloGarantia } from "../domain/garantia";
import type {
  IdentidadComando,
  SolicitudComandoArticulo,
  TipoComandoArticulo,
} from "../domain/comandos";
import { nuevaIdentidadComando } from "../domain/comandos";
import { puedeEjecutarComando } from "../domain/permisos";
import { crearGarantiasPort } from "../presentation/composition/crearGarantiasPort";
import { mensajeErrorGarantias } from "../infrastructure/mappers/errorMapper";

interface Props {
  garantiaId: string;
  articulos: readonly ArticuloGarantia[];
  permisos: readonly string[];
  onSuccess: () => void;
}

interface OperacionPreparada {
  articuloId: string;
  comando: SolicitudComandoArticulo;
  identidad: IdentidadComando;
}

const TIPOS: readonly TipoComandoArticulo[] = [
  "diagnostico",
  "dictamen",
  "cambio-fisico",
  "desenlace",
];

export function ComandoArticuloForm({
  garantiaId,
  articulos,
  permisos,
  onSuccess,
}: Props) {
  const port = useMemo(() => crearGarantiasPort(), []);
  const disponibles = TIPOS.filter((tipo) =>
    puedeEjecutarComando(permisos, tipo),
  );

  const [articuloId, setArticuloId] = useState("");
  const [tipo, setTipo] = useState<TipoComandoArticulo | "">("");
  const [valor, setValor] = useState("");
  const [rol, setRol] = useState<"oficina" | "tecnica" | "carpinteria">("oficina");
  const [preparada, setPreparada] = useState<OperacionPreparada | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  if (disponibles.length === 0 || articulos.length === 0) {
    return null;
  }

  function construirComando(): SolicitudComandoArticulo | null {
    switch (tipo) {
      case "diagnostico":
        if (valor !== "taller" && valor !== "proveedor") return null;
        return { tipo, ruta: valor, rol_decisor: rol };
      case "dictamen":
        if (valor !== "aceptada" && valor !== "rechazada" && valor !== "sin_falla") {
          return null;
        }
        return { tipo, dictamen: valor };
      case "cambio-fisico":
        return { tipo, rol_decisor: rol };
      case "desenlace":
        if (
          valor !== "reparado" &&
          valor !== "reemplazado" &&
          valor !== "devuelto" &&
          valor !== "segunda_mano" &&
          valor !== "desarmado" &&
          valor !== "merma"
        ) return null;
        return { tipo, desenlace: valor, rol_decisor: rol };
      default:
        return null;
    }
  }

  function preparar() {
    if (!articuloId || !tipo || !puedeEjecutarComando(permisos, tipo)) {
      setError("Selecciona un artículo y una operación autorizada.");
      return;
    }
    const comando = construirComando();
    if (!comando) {
      setError("Selecciona una opción válida.");
      return;
    }
    setPreparada({
      articuloId,
      comando,
      identidad: nuevaIdentidadComando(),
    });
    setError(null);
    setMensaje(null);
  }

  async function enviar() {
    if (!preparada || enviando) return;
    if (!puedeEjecutarComando(permisos, preparada.comando.tipo)) return;

    setEnviando(true);
    setError(null);

    try {
      await port.ejecutarComandoArticulo(
        garantiaId,
        preparada.articuloId,
        preparada.comando,
        preparada.identidad,
      );
      setPreparada(null);
      setMensaje("Operación registrada correctamente.");
      onSuccess();
    } catch (e) {
      setError(mensajeErrorGarantias(e));
      // No borrar la operación: el reintento debe ser idéntico.
    } finally {
      setEnviando(false);
    }
  }

  function cambiarTipo(nuevo: TipoComandoArticulo | "") {
    setTipo(nuevo);
    setValor("");
    setError(null);
    setMensaje(null);
  }

  const bloqueado = preparada !== null || enviando;

  return (
    <section aria-label="Operaciones de artículo" className="space-y-3 rounded-md border p-4">
      <h3 className="font-semibold">Registrar operación</h3>

      <label className="block text-sm">
        Artículo
        <select
          aria-label="Artículo para operación"
          className="mt-1 w-full rounded border border-input bg-background p-2 text-foreground"
          value={articuloId}
          disabled={bloqueado}
          onChange={(e) => setArticuloId(e.target.value)}
        >
          <option value="">Seleccionar artículo</option>
          {articulos.map((articulo) => (
            <option key={articulo.id} value={articulo.id}>
              {articulo.clave} — {articulo.description}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        Operación
        <select
          aria-label="Tipo de operación"
          className="mt-1 w-full rounded border border-input bg-background p-2 text-foreground"
          value={tipo}
          disabled={bloqueado}
          onChange={(e) => cambiarTipo(e.target.value as TipoComandoArticulo | "")}
        >
          <option value="">Seleccionar operación</option>
          {disponibles.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion.replace(/-/g, " ")}
            </option>
          ))}
        </select>
      </label>

      {tipo !== "" && tipo !== "cambio-fisico" && (
        <label className="block text-sm">
          {tipo === "diagnostico" ? "Ruta" : tipo === "dictamen" ? "Dictamen" : "Desenlace"}
          <select
            aria-label="Resultado de operación"
            className="mt-1 w-full rounded border border-input bg-background p-2 text-foreground"
            value={valor}
            disabled={bloqueado}
            onChange={(e) => setValor(e.target.value)}
          >
            <option value="">Seleccionar</option>
            {(tipo === "diagnostico"
              ? ["proveedor", "taller"]
              : tipo === "dictamen"
                ? ["aceptada", "rechazada", "sin_falla"]
                : ["reparado", "reemplazado", "devuelto", "segunda_mano", "desarmado", "merma"]
            ).map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
      )}

      {(tipo === "diagnostico" || tipo === "cambio-fisico" || tipo === "desenlace") && (
        <label className="block text-sm">
          Rol decisor
          <select
            aria-label="Rol decisor"
            className="mt-1 w-full rounded border border-input bg-background p-2 text-foreground"
            value={rol}
            disabled={bloqueado}
            onChange={(e) =>
              setRol(e.target.value as "oficina" | "tecnica" | "carpinteria")
            }
          >
            <option value="oficina">Oficina</option>
            <option value="tecnica">Técnica</option>
            <option value="carpinteria">Carpintería</option>
          </select>
        </label>
      )}

      {!preparada ? (
        <button
          type="button"
          className="rounded bg-primary px-4 py-2 text-primary-foreground"
          onClick={preparar}
        >
          Preparar operación
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm" role="status">
            Operación preparada: {preparada.comando.tipo}
          </p>
          <button
            type="button"
            className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
            disabled={enviando}
            onClick={() => void enviar()}
          >
            {enviando ? "Enviando..." : error ? "Reintentar operación" : "Confirmar operación"}
          </button>
          <button
            type="button"
            className="ml-2 rounded border px-4 py-2"
            disabled={enviando}
            onClick={() => {
              setPreparada(null);
              setError(null);
            }}
          >
            Descartar operación
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-destructive">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}
    </section>
  );
}
