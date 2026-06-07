import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useMultipartEditState } from "./useMultipartEditState";
import { BlobPartKind } from "../../domain/values/BlobPartKind";
import type { BlobPartsBundle } from "../../domain/entities";

function makeBundle(): BlobPartsBundle {
  return {
    contentType: "multipart/form-data; boundary=---x",
    parts: [
      {
        index: 0,
        name: "venta_json",
        kind: BlobPartKind.field(),
        contentType: "application/json",
        filename: null,
        sizeBytes: 4,
        value: new Uint8Array([0x7b, 0x7d]),
      },
      {
        index: 1,
        name: "ine",
        kind: BlobPartKind.file(),
        contentType: "image/jpeg",
        filename: "ine.jpg",
        sizeBytes: 5000,
        value: null,
      },
      {
        index: 2,
        name: "evidencia",
        kind: BlobPartKind.file(),
        contentType: "image/png",
        filename: "firma.png",
        sizeBytes: 2000,
        value: null,
      },
    ],
  };
}

describe("useMultipartEditState", () => {
  it("seeds every original part to 'keep' on bundle load", () => {
    const bundle = makeBundle();
    const { result } = renderHook(() => useMultipartEditState(bundle));
    expect(result.current.actions.size).toBe(3);
    for (const a of result.current.actions.values()) {
      expect(a.kind).toBe("keep");
    }
    expect(result.current.isDirty).toBe(false);
  });

  it("build() with all keep produces a manifest mirroring the original", () => {
    const bundle = makeBundle();
    const { result } = renderHook(() => useMultipartEditState(bundle));
    const built = result.current.build();
    expect(built).not.toBeNull();
    expect(built!.manifest).toHaveLength(3);
    expect(built!.manifest[0].source).toEqual({
      kind: "keep",
      originalIndex: 0,
    });
    expect(built!.uploads.size).toBe(0);
  });

  it("setAction(remove) drops the part from the built manifest", () => {
    const bundle = makeBundle();
    const { result } = renderHook(() => useMultipartEditState(bundle));
    act(() => result.current.setAction(1, { kind: "remove" }));
    expect(result.current.isDirty).toBe(true);
    const built = result.current.build();
    expect(built!.manifest).toHaveLength(2);
    expect(built!.manifest.find((p) => p.name === "ine")).toBeUndefined();
  });

  it("setAction(field) inlines new bytes via kind=field", () => {
    const bundle = makeBundle();
    const { result } = renderHook(() => useMultipartEditState(bundle));
    const editedBytes = new TextEncoder().encode(`{"cliente":"FIXED"}`);
    act(() =>
      result.current.setAction(0, { kind: "field", value: editedBytes }),
    );
    const built = result.current.build();
    expect(built!.manifest[0].source).toEqual({
      kind: "field",
      value: editedBytes,
    });
  });

  it("setAction(replace) adds an upload entry and references it from the manifest", () => {
    const bundle = makeBundle();
    const { result } = renderHook(() => useMultipartEditState(bundle));
    const newFile = new File(["fresh"], "ine_v2.jpg", { type: "image/jpeg" });

    act(() => result.current.setAction(1, { kind: "replace", file: newFile }));

    const built = result.current.build();
    expect(built!.uploads.size).toBe(1);
    const inePart = built!.manifest.find((p) => p.name === "ine")!;
    expect(inePart.source.kind).toBe("upload");
    if (inePart.source.kind === "upload") {
      expect(built!.uploads.get(inePart.source.uploadField)?.file).toBe(newFile);
    }
  });

  it("addNewFile appends a fresh upload part", () => {
    const bundle = makeBundle();
    const { result } = renderHook(() => useMultipartEditState(bundle));
    const newFile = new File(["x"], "extra.pdf", { type: "application/pdf" });
    act(() => result.current.addNewFile("documento_extra", newFile));

    expect(result.current.newParts).toHaveLength(1);
    expect(result.current.isDirty).toBe(true);

    const built = result.current.build();
    expect(built!.manifest).toHaveLength(4);
    expect(built!.manifest[3].name).toBe("documento_extra");
    expect(built!.uploads.size).toBe(1);
  });

  it("removeNewPart removes by id", () => {
    const bundle = makeBundle();
    const { result } = renderHook(() => useMultipartEditState(bundle));
    act(() =>
      result.current.addNewFile("extra", new File(["x"], "x.pdf")),
    );
    const id = result.current.newParts[0].id;
    act(() => result.current.removeNewPart(id));
    expect(result.current.newParts).toHaveLength(0);
  });

  it("build() returns null when everything is removed", () => {
    const bundle = makeBundle();
    const { result } = renderHook(() => useMultipartEditState(bundle));
    for (let i = 0; i < 3; i++) {
      act(() => result.current.setAction(i, { kind: "remove" }));
    }
    expect(result.current.build()).toBeNull();
  });

  it("reset returns all original actions to keep and clears new parts", () => {
    const bundle = makeBundle();
    const { result } = renderHook(() => useMultipartEditState(bundle));
    act(() => result.current.setAction(0, { kind: "remove" }));
    act(() =>
      result.current.addNewFile("extra", new File([""], "x.pdf")),
    );
    expect(result.current.isDirty).toBe(true);
    act(() => result.current.reset());
    expect(result.current.isDirty).toBe(false);
    for (const a of result.current.actions.values()) {
      expect(a.kind).toBe("keep");
    }
  });

  it("inert when bundle is null", () => {
    const { result } = renderHook(() => useMultipartEditState(null));
    expect(result.current.actions.size).toBe(0);
    expect(result.current.build()).toBeNull();
  });
});
