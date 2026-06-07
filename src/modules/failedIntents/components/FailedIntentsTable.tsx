import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CircleAlert, Inbox } from "lucide-react";

import type { FailedIntent } from "../domain/entities";
import { StatusBadge } from "./badges/StatusBadge";
import { IntentKindBadge } from "./badges/IntentKindBadge";

const formatTime = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const formatDate = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
});

export type FailedIntentsTableProps = {
  items: ReadonlyArray<FailedIntent>;
  selectedId: string | null;
  isLoading: boolean;
  hasMore: boolean;
  onSelect: (intent: FailedIntent) => void;
  onLoadMore: () => void;
};

export function FailedIntentsTable({
  items,
  selectedId,
  isLoading,
  hasMore,
  onSelect,
  onLoadMore,
}: FailedIntentsTableProps) {
  const rows = useMemo(() => items, [items]);

  if (!isLoading && rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-zinc-500 dark:text-zinc-400">
        <Inbox className="h-8 w-8 opacity-50" aria-hidden />
        <p className="text-sm">Sin intentos en esta vista</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Cambia el filtro para ver otros estados
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" data-testid="failed-intents-scroll">
      <Table>
        <TableHeader className="sticky top-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur z-10">
          <TableRow className="hover:bg-transparent border-zinc-200/60 dark:border-zinc-800/60">
            <TableHead className="w-[88px] text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
              Hora
            </TableHead>
            <TableHead className="w-[120px] text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
              Estado
            </TableHead>
            <TableHead className="w-[100px] text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
              Tipo
            </TableHead>
            <TableHead className="w-[80px] text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
              HTTP
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
              Error
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((intent) => (
            <FailedIntentRow
              key={intent.id}
              intent={intent}
              selected={intent.id === selectedId}
              onSelect={onSelect}
            />
          ))}

          {isLoading &&
            rows.length === 0 &&
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow
                key={`sk-${i}`}
                className="border-zinc-200/40 dark:border-zinc-800/40"
              >
                <TableCell colSpan={5}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))}

          {hasMore && (
            <TableRow className="hover:bg-transparent border-zinc-200/40 dark:border-zinc-800/40">
              <TableCell colSpan={5} className="text-center py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLoadMore}
                  disabled={isLoading}
                  className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                >
                  {isLoading ? "Cargando…" : "Cargar más"}
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

function FailedIntentRow({
  intent,
  selected,
  onSelect,
}: {
  intent: FailedIntent;
  selected: boolean;
  onSelect: (intent: FailedIntent) => void;
}) {
  return (
    <TableRow
      data-testid={`failed-intent-row-${intent.id}`}
      data-selected={selected}
      onClick={() => onSelect(intent)}
      className={cn(
        "cursor-pointer border-zinc-200/40 dark:border-zinc-800/40",
        "hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors",
        selected &&
          "bg-zinc-100/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-900",
      )}
    >
      <TableCell className="font-mono text-xs text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
        <div className="flex flex-col leading-tight">
          <span>{formatTime.format(intent.receivedAt)}</span>
          <span className="text-[10px] text-zinc-400">
            {formatDate.format(intent.receivedAt)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {intent.status.value === "new" && (
            <span
              className="relative flex h-2 w-2"
              aria-label="nuevo"
              data-testid="status-pulse"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          )}
          <StatusBadge status={intent.status} />
        </div>
      </TableCell>
      <TableCell>
        <IntentKindBadge hasBlob={intent.hasBlob} />
      </TableCell>
      <TableCell>
        <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300">
          {intent.httpStatus}
        </code>
      </TableCell>
      <TableCell className="text-sm">
        <div className="flex items-start gap-2 max-w-md">
          <CircleAlert className="h-3.5 w-3.5 text-zinc-400 mt-0.5 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {intent.errorCode ?? "error desconocido"}
            </span>
            {intent.errorMessage && (
              <span className="text-xs text-zinc-500 truncate">
                {intent.errorMessage}
              </span>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
