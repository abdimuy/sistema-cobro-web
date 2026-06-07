import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  BlobPart,
  BlobPartsBundle,
  Manifest,
  ManifestPart,
  ManifestSource,
} from "../../domain/entities";
import type { UploadFile, UploadMap } from "../../application/dto";

// PartEditAction is the per-original-part state the operator selects via
// the multipart editor cards.
//
//   keep     → reuse the captured bytes via ManifestSource.keep
//   remove   → drop the part entirely (not emitted into the manifest)
//   field    → inline new text bytes; only valid for field parts
//   replace  → replace a file part's bytes with a fresh upload
export type PartEditAction =
  | { kind: "keep" }
  | { kind: "remove" }
  | { kind: "field"; value: Uint8Array }
  | { kind: "replace"; file: File };

// NewPart is what the operator adds via "Adjuntar archivo nuevo" — a
// brand-new entry that didn't exist in the captured blob.
export type NewPart =
  | { id: string; mode: "file"; name: string; file: File }
  | { id: string; mode: "field"; name: string; value: Uint8Array };

export type UseMultipartEditState = {
  // Per-original-part edit state, keyed by original part index.
  actions: ReadonlyMap<number, PartEditAction>;
  // Brand-new parts the operator added.
  newParts: ReadonlyArray<NewPart>;

  setAction: (index: number, action: PartEditAction) => void;
  addNewFile: (name: string, file: File) => void;
  addNewField: (name: string, value: Uint8Array) => void;
  removeNewPart: (id: string) => void;
  updateNewPartName: (id: string, name: string) => void;
  updateNewPartFieldValue: (id: string, value: Uint8Array) => void;

  // Computed view: true if any action != 'keep' or any new part exists.
  isDirty: boolean;

  // Build the wire-format manifest + UploadMap that the use case
  // expects. Returns null when the resulting body would be empty.
  build: () => { manifest: Manifest; uploads: UploadMap } | null;

  // Reset to all-keep / no-new-parts.
  reset: () => void;
};

// useMultipartEditState owns the multipart editor's mutable form state.
// Initialises every original part to `keep`; the operator changes them
// via the part cards.
export function useMultipartEditState(
  bundle: BlobPartsBundle | null,
): UseMultipartEditState {
  const [actions, setActions] = useState<ReadonlyMap<number, PartEditAction>>(
    new Map(),
  );
  const [newParts, setNewParts] = useState<ReadonlyArray<NewPart>>([]);

  // When the bundle loads, seed actions = 'keep' for every original part.
  useEffect(() => {
    if (!bundle) {
      setActions(new Map());
      setNewParts([]);
      return;
    }
    const seed = new Map<number, PartEditAction>();
    for (const p of bundle.parts) {
      seed.set(p.index, { kind: "keep" });
    }
    setActions(seed);
    setNewParts([]);
  }, [bundle]);

  const setAction = useCallback(
    (index: number, action: PartEditAction) => {
      setActions((prev) => {
        const next = new Map(prev);
        next.set(index, action);
        return next;
      });
    },
    [],
  );

  const addNewFile = useCallback((name: string, file: File) => {
    setNewParts((prev) => [
      ...prev,
      { id: makeId(), mode: "file", name, file },
    ]);
  }, []);

  const addNewField = useCallback((name: string, value: Uint8Array) => {
    setNewParts((prev) => [
      ...prev,
      { id: makeId(), mode: "field", name, value },
    ]);
  }, []);

  const removeNewPart = useCallback((id: string) => {
    setNewParts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateNewPartName = useCallback((id: string, name: string) => {
    setNewParts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p)),
    );
  }, []);

  const updateNewPartFieldValue = useCallback(
    (id: string, value: Uint8Array) => {
      setNewParts((prev) =>
        prev.map((p) =>
          p.id === id && p.mode === "field" ? { ...p, value } : p,
        ),
      );
    },
    [],
  );

  const isDirty = useMemo(() => {
    for (const a of actions.values()) {
      if (a.kind !== "keep") return true;
    }
    return newParts.length > 0;
  }, [actions, newParts]);

  const reset = useCallback(() => {
    if (!bundle) return;
    const seed = new Map<number, PartEditAction>();
    for (const p of bundle.parts) seed.set(p.index, { kind: "keep" });
    setActions(seed);
    setNewParts([]);
  }, [bundle]);

  const build = useCallback((): {
    manifest: Manifest;
    uploads: UploadMap;
  } | null => {
    if (!bundle) return null;
    const parts: ManifestPart[] = [];
    const uploads = new Map<string, UploadFile>();
    let uploadIndex = 0;

    for (const p of bundle.parts) {
      const action = actions.get(p.index) ?? { kind: "keep" };
      const built = manifestPartFor(p, action, () => {
        const key = `file_${uploadIndex++}`;
        return key;
      }, uploads);
      if (built) parts.push(built);
    }

    for (const np of newParts) {
      if (np.mode === "file") {
        const uploadField = `file_${uploadIndex++}`;
        uploads.set(uploadField, { file: np.file });
        parts.push({
          name: np.name,
          filename: np.file.name,
          source: { kind: "upload", uploadField },
        });
      } else {
        parts.push({
          name: np.name,
          source: { kind: "field", value: np.value },
        });
      }
    }

    if (parts.length === 0) return null;
    return { manifest: parts, uploads };
  }, [bundle, actions, newParts]);

  return {
    actions,
    newParts,
    setAction,
    addNewFile,
    addNewField,
    removeNewPart,
    updateNewPartName,
    updateNewPartFieldValue,
    isDirty,
    build,
    reset,
  };
}

// manifestPartFor converts a (BlobPart, PartEditAction) pair into a
// ManifestPart, or null when the action is "remove".
function manifestPartFor(
  p: BlobPart,
  action: PartEditAction,
  allocUploadField: () => string,
  uploads: Map<string, UploadFile>,
): ManifestPart | null {
  const baseName = p.name ?? "";
  switch (action.kind) {
    case "remove":
      return null;
    case "keep":
      return {
        name: baseName,
        contentType: p.contentType,
        filename: p.filename ?? undefined,
        source: { kind: "keep", originalIndex: p.index },
      };
    case "field":
      return {
        name: baseName,
        contentType: p.contentType,
        source: { kind: "field", value: action.value },
      };
    case "replace": {
      const uploadField = allocUploadField();
      uploads.set(uploadField, { file: action.file });
      return {
        name: baseName,
        filename: action.file.name,
        source: { kind: "upload", uploadField } satisfies ManifestSource,
      };
    }
  }
}

let idCounter = 0;
function makeId(): string {
  idCounter += 1;
  return `np_${idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}
