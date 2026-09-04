import { useCallback, useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { IntentoAgrupado } from "../domain/entities";
import type { Manifest } from "../domain/entities/Manifest";
import type { UploadMap } from "../application/dto/UploadFile";
import type { IntentStatusValue } from "../domain/values";
import { useIntentosAgrupados } from "../presentation/hooks/useIntentosAgrupados";
import { useFailedIntentDetail } from "../presentation/hooks/useFailedIntentDetail";
import { useBlobParts } from "../presentation/hooks/useBlobParts";
import { useReplayAction } from "../presentation/hooks/useReplayAction";
import { useResolverAction } from "../presentation/hooks/useResolverAction";

import { FiltroChips, type FiltroValue } from "./FiltroChips";
import { IntentoCard, type AccionCard } from "./IntentoCard";
import { IntentosTranquilos } from "./IntentosTranquilos";
import { Inspector } from "./Inspector";
import { Evidencia } from "./Evidencia";
import { ReplayWithSheet } from "./ReplayWithSheet";
import { efectoDeAccionDelDetalle } from "./efectoDeAccionDelDetalle";

// EnvioEditado es lo que el editor compuso y todavía no se manda: se guarda
// entre "Guardar y reenviar" y el sí del diálogo. Las dos formas son las dos
// ramas del editor — cuerpo JSON puro, o multipart con su manifiesto.
type EnvioEditado =
  | { kind: "json"; body: unknown }
  | { kind: "multipart"; manifest: Manifest; uploads: UploadMap };
import { ConfirmarAccionDialog } from "./ConfirmarAccionDialog";
import { avisoDe, type AccionMutante } from "./accionesCopy";
import { LINEA, SUPERFICIE, TEXTO_2, ACENTO_TEXTO } from "./paleta";

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
//   • **La estructura es la del mock; el color, el de la app.** La paleta
//     cálida de papel del mock y sus titulares en serif NO se portaron: harían
//     que esta pantalla desentonara al llegar navegando desde Ventas o
//     Cartera. Lo que se conservó es la estructura, que es donde estaba su
//     valor. Ver `paleta.ts`.
//   • **El módulo se filtra en el SERVIDOR.** Los chips mandan `?modulo=`; ya
//     no se recorta en memoria la página recibida.
export function FailedIntentsScreen() {
  const [filtro, setFiltro] = useState<FiltroValue>("todo");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [accion, setAccion] = useState<AccionMutante | null>(null);
  const [objetivo, setObjetivo] = useState<IntentoAgrupado | null>(null);
  const [replayWithOpen, setReplayWithOpen] = useState(false);
  // El envío que el operador ya compuso en el editor y que espera
  // confirmación. Existe porque la confirmación va DESPUÉS de editar: sin
  // esto no habría qué reenviar cuando el diálogo dice que sí.
  const [envioEditado, setEnvioEditado] = useState<EnvioEditado | null>(null);

  const lista = useIntentosAgrupados({
    status: estadoDelFiltro(filtro),
    modulo: moduloDelFiltro(filtro),
    pageSize: 50,
  });
  const detail = useFailedIntentDetail(selectedId);
  // Las partes del cuerpo en disco se piden UNA vez por renglón abierto, aquí,
  // y se reparten entre las fotos y el visor del cuerpo. Con un hook en cada
  // componente serían dos peticiones por apertura — el mismo N+1 que la
  // pantalla evita en el listado, un nivel más abajo.
  //
  // Sólo se piden cuando el intento abierto TIENE cuerpo en disco: pasarle
  // null al hook lo deja inerte.
  const partes = useBlobParts(detail.intent?.hasBlob ? selectedId : null);
  const replay = useReplayAction();
  const resolver = useResolverAction();

  const necesitanAccion = lista.necesitanAccion;
  const seReintentan = lista.seReintentan;

  // Sólo el chip ACTIVO lleva número, y ese número es el de lo que la consulta
  // acaba de devolver.
  //
  // Antes se contaban los tres —todo, ventas y pagos— sobre la misma página,
  // porque el filtro de módulo se aplicaba en memoria. Ahora el filtro va al
  // servidor, así que la página sólo contiene el módulo activo: poner un
  // número en los otros chips sería inventarlo. Contarlos de verdad exige una
  // consulta por chip, y eso es exactamente el N+1 que esta pantalla evita.
  const conteos = useMemo(
    () => ({ [filtro]: necesitanAccion.length + seReintentan.length }),
    [filtro, necesitanAccion.length, seReintentan.length],
  );

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

  // Cierra todo: se usa cuando el reenvío terminó, bien o mal.
  function cerrarDialogos() {
    setAccion(null);
    setObjetivo(null);
    setEnvioEditado(null);
    setReplayWithOpen(false);
  }

  // Cancelar la confirmación deja el editor ABIERTO y conserva lo editado.
  // Cerrarlo aquí tiraría el trabajo del operador por arrepentirse del último
  // paso, que es justo cuando más caro sale.
  function cancelarConfirmacion() {
    setAccion(null);
    setObjetivo(null);
    setEnvioEditado(null);
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
      // `reenviar_editado` se resuelve aparte: no depende de `objetivo` sino
      // del intento abierto y del envío que el editor compuso.
      if (cual === "reenviar_editado") {
        const intento = detail.intent;
        if (!intento || !envioEditado) return;
        setAccion(null);
        if (envioEditado.kind === "json") {
          void replay.replayWith(intento, envioEditado.body);
        } else {
          void replay.replayWithMultipart(
            intento,
            envioEditado.manifest,
            envioEditado.uploads,
          );
        }
        return;
      }
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
      }
    },
    [objetivo, replay, resolver, detail.intent, envioEditado],
  );

  const pendiente =
    replay.state.status === "pending" || resolver.state.status === "pending";

  return (
    <div
      className="flex flex-col h-full bg-background text-foreground"
      data-testid="failed-intents-screen"
    >
      {/*
        La rejilla del mock es `60px / 1fr / 372px`, pero esa primera columna
        ES la barra que la app ya tiene —el propio mock la dibuja apagada y
        anota "esta pantalla NO trae otra"—. Dibujarla aquí crearía la segunda
        barra de navegación que el mock existe para evitar. Lo que sí se copia
        es el ancho del panel de detalle y que la columna central sea la que
        cede.
      */}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(340px,372px)] flex-1 min-h-0">
        <main className="min-h-0 overflow-y-auto px-7 pt-6 pb-14 flex flex-col gap-7">
          <header className="flex flex-col gap-3.5">
            <div className="flex items-baseline gap-3.5 flex-wrap justify-between">
              <div className="flex items-baseline gap-3.5 flex-wrap">
                <h1 className="text-[26px] font-semibold tracking-tight">
                  Intentos fallidos
                </h1>
                <p className={`text-[13.5px] ${TEXTO_2}`} data-testid="veredicto">
                  <b className={`${ACENTO_TEXTO} font-bold`}>
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
              <p className={`text-[13px] ${TEXTO_2} px-1`} data-testid="accion-vacia">
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
              className="self-start text-[12.5px] px-3 py-1.5 rounded-sm border border-input hover:bg-accent hover:text-accent-foreground"
            >
              {lista.isLoading ? "Cargando…" : "Cargar más"}
            </button>
          )}
        </main>

        <aside className={`min-h-0 overflow-y-auto border-l ${LINEA} ${SUPERFICIE}`}>
          <Inspector
            intent={detail.intent}
            isLoading={detail.isLoading}
            errorMessage={detail.error?.message ?? null}
            onAction={(a) => {
              const intento = buscar(selectedId, necesitanAccion, seReintentan);
              if (!intento) return;
              setObjetivo(intento);
              // La decisión vive en efectoDeAccionDelDetalle, que explica por
              // qué abrir el editor NO lleva diálogo y tiene prueba propia.
              const efecto = efectoDeAccionDelDetalle(a);
              if (efecto.tipo === "abrir_editor") setReplayWithOpen(true);
              else setAccion(efecto.accion);
            }}
            onClose={() => setSelectedId(null)}
            partesMultipart={partes.bundle?.parts}
            evidencia={
              <Evidencia
                intentId={selectedId}
                bundle={partes.bundle}
                isLoading={partes.isLoading}
                error={partes.error}
                downloadPart={partes.downloadPart}
              />
            }
          />
        </aside>
      </div>

      <ConfirmarAccionDialog
        accion={accion}
        intento={objetivo}
        pending={pendiente}
        onConfirm={confirmar}
        onCancel={cancelarConfirmacion}
      />

      <ReplayWithSheet
        intent={detail.intent}
        open={replayWithOpen}
        pending={replay.state.status === "pending"}
        onSubmitJson={(body) => {
          setEnvioEditado({ kind: "json", body });
          setAccion("reenviar_editado");
        }}
        onSubmitMultipart={(manifest, uploads) => {
          setEnvioEditado({ kind: "multipart", manifest, uploads });
          setAccion("reenviar_editado");
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
      <h2 className={`text-[11.5px] uppercase tracking-widest ${TEXTO_2} m-0`}>{titulo}</h2>
      <div aria-hidden="true" className="flex-1 h-px bg-border" />
      <span className={`text-[11.5px] ${TEXTO_2}`}>{nota}</span>
    </div>
  );
}

// frase evita el "1 necesitan" y el "1 intentos" que delatan una plantilla.
function frase(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

// estadoDelFiltro traduce el chip al filtro de estado del backend.
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

// moduloDelFiltro traduce el chip al parámetro `modulo` de la consulta.
//
// Desde la migración 000061 el módulo es una columna real e indexada, así que
// esto es SQL y no un recorte en memoria. La diferencia se nota justo cuando
// importa: con más de una página, filtrar en memoria mostraría sólo las ventas
// que cupieron en la primera y nada avisaría de las demás.
function moduloDelFiltro(filtro: FiltroValue): string | undefined {
  if (filtro === "ventas") return "ventas";
  if (filtro === "pagos") return "pagos";
  return undefined;
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
