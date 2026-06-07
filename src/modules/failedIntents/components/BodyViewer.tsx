import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileWarning, Braces } from "lucide-react";
import type { FailedIntent } from "../domain/entities";

// BodyViewer renders the captured request body.
//   • Multipart intents (hasBlob === true): no JSON to show; we paint a
//     placeholder card describing the content-type so the operator
//     knows the body is on disk and replay-with is disabled.
//   • JSON intents: pretty-print with syntax-aware indentation. Wrapped
//     in a ScrollArea so a huge body doesn't blow the inspector layout.
export function BodyViewer({ intent }: { intent: FailedIntent }) {
  if (intent.hasBlob) {
    return (
      <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 dark:bg-violet-500/10 p-4">
        <div className="flex items-start gap-3">
          <FileWarning className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
          <div className="flex flex-col gap-1 min-w-0">
            <h4 className="text-sm font-semibold text-violet-900 dark:text-violet-200">
              Subida multipart
            </h4>
            <p className="text-xs text-violet-800/80 dark:text-violet-300/80">
              El body original se guardó en disco y se reenvía intacto al
              replayer.
            </p>
            {intent.bodyContentType && (
              <p className="text-xs font-mono mt-1 text-violet-900 dark:text-violet-200 break-all">
                {intent.bodyContentType}
              </p>
            )}
            <p className="text-[11px] mt-2 text-violet-700/70 dark:text-violet-400/70">
              No se puede editar el body — usá <strong>Replay tal cual</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <JsonBody body={intent.body} truncated={intent.bodyTruncated} />;
}

function JsonBody({ body, truncated }: { body: unknown; truncated: boolean }) {
  const pretty = useMemo(() => {
    if (body === null || body === undefined) return "null";
    try {
      return JSON.stringify(body, null, 2);
    } catch {
      return String(body);
    }
  }, [body]);

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Braces className="h-3 w-3" />
          <span>application/json</span>
        </div>
        {truncated && (
          <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
            truncado
          </span>
        )}
      </div>
      <ScrollArea className="max-h-[420px]">
        <pre className="px-4 py-3 text-xs font-mono leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-all">
          {pretty}
        </pre>
      </ScrollArea>
    </div>
  );
}
