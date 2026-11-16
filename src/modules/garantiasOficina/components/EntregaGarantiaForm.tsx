import { useMemo, useState } from "react";
import {
  nuevaIdentidadComando,
  type IdentidadComando,
} from "../domain/comandos";
import { puedeCerrarGarantia } from "../domain/permisos";
import { crearGarantiasPort } from "../presentation/composition/crearGarantiasPort";
import { mensajeErrorGarantias } from "../infrastructure/mappers/errorMapper";

interface Props {
  garantiaId: string;
  permisos: readonly string[];
  onSuccess: () => void;
}

interface EntregaPreparada {
  firma: File;
  gpsLat: number;
  gpsLon: number;
  identidad: IdentidadComando;
}

const MAX_FIRMA = 1024 * 1024;

function coordenada(valor: string, minimo: number, maximo: number) {
  if (valor.trim() === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= minimo && numero <= maximo
    ? numero
    : null;
}

export function EntregaGarantiaForm({
  garantiaId,
  permisos,
  onSuccess,
}: Props) {
  const port = useMemo(() => crearGarantiasPort(), []);
  const autorizado = puedeCerrarGarantia(permisos);

  const [firma, setFirma] = useState<File | null>(null);
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [preparada, setPreparada] = useState<EntregaPreparada | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  if (!autorizado) return null;

  function preparar() {
    if (!firma || !["image/jpeg", "image/png"].includes(firma.type)) {
      setError("Selecciona una firma JPEG o PNG.");
      return;
    }

    if (firma.size === 0 || firma.size > MAX_FIRMA) {
      setError("La firma debe tener entre 1 byte y 1 MiB.");
      return;
    }

    const gpsLat = coordenada(latitud, -90, 90);
    const gpsLon = coordenada(longitud, -180, 180);

    if (gpsLat === null || gpsLon === null) {
      setError("Introduce coordenadas GPS válidas.");
      return;
    }

    setPreparada({
      firma,
      gpsLat,
      gpsLon,
      identidad: nuevaIdentidadComando(),
    });
    setError(null);
    setMensaje(null);
  }

  async function confirmar() {
    if (!preparada || enviando || !autorizado) return;

    setEnviando(true);
    setError(null);

    try {
      await port.entregarGarantia(
        garantiaId,
        preparada.firma,
        preparada.gpsLat,
        preparada.gpsLon,
        preparada.identidad,
      );

      setPreparada(null);
      setFirma(null);
      setLatitud("");
      setLongitud("");
      setMensaje("Entrega registrada correctamente.");
      onSuccess();
    } catch (e) {
      setError(mensajeErrorGarantias(e));
      // Conservar firma, GPS e identidad para el mismo reintento.
    } finally {
      setEnviando(false);
    }
  }

  const bloqueado = preparada !== null || enviando;

  return (
    <section aria-label="Entrega con firma" className="space-y-3 rounded-md border p-4">
      <h3 className="font-semibold">Entregar garantía</h3>
      <p className="text-sm">
        Adjunta la firma de conformidad y registra el GPS del agente.
      </p>

      <label className="block text-sm">
        Firma del cliente
        <input
          aria-label="Archivo de firma"
          type="file"
          accept="image/jpeg,image/png"
          disabled={bloqueado}
          className="mt-1 block w-full"
          onChange={(e) => {
            setFirma(e.target.files?.[0] ?? null);
            setError(null);
          }}
        />
      </label>

      <label className="block text-sm">
        Latitud GPS
        <input
          aria-label="Latitud GPS"
          type="number"
          step="any"
          value={latitud}
          disabled={bloqueado}
          onChange={(e) => setLatitud(e.target.value)}
          className="mt-1 w-full rounded border border-input bg-background p-2 text-foreground"
        />
      </label>

      <label className="block text-sm">
        Longitud GPS
        <input
          aria-label="Longitud GPS"
          type="number"
          step="any"
          value={longitud}
          disabled={bloqueado}
          onChange={(e) => setLongitud(e.target.value)}
          className="mt-1 w-full rounded border border-input bg-background p-2 text-foreground"
        />
      </label>

      {!preparada ? (
        <button
          type="button"
          className="rounded bg-primary px-4 py-2 text-primary-foreground"
          onClick={preparar}
        >
          Preparar entrega
        </button>
      ) : (
        <div className="space-y-2">
          <p role="status">
            Firma preparada: {preparada.firma.name}
          </p>
          <button
            type="button"
            className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
            disabled={enviando}
            onClick={() => void confirmar()}
          >
            {enviando
              ? "Enviando..."
              : error
                ? "Reintentar entrega"
                : "Confirmar entrega"}
          </button>
          <button
            type="button"
            disabled={enviando}
            className="ml-2 rounded border px-4 py-2"
            onClick={() => {
              setPreparada(null);
              setError(null);
            }}
          >
            Descartar entrega
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-destructive">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}
    </section>
  );
}
