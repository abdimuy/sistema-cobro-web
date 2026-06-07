import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { FailedIntent } from "../domain/entities";
import { StatusBadge } from "./badges/StatusBadge";
import { IntentKindBadge } from "./badges/IntentKindBadge";
import { BodyViewer } from "./BodyViewer";

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
};

export function Inspector({
  intent,
  isLoading,
  errorMessage,
  onAction,
  onClose,
}: InspectorProps) {
  if (!intent && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
        <Inbox className="h-10 w-10 opacity-30" />
        <p className="text-sm">Seleccioná un intento</p>
        <p className="text-xs text-zinc-400">
          El detalle aparece acá
        </p>
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

  return (
    <div className="h-full flex flex-col">
      <InspectorHeader intent={intent} onClose={onClose} />

      {errorMessage && (
        <div className="mx-4 mb-3 rounded-md border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Tabs defaultValue="info" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 self-start bg-transparent gap-1 h-auto p-0 mb-2">
          <TabPill value="info" label="Info" />
          <TabPill value="body" label="Body" />
          <TabPill value="actions" label="Acciones" />
        </TabsList>

        <Separator className="mb-3" />

        <ScrollArea className="flex-1">
          <div className="px-4 pb-6">
            <TabsContent value="info" className="m-0">
              <InfoTab intent={intent} />
            </TabsContent>
            <TabsContent value="body" className="m-0">
              <BodyViewer intent={intent} />
            </TabsContent>
            <TabsContent value="actions" className="m-0">
              <ActionsTab intent={intent} onAction={onAction} />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function InspectorHeader({
  intent,
  onClose,
}: {
  intent: FailedIntent;
  onClose: () => void;
}) {
  return (
    <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight font-mono text-zinc-900 dark:text-zinc-100">
            {intent.method.value} {intent.path}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={intent.status} />
          <IntentKindBadge hasBlob={intent.hasBlob} />
          <code className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300">
            HTTP {intent.httpStatus}
          </code>
          {intent.errorCode && (
            <span className="text-xs text-zinc-500">· {intent.errorCode}</span>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          {DATE_FMT.format(intent.receivedAt)}
        </p>
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

function TabPill({ value, label }: { value: string; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="text-xs data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-50 dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900 rounded-full px-3 py-1"
    >
      {label}
    </TabsTrigger>
  );
}

function InfoTab({ intent }: { intent: FailedIntent }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <InfoRow label="Intent ID" value={intent.id} copyable />
      <InfoRow label="Request ID" value={intent.requestId} copyable />
      {intent.idempotencyKey && (
        <InfoRow
          label="Idempotency-Key"
          value={intent.idempotencyKey}
          copyable
        />
      )}
      {intent.usuarioId && (
        <InfoRow label="Vendedor (usuario_id)" value={intent.usuarioId} copyable />
      )}
      {intent.firebaseUid && (
        <InfoRow label="Firebase UID" value={intent.firebaseUid} copyable />
      )}
      <InfoRow label="Reintentos" value={String(intent.retryCount)} />
      {intent.errorMessage && (
        <InfoRow label="Mensaje" value={intent.errorMessage} multiline />
      )}
      {intent.resolvedAt && (
        <InfoRow
          label="Resuelto el"
          value={DATE_FMT.format(intent.resolvedAt)}
        />
      )}
      {intent.notes && <InfoRow label="Notas" value={intent.notes} multiline />}
    </div>
  );
}

function InfoRow({
  label,
  value,
  copyable,
  multiline,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-md border border-zinc-200/60 dark:border-zinc-800/60 px-3 py-2 bg-zinc-50/40 dark:bg-zinc-900/40">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
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
      <p
        className={cn(
          "text-xs text-zinc-900 dark:text-zinc-100 mt-0.5 break-all",
          copyable && "font-mono",
          multiline && "whitespace-pre-wrap",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ActionsTab({
  intent,
  onAction,
}: {
  intent: FailedIntent;
  onAction: (action: InspectorAction) => void;
}) {
  const replayWithDisabled = intent.hasBlob || intent.status.isTerminal();
  const replayDisabled = intent.status.isTerminal() && intent.status.value !== "retried_fail";
  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-2">
        <ActionCard
          icon={<RotateCw className="h-4 w-4" />}
          title="Replay tal cual"
          description="Reenvía el body original con una nueva idempotency-key"
          primary
          disabled={replayDisabled}
          onClick={() => onAction("replay")}
          tooltip={
            replayDisabled
              ? "Este intento ya está en estado terminal"
              : undefined
          }
        />
        <ActionCard
          icon={<Pencil className="h-4 w-4" />}
          title="Replay con correcciones"
          description={
            intent.hasBlob
              ? "No disponible para subidas multipart"
              : "Editá el body antes de reenviar"
          }
          disabled={replayWithDisabled}
          onClick={() => onAction("replay-with")}
          tooltip={
            intent.hasBlob
              ? "No se puede editar el body de un intento con archivos"
              : intent.status.isTerminal()
                ? "Este intento ya está en estado terminal"
                : undefined
          }
        />
        <ActionCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          title="Marcar como resuelto"
          description="Cerrar el intento sin reintentar"
          disabled={intent.status.isTerminal()}
          onClick={() => onAction("resolve")}
          tooltip={
            intent.status.isTerminal()
              ? "Este intento ya está en estado terminal"
              : undefined
          }
        />
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
        "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        primary
          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
      )}
    >
      <span
        className={cn(
          "mt-0.5",
          primary ? "" : "text-zinc-500",
        )}
      >
        {icon}
      </span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium">{title}</span>
        <span
          className={cn(
            "text-[11px]",
            primary
              ? "text-zinc-300 dark:text-zinc-600"
              : "text-zinc-500",
          )}
        >
          {description}
        </span>
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
