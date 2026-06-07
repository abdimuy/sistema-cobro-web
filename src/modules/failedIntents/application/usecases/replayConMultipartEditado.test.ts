import { describe, expect, it } from "vitest";
import { replayConMultipartEditado } from "./replayConMultipartEditado";
import { FakeRepoPort, makeFakeIntent } from "../__tests__/fakeRepoPort";
import type { Manifest } from "../../domain/entities";
import type { UploadMap } from "../dto";
import { DomainError } from "../../domain/errors";

function makeManifest(parts: Manifest = []): Manifest {
  return parts;
}

function makeUploads(entries: Array<[string, File]> = []): UploadMap {
  return new Map(entries.map(([k, file]) => [k, { file }]));
}

function makeFile(name = "ine.jpg"): File {
  return new File(["bytes"], name, { type: "image/jpeg" });
}

describe("replayConMultipartEditado", () => {
  it("delegates to port.replayWithMultipart on the happy path", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ hasBlob: true });
    const manifest = makeManifest([
      {
        name: "venta_json",
        source: { kind: "field", value: new TextEncoder().encode("{}") },
      },
      {
        name: "ine",
        source: { kind: "upload", uploadField: "file_0" },
      },
    ]);
    const uploads = makeUploads([["file_0", makeFile()]]);

    const out = await replayConMultipartEditado(port, intent, manifest, uploads);

    expect(port.replayWithMultipartCalls).toHaveLength(1);
    const call = port.replayWithMultipartCalls[0];
    expect(call.intentId).toBe(intent.id);
    expect(call.manifest).toBe(manifest);
    expect(call.uploads).toBe(uploads);
    expect(out.outcome.isSuccess()).toBe(true);
  });

  it("rejects when intent.hasBlob is false (caller used wrong action)", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ hasBlob: false });
    const err = replayConMultipartEditado(
      port,
      intent,
      makeManifest([
        { name: "a", source: { kind: "field", value: new Uint8Array() } },
      ]),
      makeUploads(),
    );
    await expect(err).rejects.toMatchObject({ code: "intent_not_multipart" });
    expect(port.replayWithMultipartCalls).toHaveLength(0);
  });

  it("rejects empty manifest", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ hasBlob: true });
    const err = replayConMultipartEditado(
      port,
      intent,
      makeManifest(),
      makeUploads(),
    );
    await expect(err).rejects.toMatchObject({ code: "replay_manifest_empty" });
  });

  it("rejects manifest part without a name", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ hasBlob: true });
    const err = replayConMultipartEditado(
      port,
      intent,
      makeManifest([
        { name: "", source: { kind: "field", value: new Uint8Array() } },
      ]),
      makeUploads(),
    );
    await expect(err).rejects.toMatchObject({
      code: "manifest_part_name_required",
    });
  });

  it("rejects upload reference with empty upload_field", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ hasBlob: true });
    const err = replayConMultipartEditado(
      port,
      intent,
      makeManifest([
        { name: "x", source: { kind: "upload", uploadField: "" } },
      ]),
      makeUploads(),
    );
    await expect(err).rejects.toMatchObject({
      code: "manifest_upload_field_required",
    });
  });

  it("rejects upload reference whose file is missing from the map", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ hasBlob: true });
    const err = replayConMultipartEditado(
      port,
      intent,
      makeManifest([
        { name: "x", source: { kind: "upload", uploadField: "file_99" } },
      ]),
      makeUploads([["file_0", makeFile()]]),
    );
    await expect(err).rejects.toMatchObject({
      code: "manifest_upload_missing",
    });
  });

  it("rejects orphan uploads not referenced by the manifest", async () => {
    const port = new FakeRepoPort();
    const intent = makeFakeIntent({ hasBlob: true });
    const err = replayConMultipartEditado(
      port,
      intent,
      makeManifest([
        { name: "a", source: { kind: "field", value: new Uint8Array() } },
      ]),
      makeUploads([["file_orphan", makeFile()]]),
    );
    await expect(err).rejects.toMatchObject({
      code: "manifest_upload_orphan",
    });
    expect(port.replayWithMultipartCalls).toHaveLength(0);
  });

  it("propagates port errors", async () => {
    const port = new FakeRepoPort();
    const e = new DomainError(
      "failed_intent_status_conflict",
      "conflicto",
    );
    port.throwOnNext.replayWithMultipart = e;
    await expect(
      replayConMultipartEditado(
        port,
        makeFakeIntent({ hasBlob: true }),
        makeManifest([
          { name: "a", source: { kind: "field", value: new Uint8Array() } },
        ]),
        makeUploads(),
      ),
    ).rejects.toBe(e);
  });
});
