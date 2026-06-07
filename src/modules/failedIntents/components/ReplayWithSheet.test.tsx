import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock catalog hooks so the embedded VentaReplayForm doesn't try to
// hit Firebase / the API when the body is venta-shaped.
vi.mock("@/hooks/useGetAlmacenes", () => ({
  __esModule: true,
  default: () => ({
    almacenes: [
      { ALMACEN_ID: 1, ALMACEN: "MATRIZ", EXISTENCIAS: 0 },
      { ALMACEN_ID: 2, ALMACEN: "BODEGA", EXISTENCIAS: 0 },
    ],
    getAlmacenById: () => undefined,
    loading: false,
    error: null,
    refetch: async () => {},
  }),
}));

vi.mock("@/hooks/useGetZonasCliente", () => ({
  __esModule: true,
  default: () => ({
    zonas: [{ ZONA_CLIENTE_ID: 4, ZONA_CLIENTE: "CENTRO" }],
    loading: false,
    error: null,
    getZonaById: () => undefined,
    refetch: async () => {},
  }),
}));

vi.mock("@/hooks/useGetVendedores", () => ({
  __esModule: true,
  default: () => ({
    vendedores: [],
    loading: false,
    error: null,
  }),
}));

import { ReplayWithSheet } from "./ReplayWithSheet";
import { makeFakeIntent, FakeRepoPort } from "../application/__tests__/fakeRepoPort";
import { FailedIntentsProvider } from "../presentation/context/FailedIntentsContext";
import { BlobPartKind } from "../domain/values/BlobPartKind";

function renderSheet(props: {
  intent: ReturnType<typeof makeFakeIntent>;
  port?: FakeRepoPort;
  pending?: boolean;
  onSubmitJson?: (body: unknown) => void;
  onSubmitMultipart?: (
    manifest: unknown,
    uploads: unknown,
  ) => void;
  onCancel?: () => void;
}) {
  const port = props.port ?? new FakeRepoPort();
  return render(
    <FailedIntentsProvider port={port}>
      <ReplayWithSheet
        intent={props.intent}
        open
        pending={props.pending ?? false}
        onSubmitJson={props.onSubmitJson ?? (() => {})}
        onSubmitMultipart={props.onSubmitMultipart ?? (() => {})}
        onCancel={props.onCancel ?? (() => {})}
      />
    </FailedIntentsProvider>,
  );
}

describe("ReplayWithSheet — JSON branch", () => {
  it("seeds the JSON view with the pretty-printed original body when the body is not venta-shaped", () => {
    const intent = makeFakeIntent({
      hasBlob: false,
      body: { cliente: "Carlos" },
    });
    renderSheet({ intent });
    const ta = screen.getByTestId(
      "venta-replay-form-json-textarea",
    ) as HTMLTextAreaElement;
    expect(JSON.parse(ta.value)).toEqual({ cliente: "Carlos" });
  });

  it("disables submit while the body is unchanged", () => {
    const intent = makeFakeIntent({
      hasBlob: false,
      body: { cliente: "Carlos" },
    });
    renderSheet({ intent });
    expect(screen.getByTestId("replay-with-submit")).toBeDisabled();
  });

  it("submits the parsed body via onSubmitJson when valid + dirty", async () => {
    const user = userEvent.setup();
    const onSubmitJson = vi.fn();
    const intent = makeFakeIntent({
      hasBlob: false,
      body: { cliente: "Carlos" },
    });
    renderSheet({ intent, onSubmitJson });

    const ta = screen.getByTestId(
      "venta-replay-form-json-textarea",
    ) as HTMLTextAreaElement;
    await user.clear(ta);
    await user.click(ta);
    await user.paste('{"cliente":"FIXED"}');

    const submit = screen.getByTestId("replay-with-submit");
    await waitFor(() => expect(submit).not.toBeDisabled());
    await user.click(submit);

    expect(onSubmitJson).toHaveBeenCalledWith({ cliente: "FIXED" });
  });

  it("renders the venta form (tabs + hero) when the body is venta-shaped", () => {
    const ventaBody = {
      id: "11111111-1111-1111-1111-111111111111",
      cliente: { cliente_id: 7, nombre: "CARLOS MENDEZ" },
      direccion: {
        calle: "AV X",
        colonia: "CENTRO",
        poblacion: "AGS",
        ciudad: "AGS",
      },
      gps: { latitud: 21.88, longitud: -102.29 },
      fecha_venta: "2026-06-06T10:00:00Z",
      tipo_venta: "CONTADO",
      montos: { anual: "1000.00", corto_plazo: "1000.00", contado: "1000.00" },
      combos: [],
      productos: [
        {
          id: "22222222-2222-2222-2222-222222222222",
          articulo_id: 100,
          articulo: "SILLA",
          cantidad: "1",
          precio_anual: "1000.00",
          precio_corto: "1000.00",
          precio_contado: "1000.00",
          combo_id: null,
          almacen_origen_id: 1,
          almacen_destino_id: 2,
        },
      ],
      vendedores: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          usuario_id: "44444444-4444-4444-4444-444444444444",
          email: "v@muebleriamsp.mx",
          nombre: "JUAN",
        },
      ],
    };
    const intent = makeFakeIntent({ hasBlob: false, body: ventaBody });
    renderSheet({ intent });

    expect(screen.getByTestId("venta-replay-form-hero")).toHaveTextContent(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByRole("tab", { name: /cliente/i })).toBeInTheDocument();
    expect(screen.queryByTestId("venta-replay-form-json-textarea")).toBeNull();
  });
});

describe("ReplayWithSheet — Multipart branch", () => {
  it("fetches blob parts and renders one card per original part", async () => {
    const port = new FakeRepoPort();
    port.getBlobPartsResponse = {
      contentType: "multipart/form-data; boundary=---x",
      parts: [
        {
          index: 0,
          name: "venta_json",
          kind: BlobPartKind.field(),
          contentType: "application/json",
          filename: null,
          sizeBytes: 4,
          value: new TextEncoder().encode("{}"),
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
      ],
    };
    const intent = makeFakeIntent({ hasBlob: true });

    renderSheet({ intent, port });
    await waitFor(() =>
      expect(screen.getByTestId("multipart-editor")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("part-card-0")).toBeInTheDocument();
    expect(screen.getByTestId("part-card-1")).toBeInTheDocument();
  });

  it("submit is disabled when no edits have been made", async () => {
    const port = new FakeRepoPort();
    port.getBlobPartsResponse = {
      contentType: "multipart/form-data; boundary=---x",
      parts: [
        {
          index: 0,
          name: "x",
          kind: BlobPartKind.field(),
          contentType: "text/plain",
          filename: null,
          sizeBytes: 1,
          value: new TextEncoder().encode("a"),
        },
      ],
    };
    const intent = makeFakeIntent({ hasBlob: true });
    renderSheet({ intent, port });
    await waitFor(() =>
      expect(screen.getByTestId("multipart-editor")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("replay-with-submit")).toBeDisabled();
  });

  it("removing a part enables submit and fires onSubmitMultipart with the right shape", async () => {
    const user = userEvent.setup();
    const onSubmitMultipart = vi.fn();
    const port = new FakeRepoPort();
    port.getBlobPartsResponse = {
      contentType: "multipart/form-data; boundary=---x",
      parts: [
        {
          index: 0,
          name: "keep_me",
          kind: BlobPartKind.field(),
          contentType: "text/plain",
          filename: null,
          sizeBytes: 1,
          value: new TextEncoder().encode("a"),
        },
        {
          index: 1,
          name: "drop_me",
          kind: BlobPartKind.file(),
          contentType: "image/jpeg",
          filename: "drop.jpg",
          sizeBytes: 100,
          value: null,
        },
      ],
    };
    const intent = makeFakeIntent({ hasBlob: true });
    renderSheet({ intent, port, onSubmitMultipart });
    await waitFor(() =>
      expect(screen.getByTestId("multipart-editor")).toBeInTheDocument(),
    );
    // Remove the second part.
    const removeButtons = screen.getAllByTestId("part-remove");
    await user.click(removeButtons[1]);

    const submit = screen.getByTestId("replay-with-submit");
    await waitFor(() => expect(submit).not.toBeDisabled());
    await user.click(submit);

    expect(onSubmitMultipart).toHaveBeenCalled();
    const [manifest, uploads] = onSubmitMultipart.mock.calls[0];
    expect(Array.isArray(manifest)).toBe(true);
    expect((manifest as Array<{ name: string }>).map((p) => p.name)).toEqual(["keep_me"]);
    expect(uploads).toBeInstanceOf(Map);
  });

  it("editing a text field switches its source to kind=field on submit", async () => {
    const user = userEvent.setup();
    const onSubmitMultipart = vi.fn();
    const port = new FakeRepoPort();
    port.getBlobPartsResponse = {
      contentType: "multipart/form-data; boundary=---x",
      parts: [
        {
          index: 0,
          name: "venta_json",
          kind: BlobPartKind.field(),
          contentType: "application/json",
          filename: null,
          sizeBytes: 6,
          value: new TextEncoder().encode(`{"a":1}`),
        },
      ],
    };
    const intent = makeFakeIntent({ hasBlob: true });
    renderSheet({ intent, port, onSubmitMultipart });
    await waitFor(() =>
      expect(screen.getByTestId("multipart-editor")).toBeInTheDocument(),
    );

    const ta = screen.getByTestId("part-field-textarea-0");
    await user.clear(ta);
    await user.click(ta);
    await user.paste("EDITED");

    await user.click(screen.getByTestId("replay-with-submit"));

    expect(onSubmitMultipart).toHaveBeenCalled();
    const [manifest] = onSubmitMultipart.mock.calls[0];
    expect((manifest as Array<{ source: { kind: string } }>)[0].source.kind).toBe(
      "field",
    );
  });

  it("renders the venta form inside the datos field when its body is venta-shaped", async () => {
    const ventaBody = {
      id: "11111111-1111-1111-1111-111111111111",
      cliente: { cliente_id: 7, nombre: "CARLOS MENDEZ" },
      direccion: {
        calle: "AV X",
        colonia: "CENTRO",
        poblacion: "AGS",
        ciudad: "AGS",
      },
      gps: { latitud: 21.88, longitud: -102.29 },
      fecha_venta: "2026-06-06T10:00:00Z",
      tipo_venta: "CONTADO",
      montos: { anual: "1000.00", corto_plazo: "1000.00", contado: "1000.00" },
      combos: [],
      productos: [
        {
          id: "22222222-2222-2222-2222-222222222222",
          articulo_id: 100,
          articulo: "SILLA",
          cantidad: "1",
          precio_anual: "1000.00",
          precio_corto: "1000.00",
          precio_contado: "1000.00",
          combo_id: null,
          almacen_origen_id: 1,
          almacen_destino_id: 2,
        },
      ],
      vendedores: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          usuario_id: "44444444-4444-4444-4444-444444444444",
          email: "v@muebleriamsp.mx",
          nombre: "JUAN",
        },
      ],
    };
    const port = new FakeRepoPort();
    port.getBlobPartsResponse = {
      contentType: "multipart/form-data; boundary=---x",
      parts: [
        {
          index: 0,
          name: "datos",
          kind: BlobPartKind.field(),
          contentType: "application/json",
          filename: null,
          sizeBytes: JSON.stringify(ventaBody).length,
          value: new TextEncoder().encode(JSON.stringify(ventaBody)),
        },
      ],
    };
    const intent = makeFakeIntent({ hasBlob: true });
    renderSheet({ intent, port });

    await waitFor(() =>
      expect(screen.getByTestId("multipart-editor")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("venta-replay-form-hero")).toHaveTextContent(
      "11111111-1111-1111-1111-111111111111",
    );
    // The regular textarea must NOT be present for the datos field.
    expect(screen.queryByTestId("part-field-textarea-0")).toBeNull();
  });

  it("falls back to the regular textarea when the datos field body is not venta-shaped", async () => {
    const port = new FakeRepoPort();
    port.getBlobPartsResponse = {
      contentType: "multipart/form-data; boundary=---x",
      parts: [
        {
          index: 0,
          name: "datos",
          kind: BlobPartKind.field(),
          contentType: "application/json",
          filename: null,
          sizeBytes: 14,
          value: new TextEncoder().encode(`{"not":"venta"}`),
        },
      ],
    };
    const intent = makeFakeIntent({ hasBlob: true });
    renderSheet({ intent, port });

    await waitFor(() =>
      expect(screen.getByTestId("multipart-editor")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("part-field-textarea-0")).toBeInTheDocument();
    expect(screen.queryByTestId("venta-replay-form-hero")).toBeNull();
  });
});
