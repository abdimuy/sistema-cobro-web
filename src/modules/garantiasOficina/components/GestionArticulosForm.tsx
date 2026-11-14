import { useMemo, useState } from "react";
import {
  nuevaIdentidadComando,
  type IdentidadComando,
} from "../domain/comandos";
import { crearGarantiasPort } from "../presentation/composition/crearGarantiasPort";

interface Articulo {
  id: string;
  clave: string;
  etapa: string;
}

interface Transicion {
  origen: string;
  etapa: string;
  siguientes: readonly string[];
}

interface Props {
  garantiaId: string;
  origen: string;
  estado: string;
  articulos: readonly Articulo[];
  transiciones: readonly Transicion[];
  permisos: readonly string[];
  onSuccess: () => void;
}

type Preparada =
  | {
      tipo: "agregar";
      datos: { clave: string; description: string };
      identidad: IdentidadComando;
    }
  | {
      tipo: "avanzar";
      articuloId: string;
      etapaDestino: string;
      identidad: IdentidadComando;
    };

export function GestionArticulosForm({
  garantiaId,
  origen,
  estado,
  articulos,
  transiciones,
  permisos,
  onSuccess,
}: Props) {
  const port = useMemo(() => crearGarantiasPort(), []);
  const puedeCrear = permisos.includes("garantias:crear") && estado === "abierto";
  const puedeActualizar = permisos.includes("garantias:actualizar") && estado === "en_proceso";

  const [clave, setClave] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [articuloId, setArticuloId] = useState("");
  const [etapaDestino, setEtapaDestino] = useState("");
  const [preparada, setPreparada] = useState<Preparada | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const articulo = articulos.find((a) => a.id === articuloId);

  const siguientes = transiciones.find(
    (t) => t.origen === origen && t.etapa === articulo?.etapa,
  )?.siguientes ?? [];

  function prepararAgregar() {
    if (!puedeCrear || !clave.trim() || clave.trim().length > 50 ||
        descripcion.length > 500) {
      setError("Revisa la clave y la descripción del artículo.");
      return;
    }

    setPreparada({
      tipo: "agregar",
      datos: {
        clave: clave.trim(),
        description: descripcion.trim(),
      },
      identidad: nuevaIdentidadComando(),
    });
    setError(null);
    setMensaje(null);
  }

  function prepararAvance() {
    if (!puedeActualizar || !articulo ||
        !siguientes.includes(etapaDestino)) {
      setError("Selecciona un artículo y una transición válida.");
      return;
    }

    setPreparada({
      tipo: "avanzar",
      articuloId: articulo.id,
      etapaDestino,
      identidad: nuevaIdentidadComando(),
    });
    setError(null);
    setMensaje(null);
  }

  async function confirmar() {
    if (!preparada || enviando) return;

    if (
      (preparada.tipo === "agregar" && !puedeCrear) ||
      (preparada.tipo === "avanzar" && !puedeActualizar)
    ) {
      setError("No tienes permiso para realizar esta operación.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      if (preparada.tipo === "agregar") {
        await port.agregarArticulo(
          garantiaId,
          preparada.datos,
          preparada.identidad,
        );
      } else {
        await port.avanzarArticulo(
          garantiaId,
          preparada.articuloId,
          { etapa_destino: preparada.etapaDestino },
          preparada.identidad,
        );
      }

      setPreparada(null);
      setClave("");
      setDescripcion("");
      setArticuloId("");
      setEtapaDestino("");
      setMensaje("Operación registrada correctamente.");
      onSuccess();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo guardar la operación.",
      );
      // Conservamos la identidad para reintentos.
    } finally {
      setEnviando(false);
    }
  }

  if (!puedeCrear && !puedeActualizar) return null;

  const bloqueado = preparada !== null || enviando;
  const campo = "mt-1 w-full rounded border bg-transparent p-2";

  return (
    <section className="space-y-4 rounded-md border p-4"
      aria-label="Gestión de artículos">
      <h3 className="font-semibold">Gestión de artículos</h3>

      {puedeCrear && (
        <div className="space-y-3">
          <h4 className="font-medium">Agregar artículo</h4>
          <label className="block text-sm">
            Clave del artículo
            <input className={campo} value={clave}
              maxLength={50} disabled={bloqueado}
              onChange={(e) => setClave(e.target.value)} />
          </label>
          <label className="block text-sm">
            Descripción
            <input className={campo} value={descripcion}
              maxLength={500} disabled={bloqueado}
              onChange={(e) => setDescripcion(e.target.value)} />
          </label>
          <button type="button" disabled={bloqueado}
            className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
            onClick={prepararAgregar}>
            Preparar artículo
          </button>
        </div>
      )}

      {puedeActualizar && (
        <div className="space-y-3">
          <h4 className="font-medium">Avanzar etapa de artículo</h4>
          <label className="block text-sm">
            Artículo
            <select className={campo} value={articuloId}
              disabled={bloqueado}
              onChange={(e) => {
                setArticuloId(e.target.value);
                setEtapaDestino("");
              }}>
              <option value="">Seleccionar artículo</option>
              {articulos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.clave} — {a.etapa}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Siguiente etapa
            <select className={campo} value={etapaDestino}
              disabled={bloqueado || !articulo}
              onChange={(e) => setEtapaDestino(e.target.value)}>
              <option value="">Seleccionar etapa</option>
              {siguientes.map((etapa) => (
                <option key={etapa} value={etapa}>
                  {etapa.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <button type="button" disabled={bloqueado}
            className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
            onClick={prepararAvance}>
            Preparar avance
          </button>
        </div>
      )}

      {preparada && (
        <div className="space-y-3 border-t pt-3">
          <p role="status">
            {preparada.tipo === "agregar"
              ? `Agregar artículo: ${preparada.datos.clave}`
              : `Avanzar artículo a: ${preparada.etapaDestino}`}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={enviando}
              className="rounded bg-blue-700 px-4 py-2 text-white"
              onClick={() => void confirmar()}>
              {enviando ? "Guardando..." : error ? "Reintentar" : "Confirmar"}
            </button>
            <button type="button" disabled={enviando}
              className="rounded border px-4 py-2"
              onClick={() => {
                setPreparada(null);
                setError(null);
              }}>
              Descartar
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-red-600">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}
    </section>
  );
}
