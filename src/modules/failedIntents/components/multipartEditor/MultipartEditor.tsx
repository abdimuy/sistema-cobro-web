import { useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileUp, Plus } from "lucide-react";

import type { FailedIntent, BlobPartsBundle } from "../../domain/entities";
import type { UseBlobPartsReturn } from "../../presentation/hooks/useBlobParts";
import type { UseMultipartEditState, NewPart } from "./useMultipartEditState";
import { PartCard } from "./PartCard";

export type MultipartEditorProps = {
  intent: FailedIntent;
  parts: UseBlobPartsReturn;
  edit: UseMultipartEditState;
};

// MultipartEditor renders the per-part edit cards plus a footer for
// brand-new parts the operator wants to attach. Pure presentation —
// the state itself lives in useMultipartEditState.
export function MultipartEditor({ parts, edit }: MultipartEditorProps) {
  if (parts.isLoading && !parts.bundle) {
    return <LoadingState />;
  }
  if (parts.error) {
    return <ErrorState message={parts.error.message} />;
  }
  if (!parts.bundle) {
    return <EmptyState />;
  }
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3" data-testid="multipart-editor">
        <BundleHeader bundle={parts.bundle} />

        {parts.bundle.parts.map((p) => (
          <PartCard
            key={p.index}
            part={p}
            action={edit.actions.get(p.index) ?? { kind: "keep" }}
            onAction={(next) => edit.setAction(p.index, next)}
            downloadPart={parts.downloadPart}
          />
        ))}

        <NewPartsSection edit={edit} />
        <AddNewPartFooter edit={edit} />
      </div>
    </ScrollArea>
  );
}

function BundleHeader({ bundle }: { bundle: BlobPartsBundle }) {
  return (
    <div className="rounded-md border border-zinc-200/60 dark:border-zinc-800/60 px-3 py-2 bg-zinc-50/50 dark:bg-zinc-900/30 text-[11px] text-zinc-500 font-mono break-all">
      {bundle.contentType}
    </div>
  );
}

function NewPartsSection({ edit }: { edit: UseMultipartEditState }) {
  if (edit.newParts.length === 0) return null;
  return (
    <>
      <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mt-4">
        Nuevos archivos
      </div>
      {edit.newParts.map((np) => (
        <NewPartCard key={np.id} np={np} edit={edit} />
      ))}
    </>
  );
}

function NewPartCard({
  np,
  edit,
}: {
  np: NewPart;
  edit: UseMultipartEditState;
}) {
  return (
    <article
      className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 px-3 py-2 space-y-1.5"
      data-testid={`new-part-${np.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          value={np.name}
          onChange={(e) => edit.updateNewPartName(np.id, e.target.value)}
          placeholder="nombre del campo"
          className="font-mono text-xs px-2 py-1 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 min-w-0 flex-1"
          data-testid={`new-part-name-${np.id}`}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => edit.removeNewPart(np.id)}
          className="h-7 text-xs text-red-600"
          data-testid={`new-part-remove-${np.id}`}
        >
          Quitar
        </Button>
      </div>
      {np.mode === "file" ? (
        <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
          {np.file.name} · {np.file.size} bytes · {np.file.type}
        </div>
      ) : (
        <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
          campo nuevo ({new TextDecoder().decode(np.value).slice(0, 60)}…)
        </div>
      )}
    </article>
  );
}

function AddNewPartFooter({ edit }: { edit: UseMultipartEditState }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-1.5 text-xs"
          data-testid="add-new-file-button"
        >
          <FileUp className="h-3 w-3" />
          Adjuntar archivo nuevo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            edit.addNewField("nuevo_campo", new TextEncoder().encode(""))
          }
          className="gap-1.5 text-xs"
          data-testid="add-new-field-button"
        >
          <Plus className="h-3 w-3" />
          Agregar campo
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) edit.addNewFile(f.name.replace(/\.[^.]+$/, ""), f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-6 flex flex-col items-center justify-center gap-2 text-red-700 dark:text-red-300">
      <AlertCircle className="h-6 w-6" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-6 text-center text-zinc-500 text-sm">
      Cargando partes del multipart…
    </div>
  );
}
