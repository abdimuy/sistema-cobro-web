import { useCallback, useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { ListFilter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { FailedIntent } from "../domain/entities";
import type { IntentStatusValue } from "../domain/values";
import { useFailedIntentsList } from "../presentation/hooks/useFailedIntentsList";
import { useFailedIntentDetail } from "../presentation/hooks/useFailedIntentDetail";
import { useReplayAction } from "../presentation/hooks/useReplayAction";
import { useResolverAction } from "../presentation/hooks/useResolverAction";

import { StatusFilter, type StatusFilterValue } from "./StatusFilter";
import { FailedIntentsTable } from "./FailedIntentsTable";
import { Inspector } from "./Inspector";
import { ReplayConfirmDialog } from "./ReplayConfirmDialog";
import { ResolverDialog } from "./ResolverDialog";

// FailedIntentsScreen is the composed admin screen — the dueño opens
// this from the sidebar. It owns:
//
//   • The status filter and pagination state (delegated to
//     useFailedIntentsList).
//   • Which intent is selected (drives the inspector).
//   • Which dialog is open (replay confirm, resolver).
//   • Outcome toasts via sonner.
//
// The composition root (FailedIntentsContainer) wraps this with the
// FailedIntentsProvider so every hook reads the port from context.
export function FailedIntentsScreen() {
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("new");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replayConfirmOpen, setReplayConfirmOpen] = useState(false);
  const [resolverOpen, setResolverOpen] = useState(false);

  const listStatus = statusFilter === "all" ? undefined : statusFilter;
  const list = useFailedIntentsList({
    status: listStatus as IntentStatusValue | undefined,
    pageSize: 30,
  });

  const detail = useFailedIntentDetail(selectedId);
  const replay = useReplayAction();
  const resolver = useResolverAction();

  // Surface list-level errors via toast (we don't want the screen to
  // crash if the list endpoint 500s).
  useEffect(() => {
    if (list.error) {
      toast.error(list.error.message, {
        description: list.error.code,
        id: `list-error-${list.error.code}`,
      });
    }
  }, [list.error]);

  // Replay outcome → toast + refresh + drop the local error.
  useEffect(() => {
    if (replay.state.status === "success") {
      const r = replay.state.result;
      if (r.outcome.isSuccess()) {
        toast.success("Replay exitoso", {
          description: `Status ${r.replayHttpStatus} — la venta se creó`,
          id: `replay-ok-${selectedId}`,
        });
      } else {
        toast.warning("El replay falló", {
          description: `Status ${r.replayHttpStatus} — revisá el body antes de reintentar`,
          id: `replay-fail-${selectedId}`,
        });
      }
      setReplayConfirmOpen(false);
      detail.refresh();
      list.refresh();
      replay.reset();
    } else if (replay.state.status === "error") {
      toast.error("No se pudo replayer", {
        description: replay.state.error.message,
        id: `replay-err-${selectedId}`,
      });
      setReplayConfirmOpen(false);
      replay.reset();
    }
    // intentionally narrow deps — these flags only change once per request
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay.state]);

  // Resolve outcome → toast + refresh.
  useEffect(() => {
    if (resolver.state.status === "success") {
      toast.success("Intento resuelto", {
        description: `Estado: ${resolver.state.intent.status.value}`,
        id: `resolver-ok-${selectedId}`,
      });
      setResolverOpen(false);
      detail.setLocal(resolver.state.intent);
      list.refresh();
      resolver.reset();
    } else if (resolver.state.status === "error") {
      toast.error("No se pudo resolver", {
        description: resolver.state.error.message,
        id: `resolver-err-${selectedId}`,
      });
      resolver.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolver.state]);

  const handleSelect = useCallback((intent: FailedIntent) => {
    setSelectedId(intent.id);
  }, []);

  const handleAction = useCallback(
    (action: "replay" | "replay-with" | "resolve") => {
      if (!detail.intent) return;
      if (action === "replay") setReplayConfirmOpen(true);
      else if (action === "resolve") setResolverOpen(true);
      else if (action === "replay-with") {
        toast.info("Próximamente", {
          description: "El editor estructurado se habilita en la próxima entrega",
          id: "replay-with-coming-soon",
        });
      }
    },
    [detail.intent],
  );

  const newCount = useMemo(
    () =>
      list.items.filter((i) => i.status.value === "new").length +
      (list.hasMore && statusFilter === "new" ? "+" : ""),
    [list.items, list.hasMore, statusFilter],
  );

  return (
    <div
      className="flex flex-col h-full bg-white dark:bg-zinc-950"
      data-testid="failed-intents-screen"
    >
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Ventas fallidas
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Intentos de venta que el servidor capturó por error de validación,
            conflicto de idempotencia o caída.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {statusFilter === "new" && list.items.length > 0 && (
            <span className="text-xs text-red-600 dark:text-red-400 font-medium tabular-nums">
              {newCount} nuevos
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={list.refresh}
            disabled={list.isLoading}
            className="gap-1.5"
            data-testid="refresh-button"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${list.isLoading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>
      </header>

      <div className="px-6 py-3 flex items-center gap-3 border-b border-zinc-200/70 dark:border-zinc-800/70">
        <ListFilter className="h-3.5 w-3.5 text-zinc-400" />
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(380px,460px)] flex-1 min-h-0">
        <div className="border-r border-zinc-200 dark:border-zinc-800 min-h-0">
          <FailedIntentsTable
            items={list.items}
            selectedId={selectedId}
            isLoading={list.isLoading}
            hasMore={list.hasMore}
            onSelect={handleSelect}
            onLoadMore={list.loadNext}
          />
        </div>
        <aside className="min-h-0 bg-zinc-50/50 dark:bg-zinc-900/20">
          <Inspector
            intent={detail.intent}
            isLoading={detail.isLoading}
            errorMessage={detail.error?.message ?? null}
            onAction={handleAction}
            onClose={() => setSelectedId(null)}
          />
        </aside>
      </div>

      <ReplayConfirmDialog
        open={replayConfirmOpen}
        pending={replay.state.status === "pending"}
        onConfirm={() => {
          if (selectedId) void replay.replay(selectedId);
        }}
        onCancel={() => setReplayConfirmOpen(false)}
      />

      <ResolverDialog
        open={resolverOpen}
        pending={resolver.state.status === "pending"}
        onSubmit={({ status, notes }) => {
          if (selectedId) void resolver.resolve({ intentId: selectedId, status, notes });
        }}
        onCancel={() => setResolverOpen(false)}
      />

      <Toaster richColors position="top-right" closeButton />
    </div>
  );
}
