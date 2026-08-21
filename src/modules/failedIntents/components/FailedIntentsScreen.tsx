import { useCallback, useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { IntentoAgrupado } from "../domain/entities";
import type { IntentStatusValue } from "../domain/values";
import { useIntentosAgrupados } from "../presentation/hooks/useIntentosAgrupados";
import { useFailedIntentDetail } from "../presentation/hooks/useFailedIntentDetail";
import { useReplayAction } from "../presentation/hooks/useReplayAction";
import { useResolverAction } from "../presentation/hooks/useResolverAction";

import { FiltroChips, type FiltroValue } from "./FiltroChips";
import { IntentoCard, type AccionCard } from "./IntentoCard";
import { IntentosTranquilos } from "./IntentosTranquilos";
import { Inspector } from "./Inspector";
import { Evidencia } from "./Evidencia";
import { ReplayWithSheet } from "./ReplayWithSheet";
import { ConfirmarAccionDialog } from "./ConfirmarAccionDialog";
import { avisoDe, type AccionMutante } from "./accionesCopy";

// FailedIntentsScreen es la consola de intentos fallidos.
//
// Lo que cambió respecto de la versión anterior y por qué:
//
//   • **Una tarjeta por venta o pago, no un renglón por intento.** Medido en
//     producción: 609 filas para 130 ventas. La pantalla vieja pintaba las
//     609 y era ilegible por construcción.
//   • **La estructura es la urgencia**, no el estado. Arriba lo que necesita
//     a una persona; abajo, en calma, lo que se está curando solo. La primera
//     pregunta de quien abre esto es "¿hay algo que hacer?".
//   • **Filtros como chips que acotan**, no una barra lateral que estructura:
//     la app ya tiene su barra y una segunda compite con ella.
//   • **Ventas y pagos mezclados.** El módulo es una etiqueta de cada
//     renglón; separarlos en pestañas obliga a mirar dos pantallas para
//     contestar una sola pregunta.
export function FailedIntentsScreen() {
  const [filtro, setFiltro] = useState<FiltroValue>("todo");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [accion, setAccion] = useState<AccionMutante | null>(null);
  const [objetivo, setObjetivo] = useState<IntentoAgrupado | null>(null);
  const [replayWithOpen, setReplayWithOpen] = useState(false);

  const lista = useIntentosAgrupados({
    status: estadoDelFiltro(filtro),
    pageSize: 50,
  });
  const detail = useFailedIntentDetail(selectedId);
  const replay = useReplayAction();
  const resolver = useResolverAction();

  const necesitanAccion = useMemo(
    () => porModulo(lista.necesitanAccion, filtro),
    [lista.necesitanAccion, filtro],
  );
  const seReintentan = useMemo(
    () => porModulo(lista.seReintentan, filtro),
    [lista.seReintentan, filtro],
  );

  const conteos = useMemo(() => {
    const todos = [...lista.necesitanAccion, ...lista.seReintentan];
    return {
      todo: todos.length,
      ventas: todos.filter((i) => i.modulo === "ventas").length,
      pagos: todos.filter((i) => i.modulo === "pagos").length,
    };
  }, [lista.necesitanAccion, lista.seReintentan]);

  useEffect(() => {
    if (lista.error) {
      toast.error(lista.error.message, {
        description: lista.error.code,
        id: `list-error-${lista.error.code}`,
      });
    }
  }, [lista.error]);

  // Resultado del reenvío → aviso en el verbo de la acción + refresco.
  useEffect(() => {
    if (replay.state.status === "success") {
      const r = replay.state.result;
      if (r.outcome.isSuccess()) {
        toast.success(avisoDe(accion ?? "reenviar"), {
          description: `El servidor respondió ${r.replayHttpStatus}`,
          id: `replay-ok-${selectedId}`,
        });
      } else {
        toast.warning("El reenvío volvió a fallar", {
          description: `El servidor respondió ${r.replayHttpStatus}`,
          id: `replay-fail-${selectedId}`,
        });
      }
      cerrarDialogos();
      detail.refresh();
      lista.refresh();
      replay.reset();
    } else if (replay.state.status === "error") {
      toast.error("No se pudo reenviar", {
        description: replay.state.error.message,
        id: `replay-err-${selectedId}`,
      });
      cerrarDialogos();
      replay.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay.state]);

  useEffect(() => {
    if (resolver.state.status === "success") {
      toast.success(avisoDe(accion ?? "atender"), {
        id: `resolver-ok-${selectedId}`,
      });
      cerrarDialogos();
      detail.setLocal(resolver.state.intent);
      lista.refresh();
      resolver.reset();
    } else if (resolver.state.status === "error") {
      toast.error("No se pudo cerrar el intento", {
        description: resolver.state.error.message,
        id: `resolver-err-${selectedId}`,
      });
      cerrarDialogos();
      resolver.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolver.state]);

  function cerrarDialogos() {
    setAccion(null);
    setObjetivo(null);
    setReplayWithOpen(false);
  }

  const seleccionar = useCallback((intento: IntentoAgrupado) => {
    setSelectedId(intento.id);
  }, []);

  // Toda acción que muta abre su diálogo. Ninguna se ejecuta al primer clic.
  const pedirConfirmacion = useCallback(
    (accionCard: AccionCard, intento: IntentoAgrupado) => {
      if (accionCard === "abrir") {
        setSelectedId(intento.id);
        return;
      }
      setObjetivo(intento);
      setAccion(accionCard === "reenviar" ? "reenviar" : "ignorar");
    },
    [],
  );

  const confirmar = useCallback(
    (cual: AccionMutante) => {
      if (!objetivo) return;
      switch (cual) {
        case "reenviar":
          void replay.replay(objetivo.id);
          return;
        case "atender":
          void resolver.resolve({
            intentId: objetivo.id,
            status: "resolved_manual",
            notes: "atendida desde la consola",
          });
          return;
        case "ignorar":
          void resolver.resolve({
            intentId: objetivo.id,
            status: "ignored",
            notes: "ignorada desde la consola",
          });
          return;
        case "reenviar_editado":
          setAccion(null);
          setReplayWithOpen(true);
          return;
      }
    },
    [objetivo, replay, resolver],
  );

  const pendiente =
    replay.state.status === "pending" || resolver.state.status === "pending";

  return (
    <div
      className="flex flex-col h-full bg-[#FBF9F6] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
      data-testid="failed-intents-screen"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(340px,372px)] flex-1 min-h-0">
        <main className="min-h-0 overflow-y-auto px-7 pt-6 pb-14 flex flex-col gap-7">
          <header className="flex flex-col gap-3.5">
            <div className="flex items-baseline gap-3.5 flex-wrap justify-between">
              <div className="flex items-baseline gap-3.5 flex-wrap">
                <h1 className="text-[26px] font-semibold tracking-tight">
                  Intentos fallidos
                </h1>
                <p
                  className="text-[13.5px] text-zinc-600 dark:text-zinc-400"
                  data-testid="veredicto"
                >
                  <b className="text-[#A33A2A] dark:text-[#E38B76] font-bold">
                    {frase(
                      necesitanAccion.length,
                      "necesita que alguien actúe",
                      "necesitan que alguien actúe",
                    )}
                  </b>
                  {" · "}
                  {frase(
                    seReintentan.length,
                    "se está reintentando sola",
                    "se están reintentando solas",
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={lista.refresh}
                disabled={lista.isLoading}
                className="gap-1.5"
                data-testid="refresh-button"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${lista.isLoading ? "animate-spin" : ""}`}
                />
                Actualizar
              </Button>
            </div>
            <FiltroChips value={filtro} conteos={conteos} onChange={setFiltro} />
          </header>

          <section>
            <EncabezadoZona
              titulo="Necesitan que alguien actúe"
              nota={String(necesitanAccion.length)}
            />
            {necesitanAccion.length === 0 ? (
              <p className="text-[13px] text-zinc-500 px-1" data-testid="accion-vacia">
                Nada pendiente de una persona
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {necesitanAccion.map((i) => (
                  <IntentoCard
                    key={i.clave}
                    intento={i}
                    seleccionado={selectedId === i.id}
                    onSeleccionar={seleccionar}
                    onAccion={pedirConfirmacion}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <EncabezadoZona
              titulo="Se están reintentando solas"
              nota={
                seReintentan.length === 0
                  ? "0"
                  : `${seReintentan.length} · nadie tiene que hacer nada`
              }
            />
            <IntentosTranquilos intentos={seReintentan} onSeleccionar={seleccionar} />
          </section>

          {lista.hasMore && (
            <button
              type="button"
              onClick={lista.loadNext}
              disabled={lista.isLoading}
              data-testid="cargar-mas"
              className="self-start text-[12.5px] px-3 py-1.5 rounded-sm border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {lista.isLoading ? "Cargando…" : "Cargar más"}
            </button>
          )}
        </main>

        <aside className="min-h-0 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Inspector
            intent={detail.intent}
            isLoading={detail.isLoading}
            errorMessage={detail.error?.message ?? null}
            onAction={(a) => {
              const intento = buscar(selectedId, necesitanAccion, seReintentan);
              if (!intento) return;
              setObjetivo(intento);
              if (a === "replay") setAccion("reenviar");
              else if (a === "resolve") setAccion("atender");
              else if (a === "replay-with") setAccion("reenviar_editado");
            }}
            onClose={() => setSelectedId(null)}
          />
          {detail.intent?.hasBlob && (
            <div className="px-5 pb-8">
              <h4 className="text-[10.5px] uppercase tracking-widest text-zinc-500 font-medium mb-2.5">
                Lo que fotografió el vendedor
              </h4>
              <Evidencia intentId={selectedId} />
            </div>
          )}
        </aside>
      </div>

      <ConfirmarAccionDialog
        accion={accion}
        intento={objetivo}
        pending={pendiente}
        onConfirm={confirmar}
        onCancel={cerrarDialogos}
      />

      <ReplayWithSheet
        intent={detail.intent}
        open={replayWithOpen}
        pending={replay.state.status === "pending"}
        onSubmitJson={(body) => {
          if (detail.intent) void replay.replayWith(detail.intent, body);
        }}
        onSubmitMultipart={(manifest, uploads) => {
          if (detail.intent) void replay.replayWithMultipart(detail.intent, manifest, uploads);
        }}
        onCancel={() => setReplayWithOpen(false)}
      />

      <Toaster richColors position="top-right" closeButton />
    </div>
  );
}

function EncabezadoZona({ titulo, nota }: { titulo: string; nota: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h2 className="text-[11.5px] uppercase tracking-widest text-zinc-600 dark:text-zinc-400 m-0">
        {titulo}
      </h2>
      <div aria-hidden="true" className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
      <span className="text-[11.5px] text-zinc-500">{nota}</span>
    </div>
  );
}

// frase evita el "1 necesitan" y el "1 intentos" que delatan una plantilla.
function frase(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

// estadoDelFiltro traduce el chip al filtro de estado del backend. Los chips
// de módulo no filtran en el servidor —el módulo se deriva de la ruta y el
// API no lo expone como parámetro—, así que se acotan en memoria; los de
// estado sí, porque `status` es un parámetro real de la lista.
function estadoDelFiltro(filtro: FiltroValue): IntentStatusValue | undefined {
  switch (filtro) {
    case "resueltas":
      return "resolved_manual";
    case "ignoradas":
      return "ignored";
    default:
      return "new";
  }
}

function porModulo(
  intentos: ReadonlyArray<IntentoAgrupado>,
  filtro: FiltroValue,
): ReadonlyArray<IntentoAgrupado> {
  if (filtro === "ventas") return intentos.filter((i) => i.modulo === "ventas");
  if (filtro === "pagos") return intentos.filter((i) => i.modulo === "pagos");
  return intentos;
}

function buscar(
  id: string | null,
  ...grupos: ReadonlyArray<ReadonlyArray<IntentoAgrupado>>
): IntentoAgrupado | null {
  if (!id) return null;
  for (const g of grupos) {
    const encontrado = g.find((i) => i.id === id);
    if (encontrado) return encontrado;
  }
  return null;
}
