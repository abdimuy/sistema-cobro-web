import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RotateCw,
  Pencil,
  CheckCircle2,
  Copy,
  Inbox,
  X,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { BlobPart, FailedIntent } from "../domain/entities";
import { Causa, moduloDe } from "../domain/entities";
import { StatusBadge } from "./badges/StatusBadge";
import { IntentKindBadge } from "./badges/IntentKindBadge";
import { BodyViewer } from "./BodyViewer";
import { etiquetaModulo, pesos } from "./formato";
import { ACENTO_FOCO, LINEA, SUPERFICIE_2, TEXTO_2 } from "./paleta";

type InspectorAction = "replay" | "replay-with" | "resolve";

const DATE_FMT = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export type InspectorProps = {
  intent: FailedIntent | null;
  isLoading: boolean;
  errorMessage?: string | null;
  onAction: (action: InspectorAction) => void;
  onClose: () => void;
  // evidencia se inyecta desde la pantalla y se pinta ENTRE "qué pasó" y las
  // acciones, que es donde la pone el mock.
  //
  // Va por props y no importada aquí porque el componente de evidencia pide
  // sus partes por HTTP: dejarlo dentro del Inspector ataría el panel —que
  // hoy se puede renderizar con un intento suelto en cualquier prueba— a un
  // puerto vivo.
  evidencia?: React.ReactNode;
  // partesMultipart son las partes del cuerpo en disco, YA pedidas por la
  // pantalla para pintar las fotos. Llegan por props para que abrir un renglón
  // siga costando UNA sola petición de `blob-parts`.
  //
  // `undefined` significa "todavía no llegan"; un arreglo vacío, "llegaron y no
  // hay partes". Son cosas distintas y el visor las distingue.
  partesMultipart?: ReadonlyArray<BlobPart>;
};

// Inspector es el panel de detalle, y lo que cambió en él es QUÉ dice primero.
//
// Antes abría con `INTENT ID`, `REQUEST ID`, `IDEMPOTENCY-KEY` y `FIREBASE
// UID`: cuatro UUID antes de cualquier dato que una persona reconozca. Quien
// abre esta pantalla está preguntando "¿de quién es esta venta y qué le pasó?",
// y ninguno de esos cuatro campos lo contesta.
//
// Ahora arriba va lo del mock —quién, cuánto, qué pasó, en qué estado quedó— y
// los campos técnicos bajan a una sección plegada. **No se borran**: cuando
// algo se atora de verdad son con lo que se rastrea, y la sección está a un
// clic. Lo que se les quitó es el primer lugar, no el sitio.
//
// Las acciones dejaron de vivir detrás de una pestaña. Eran tres pestañas
// —Info, Body, Acciones— para un panel que cabe en una columna: la pestaña
// escondía el botón que la persona vino a apretar.
export function Inspector({
  intent,
  isLoading,
  errorMessage,
  onAction,
  onClose,
  evidencia,
  partesMultipart,
}: InspectorProps) {
  if (!intent && !isLoading) {
    return (
      <div className={`h-full flex flex-col items-center justify-center gap-2 ${TEXTO_2}`}>
        <Inbox className="h-10 w-10 opacity-30" />
        <p className="text-sm">Seleccioná un intento</p>
        <p className="text-xs opacity-70">El detalle aparece acá</p>
      </div>
    );
  }

  if (isLoading || !intent) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-32 w-full mt-4" />
      </div>
    );
  }

  // Sin `h-full` ni un ScrollArea propio: el panel entero es la columna que
  // scrollea (el <aside> de la pantalla). Con los dos, el Inspector ocupaba
  // toda la altura y empujaba la evidencia a un segundo scroll invisible —
  // las fotos quedaban debajo de "Datos técnicos" y de un hueco vacío.
  return (
    <div className="flex flex-col">
      <Encabezado intent={intent} onClose={onClose} />

      {errorMessage && (
        <div className="mx-5 mb-3 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="px-5 pb-6 flex flex-col gap-6">
        <DatosDelTrabajo intent={intent} />
        {intent.hasBlob && evidencia && (
          <div>
            <Rotulo>Lo que fotografió el vendedor</Rotulo>
            <div className="mt-2.5">{evidencia}</div>
          </div>
        )}
        <Acciones intent={intent} onAction={onAction} />
        <DatosTecnicos intent={intent} partes={partesMultipart} />
      </div>
    </div>
  );
}

// Encabezado abre con el nombre, no con el método y la ruta.
//
// El degradado es el mismo de la tarjeta: nombre → referencia → hueco
// declarado. Nunca un nombre inventado.
function Encabezado({ intent, onClose }: { intent: FailedIntent; onClose: () => void }) {
  const modulo = intent.modulo ?? moduloDe(intent.path);
  const titulo = intent.resumen?.titulo ?? null;
  const referencia = intent.resumen?.referencia ?? null;

  return (
    <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1.5 min-w-0">
        <h4
          className={`text-[10.5px] uppercase tracking-widest ${TEXTO_2} font-medium m-0`}
          data-testid="inspector-rotulo"
        >
          {etiquetaModulo(modulo)} seleccionad{modulo === "pagos" ? "o" : "a"}
        </h4>
        <p
          className={cn(
            "text-[19px] font-semibold tracking-tight m-0",
            !titulo && referencia && "font-mono",
            !titulo && !referencia && TEXTO_2,
          )}
          data-testid="inspector-quien"
        >
          {titulo ?? referencia ?? "Sin nombre capturado"}
        </p>
        {titulo && referencia && (
          <p className={`text-[12.5px] font-mono ${TEXTO_2} m-0`}>{referencia}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <StatusBadge status={intent.status} />
          <IntentKindBadge hasBlob={intent.hasBlob} />
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label="Cerrar"
        className="shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// DatosDelTrabajo es el bloque que el mock pone justo debajo del nombre: lo que
// una persona necesita para decidir, en el orden en que lo pregunta.
function DatosDelTrabajo({ intent }: { intent: FailedIntent }) {
  const causa = Causa.desde(intent.errorCode, intent.httpStatus);
  return (
    <div>
      <Rotulo>Qué pasó</Rotulo>
      <p className="text-[13.5px] mt-2 mb-3">{causa.titulo(intent.errorMessage)}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 text-[13px]">
        {intent.resumen?.monto != null && (
          <Fila termino="Monto" valor={pesos(intent.resumen.monto)} numerico />
        )}
        <Fila termino="Reintentos" valor={String(intent.retryCount)} numerico />
        <Fila termino="Primer intento" valor={DATE_FMT.format(intent.receivedAt)} />
        {intent.lastSeenAt && (
          <Fila termino="Último intento" valor={DATE_FMT.format(intent.lastSeenAt)} />
        )}
        {intent.resolvedAt && (
          <Fila termino="Cerrado el" valor={DATE_FMT.format(intent.resolvedAt)} />
        )}
      </dl>
      {intent.notes && (
        <p className={`text-[12.5px] ${TEXTO_2} mt-3 whitespace-pre-wrap`}>{intent.notes}</p>
      )}
    </div>
  );
}

function Fila({
  termino,
  valor,
  numerico = false,
}: {
  termino: string;
  valor: string;
  numerico?: boolean;
}) {
  return (
    <>
      <dt className={TEXTO_2}>{termino}</dt>
      <dd className={cn("m-0 text-right", numerico && "tabular-nums")}>{valor}</dd>
    </>
  );
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <h4 className={`text-[10.5px] uppercase tracking-widest ${TEXTO_2} font-medium m-0`}>
      {children}
    </h4>
  );
}

// DatosTecnicos es la sección plegada. Va en un <details> nativo a propósito:
// se abre sin JavaScript y el buscador del navegador encuentra lo de adentro
// aunque esté cerrado, que es justo lo que quiere quien está rastreando un
// request-id en producción.
function DatosTecnicos({
  intent,
  partes,
}: {
  intent: FailedIntent;
  partes?: ReadonlyArray<BlobPart>;
}) {
  return (
    <details className={`border-t ${LINEA} pt-4`} data-testid="datos-tecnicos">
      <summary
        className={`cursor-pointer list-none flex items-center gap-1.5 text-[10.5px] uppercase tracking-widest ${TEXTO_2} font-medium ${ACENTO_FOCO}`}
      >
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        Datos técnicos
      </summary>
      <div className="mt-3 flex flex-col gap-2.5">
        <Tecnico label="Petición" value={`${intent.method.value} ${intent.path}`} />
        <Tecnico label="HTTP" value={`HTTP ${intent.httpStatus}`} />
        {intent.errorCode && <Tecnico label="Código de error" value={intent.errorCode} />}
        <Tecnico label="Intent ID" value={intent.id} copyable />
        <Tecnico label="Request ID" value={intent.requestId} copyable />
        {intent.idempotencyKey && (
          <Tecnico label="Idempotency-Key" value={intent.idempotencyKey} copyable />
        )}
        {intent.usuarioId && (
          <Tecnico label="Vendedor (usuario_id)" value={intent.usuarioId} copyable />
        )}
        {intent.firebaseUid && <Tecnico label="Firebase UID" value={intent.firebaseUid} copyable />}
        {intent.modulo && <Tecnico label="Módulo (servidor)" value={intent.modulo} />}
        <div className="mt-1">
          <BodyViewer intent={intent} partes={partes} />
        </div>
      </div>
    </details>
  );
}

function Tecnico({
  label,
  value,
  copyable,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className={`rounded-sm border ${LINEA} px-3 py-2 ${SUPERFICIE_2}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] uppercase tracking-wider ${TEXTO_2} font-medium`}>
          {label}
        </span>
        {copyable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-1.5"
            onClick={() => void navigator.clipboard?.writeText(value)}
            aria-label={`Copiar ${label}`}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
      <p className={cn("text-xs mt-0.5 break-all", copyable && "font-mono")}>{value}</p>
    </div>
  );
}

function Acciones({
  intent,
  onAction,
}: {
  intent: FailedIntent;
  onAction: (action: InspectorAction) => void;
}) {
  // Bloqueo de acciones por estado del intent:
  //
  //   • new           → todo habilitado (la venta requiere atención).
  //   • retried_fail  → ambos reenvíos habilitados; marcar resuelto NO
  //                     (el backend exige status=new para Resolver).
  //   • retried_ok    → todo deshabilitado (la venta ya se guardó: otro
  //                     reenvío crearía una venta duplicada porque la
  //                     idempotency-key del replay es fresca cada vez).
  //   • resolved_manual / ignored → todo deshabilitado (el operador ya
  //                                  cerró el intent explícitamente).
  //
  // La distinción crítica: retried_fail SIGUE permitiendo reenvíos
  // porque la venta NO se guardó; el intent está esperando otro intento.
  // Los demás estados terminales son "cerrados con éxito o por decisión
  // del admin" y un nuevo reenvío crearía data duplicada / no deseada.
  const status = intent.status.value;
  const closedSuccessfully =
    status === "retried_ok" || status === "resolved_manual" || status === "ignored";
  const replayDisabled = closedSuccessfully;
  const replayWithDisabled = closedSuccessfully;
  const resolveDisabled = intent.status.isTerminal();
  const closedTooltip =
    "Este intento ya está cerrado — un nuevo reenvío crearía data duplicada";
  return (
    <TooltipProvider delayDuration={200}>
      <div>
        <Rotulo>Qué se puede hacer</Rotulo>
        <div className="space-y-2 mt-2.5">
          <ActionCard
            icon={<RotateCw className="h-4 w-4" />}
            title="Reenviar sin cambios"
            description="Reenvía el body original con una nueva idempotency-key"
            primary
            disabled={replayDisabled}
            onClick={() => onAction("replay")}
            tooltip={replayDisabled ? closedTooltip : undefined}
          />
          <ActionCard
            icon={<Pencil className="h-4 w-4" />}
            title="Editar y reenviar"
            description={
              intent.hasBlob
                ? "Editá las partes del multipart (campos + archivos) antes de reenviar"
                : "Editá el body JSON antes de reenviar"
            }
            disabled={replayWithDisabled}
            onClick={() => onAction("replay-with")}
            tooltip={replayWithDisabled ? closedTooltip : undefined}
          />
          <ActionCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="Marcar como resuelto"
            description="Cerrar el intento sin reintentar"
            disabled={resolveDisabled}
            onClick={() => onAction("resolve")}
            tooltip={resolveDisabled ? "Este intento ya está cerrado" : undefined}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

function ActionCard({
  icon,
  title,
  description,
  primary,
  disabled,
  tooltip,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  primary?: boolean;
  disabled?: boolean;
  tooltip?: string;
  onClick: () => void;
}) {
  const button = (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-testid={`action-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-sm border text-left transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        primary
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          : `${LINEA} hover:bg-accent hover:text-accent-foreground`,
      )}
    >
      <span className={cn("mt-0.5", primary ? "" : TEXTO_2)}>{icon}</span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium">{title}</span>
        <span className={cn("text-[11px]", primary ? "opacity-70" : TEXTO_2)}>{description}</span>
      </span>
    </button>
  );

  if (!tooltip) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>{button}</div>
      </TooltipTrigger>
      <TooltipContent side="left">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
