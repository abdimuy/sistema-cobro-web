import { useMemo, useState } from "react";
import {
  nuevaIdentidadComando,
  type IdentidadComando,
  type SolicitudComandoFolio,
} from "../domain/comandos";
import {
  puedeListoEntrega,
  puedeCerrarGarantia,
} from "../domain/permisos";
import { crearGarantiasPort } from "../presentation/composition/crearGarantiasPort";
import { mensajeErrorGarantias } from "../infrastructure/mappers/errorMapper";

interface Props {
  garantiaId: string;
  permisos: readonly string[];
  onSuccess: () => void;
}

type Tipo = SolicitudComandoFolio["tipo"];

interface Preparada {
  comando: SolicitudComandoFolio;
  identidad: IdentidadComando;
}

export function ComandoFolioForm({
  garantiaId,
  permisos,
  onSuccess,
}: Props) {
  const port = useMemo(() => crearGarantiasPort(), []);

  const puedeActualizar = puedeListoEntrega(permisos);
  const puedeCerrar = puedeCerrarGarantia(permisos);

  const [tipo, setTipo] = useState<Tipo | "">("");
  const [motivo, setMotivo] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [preparada, setPreparada] = useState<Preparada | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  if (!puedeActualizar && !puedeCerrar) {
    return null;
  }

  function preparar() {
    let comando: SolicitudComandoFolio;

    if ((tipo === "iniciar-proceso" || tipo === "listo-entrega") && puedeActualizar) {
      comando = { tipo };
    } else if (tipo === "cancelar" && puedeCerrar) {
      if (!motivo.trim()) {
        setError("La cancelación requiere un motivo.");
        return;
      }
      comando = { tipo, motivo: motivo.trim() };
    } else if (tipo === "cerrar" && puedeCerrar) {
      comando = {
        tipo,
        ...(justificacion.trim()
          ? { justificacion_desvio: justificacion.trim() }
          : {}),
      };
    } else {
      setError("Selecciona una operación autorizada.");
      return;
    }

    setPreparada({
      comando,
      identidad: nuevaIdentidadComando(),
    });
    setError(null);
    setMensaje(null);
  }

  async function enviar() {
    if (!preparada || enviando) return;

    const autorizado =
      (preparada.comando.tipo === "iniciar-proceso" || preparada.comando.tipo === "listo-entrega")
        ? puedeActualizar
        : puedeCerrar;

    if (!autorizado) {
      setError("No tienes permiso para esta operación.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      await port.ejecutarComandoFolio(
        garantiaId,
        preparada.comando,
        preparada.identidad,
      );

      setPreparada(null);
      setTipo("");
      setMotivo("");
      setJustificacion("");
      setMensaje("Operación de folio registrada correctamente.");
      onSuccess();
    } catch (e) {
      setError(mensajeErrorGarantias(e));
      // Se conserva la identidad y el cuerpo para reintentar.
    } finally {
      setEnviando(false);
    }
  }

  const bloqueado = preparada !== null || enviando;

  return (
    <section
      aria-label="Operaciones de folio"
      className="space-y-3 rounded-md border p-4"
    >
      <h3 className="font-semibold">Operaciones de folio</h3>

      <label className="block text-sm">
        Operación
        <select
          aria-label="Operación de folio"
          className="mt-1 w-full rounded border bg-transparent p-2"
          value={tipo}
          disabled={bloqueado}
          onChange={(e) => {
            setTipo(e.target.value as Tipo | "");
            setError(null);
            setMensaje(null);
          }}
        >
          <option value="">Seleccionar operación</option>
          {puedeActualizar && (
            <>
              <option value="iniciar-proceso">Iniciar proceso</option>
              <option value="listo-entrega">Listo para entrega</option>
            </>
          )}
          {puedeCerrar && (
            <>
              <option value="cancelar">Cancelar garantía</option>
              <option value="cerrar">Cerrar garantía</option>
            </>
          )}
        </select>
      </label>

      {tipo === "cancelar" && (
        <label className="block text-sm">
          Motivo de cancelación
          <textarea
            aria-label="Motivo de cancelación"
            className="mt-1 w-full rounded border bg-transparent p-2"
            value={motivo}
            disabled={bloqueado}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </label>
      )}

      {tipo === "cerrar" && (
        <label className="block text-sm">
          Justificación de desvío (opcional)
          <textarea
            aria-label="Justificación de desvío"
            className="mt-1 w-full rounded border bg-transparent p-2"
            value={justificacion}
            disabled={bloqueado}
            onChange={(e) => setJustificacion(e.target.value)}
          />
        </label>
      )}

      {!preparada ? (
        <button
          type="button"
          className="rounded bg-blue-700 px-4 py-2 text-white"
          onClick={preparar}
        >
          Preparar operación de folio
        </button>
      ) : (
        <div className="space-y-2">
          <p role="status" className="text-sm">
            Operación preparada: {preparada.comando.tipo}
          </p>
          <button
            type="button"
            className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
            disabled={enviando}
            onClick={() => void enviar()}
          >
            {enviando
              ? "Enviando..."
              : error
                ? "Reintentar operación de folio"
                : "Confirmar operación de folio"}
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
            Descartar operación de folio
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {mensaje && <p role="status">{mensaje}</p>}
    </section>
  );
}
