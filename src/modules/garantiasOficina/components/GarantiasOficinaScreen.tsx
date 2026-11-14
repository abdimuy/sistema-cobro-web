import { EntregaGarantiaForm } from "./EntregaGarantiaForm";
import { VisorImagenGarantia } from "./VisorImagenGarantia";
import { ComandoFolioForm } from "./ComandoFolioForm";
import { ComandoArticuloForm } from "./ComandoArticuloForm";
import { GestionArticulosForm } from "./GestionArticulosForm";
import { usePermisosGarantias } from "../presentation/hooks/usePermisosGarantias";
import { puedeLeerGarantias } from "../domain/permisos";
import { useCatalogosGarantias } from "../presentation/hooks/useCatalogosGarantias";
import { useMemo, useState } from "react";
import type { FiltrosGarantias } from "../domain/garantia";
import {
  useBandejaGarantias,
  useDetalleGarantia,
} from "../presentation/hooks/useGarantias";

function fecha(valor: string): string {
  const d = new Date(valor);
  return Number.isNaN(d.getTime())
    ? valor
    : new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Mexico_City",
      }).format(d);
}

function BandejaGarantiasAutorizada({ permisos }: { permisos: readonly string[] }) {
  const { catalogos, cargando: cargandoCatalogos, error: errorCatalogos } = useCatalogosGarantias();
  const [estado, setEstado] = useState("");
  const [origen, setOrigen] = useState("");
  const [etapa, setEtapa] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [cliente, setCliente] = useState("");
  const [cursores, setCursores] = useState<(string | undefined)[]>([undefined]);
  const [indice, setIndice] = useState(0);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const filtros: FiltrosGarantias = useMemo(() => ({
    ...(estado ? { estado } : {}),
    ...(origen ? { origen } : {}),
    ...(etapa ? { etapa } : {}),
    ...(ubicacion ? { ubicacion } : {}),
    ...(cliente ? { cliente_id: Number(cliente) } : {}),
  }), [estado, origen, etapa, ubicacion, cliente]);

  const { pagina, cargando, error } = useBandejaGarantias(
    filtros,
    cursores[indice],
  );

  const {
    detalle,
    cargando: cargandoDetalle,
    error: errorDetalle,
  } = useDetalleGarantia(seleccionado, revision);

  function reiniciarPagina() {
    setCursores([undefined]);
    setIndice(0);
    setSeleccionado(null);
  }

  function siguiente() {
    if (!pagina?.has_more || !pagina.next_cursor) return;
    setCursores((anteriores) => [
      ...anteriores.slice(0, indice + 1),
      pagina.next_cursor,
    ]);
    setIndice((anterior) => anterior + 1);
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm";

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Garantías de oficina</h1>
        <p className="mt-1 text-sm text-gray-500">
          Consulta de folios, artículos y seguimiento de eventos.
        </p>
      </header>

      <section aria-label="Filtros de garantías" className="grid gap-3 md:grid-cols-5">
        <label className="space-y-1 text-sm">
          <span>Estado</span>
          <select className={inputClass} value={estado}
            disabled={cargandoCatalogos || !catalogos}
            onChange={(e) => {
              setEstado(e.target.value);
              reiniciarPagina();
            }}>
            <option value="">Todos</option>
            {catalogos?.estados.map((opcion) => (
              <option key={opcion} value={opcion}>{opcion.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Origen</span>
          <select className={inputClass} value={origen}
            onChange={(e) => {
              setOrigen(e.target.value);
              reiniciarPagina();
            }}>
            <option value="">Todos</option>
            <option value="cliente">Cliente</option>
            <option value="piso">Piso</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Etapa</span>
          <select className={inputClass} value={etapa}
            disabled={cargandoCatalogos || !catalogos}
            onChange={(e) => {
              setEtapa(e.target.value);
              reiniciarPagina();
            }}>
            <option value="">Todos</option>
            {catalogos?.etapas.map((opcion) => (
              <option key={opcion} value={opcion}>{opcion.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Ubicación</span>
          <select className={inputClass} value={ubicacion}
            disabled={cargandoCatalogos || !catalogos}
            onChange={(e) => {
              setUbicacion(e.target.value);
              reiniciarPagina();
            }}>
            <option value="">Todos</option>
            {catalogos?.ubicaciones.map((opcion) => (
              <option key={opcion} value={opcion}>{opcion.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>ID cliente</span>
          <input className={inputClass} type="number" min="1"
            value={cliente} placeholder="Número de cliente"
            onChange={(e) => {
              setCliente(e.target.value);
              reiniciarPagina();
            }} />
        </label>
      </section>

      {errorCatalogos && (
        <p role="alert" className="text-red-600">
          No se pudieron cargar los filtros: {errorCatalogos}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Bandeja de folios" className="space-y-3">
          <h2 className="text-lg font-semibold">Folios</h2>

          {cargando && <p role="status">Cargando garantías...</p>}
          {error && <p role="alert" className="text-red-600">{error}</p>}

          {!cargando && !error && pagina?.items.length === 0 && (
            <p>No se encontraron garantías con esos filtros.</p>
          )}

          <div className="space-y-2">
            {pagina?.items.map((g) => (
              <button key={g.id} type="button"
                onClick={() => setSeleccionado(g.id)}
                aria-pressed={seleccionado === g.id}
                className="w-full rounded-md border p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800">
                <div className="flex items-center justify-between gap-3">
                  <strong>{g.folio}</strong>
                  <span className="text-sm">{g.estado}</span>
                </div>
                <p className="mt-1 text-sm">{g.description}</p>
                <p className="mt-2 text-xs text-gray-500">
                  Origen: {g.origen} · {fecha(g.created_at)}
                </p>
                <p className="text-xs text-gray-500">
                  Artículos: {g.articulos.length}
                </p>
              </button>
            ))}
          </div>

          <nav aria-label="Paginación de garantías" className="flex items-center gap-3">
            <button type="button" className="rounded border px-3 py-2"
              disabled={indice === 0 || cargando}
              onClick={() => {
                setIndice((anterior) => anterior - 1);
                setSeleccionado(null);
              }}>
              Anterior
            </button>
            <span className="text-sm">Página {indice + 1}</span>
            <button type="button" className="rounded border px-3 py-2"
              disabled={cargando || !pagina?.has_more || !pagina.next_cursor}
              onClick={() => {
                siguiente();
                setSeleccionado(null);
              }}>
              Siguiente
            </button>
          </nav>
        </section>

        <section aria-label="Detalle de garantía" className="space-y-4">
          <h2 className="text-lg font-semibold">Detalle</h2>

          {!seleccionado && <p>Selecciona un folio para consultar su detalle.</p>}
          {cargandoDetalle && <p role="status">Cargando detalle...</p>}
          {errorDetalle && <p role="alert" className="text-red-600">{errorDetalle}</p>}

          {detalle && (
            <>
              <div className="rounded-md border p-4">
                <h3 className="font-semibold">{detalle.garantia.folio}</h3>
                <p className="text-sm">{detalle.garantia.description}</p>
                <p className="mt-2 text-sm">
                  Estado: {detalle.garantia.estado}
                </p>
              </div>

              <section
                aria-label="Evidencias de garantía"
                className="space-y-3 rounded-md border p-4"
              >
                <h3 className="font-semibold">Evidencias fotográficas</h3>
                {detalle.eventos.flatMap((evento) =>
                  evento.imagenes.map((imagen) => (
                    <div
                      key={`${evento.id}-${imagen.id}`}
                      className="space-y-2 border-b py-2"
                    >
                      <p className="text-sm">
                        Evento: {evento.tipo}
                      </p>
                      <VisorImagenGarantia
                        garantiaId={detalle.garantia.id}
                        eventoId={evento.id}
                        imagenId={imagen.id}
                      />
                    </div>
                  )),
                )}
                {detalle.eventos.every(
                  (evento) => evento.imagenes.length === 0,
                ) && (
                  <p className="text-sm">
                    Este folio no tiene evidencias fotográficas.
                  </p>
                )}
              </section>

              <EntregaGarantiaForm
                garantiaId={detalle.garantia.id}
                permisos={permisos}
                onSuccess={() => setRevision((n) => n + 1)}
              />

              <ComandoFolioForm
                garantiaId={detalle.garantia.id}
                permisos={permisos}
                onSuccess={() => setRevision((n) => n + 1)}
              />

              <GestionArticulosForm
                key={`gestion-${detalle.garantia.id}`}
                garantiaId={detalle.garantia.id}
                origen={detalle.garantia.origen}
                estado={detalle.garantia.estado}
                articulos={detalle.garantia.articulos}
                transiciones={catalogos?.transiciones ?? []}
                permisos={permisos}
                onSuccess={() => setRevision((n) => n + 1)}
              />

              <ComandoArticuloForm
                key={detalle.garantia.id}
                garantiaId={detalle.garantia.id}
                articulos={detalle.garantia.articulos}
                permisos={permisos}
                onSuccess={() => setRevision((anterior) => anterior + 1)}
              />

              <div className="space-y-2">
                <h3 className="font-semibold">Artículos</h3>
                {detalle.garantia.articulos.map((a) => (
                  <div key={a.id} className="rounded-md border p-3 text-sm">
                    <strong>{a.clave}</strong>
                    <p>{a.description}</p>
                    <p>Etapa: {a.etapa}</p>
                    <p>Ubicación: {a.ubicacion}</p>
                    {a.dictamen && <p>Dictamen: {a.dictamen}</p>}
                    {a.desenlace && <p>Desenlace: {a.desenlace}</p>}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Línea de tiempo</h3>
                {detalle.eventos.map((evento) => (
                  <div key={evento.id} className="rounded-md border p-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <strong>{evento.tipo}</strong>
                      <time>{fecha(evento.created_at)}</time>
                    </div>
                    <p>{evento.description}</p>
                    <p className="text-xs text-gray-500">
                      Usuario: {evento.usuario}
                    </p>
                    {evento.imagenes.length > 0 && (
                      <p>Imágenes adjuntas: {evento.imagenes.length}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export function GarantiasOficinaScreen() {
  const { permisos, cargando, error } = usePermisosGarantias();

  if (cargando) {
    return (
      <main className="p-6" role="status">
        Comprobando permisos de Garantías...
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Garantías de oficina</h1>
        <p role="alert" className="mt-3 text-red-600">
          No se pudieron verificar los permisos: {error}
        </p>
      </main>
    );
  }

  if (!puedeLeerGarantias(permisos)) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Garantías de oficina</h1>
        <p role="alert" className="mt-3">
          No tienes permiso para consultar garantías.
        </p>
      </main>
    );
  }

  return <BandejaGarantiasAutorizada permisos={permisos} />;
}
