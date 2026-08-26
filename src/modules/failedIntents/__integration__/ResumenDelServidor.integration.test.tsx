import { describe, expect, it } from "vitest";
import axios from "axios";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { server } from "../../../test/msw/server";
import {
  ADMIN_BASE,
  failedIntentsHandlers,
} from "../../../test/msw/handlers/failedIntents";
import type { FailedIntentDTO } from "../infrastructure/mappers/dtoToFailedIntent";

import { FailedIntentsProvider } from "../presentation/context/FailedIntentsContext";
import { HttpFailedIntentRepoAdapter } from "../infrastructure/http/HttpFailedIntentRepoAdapter";
import { FailedIntentsScreen } from "../components/FailedIntentsScreen";

// Estas pruebas miden el arreglo de esta pantalla y la restricción de diseño
// que lo gobierna.
//
// El defecto: las diecinueve filas de ventas decían "Sin nombre capturado". No
// era la UI — el dato nunca llegaba. Una venta lleva fotos, o sea multipart, y
// en esa ruta el servidor guarda `body` vacío A PROPÓSITO (el cuerpo vive en
// disco). Deducir el nombre del cuerpo daba null siempre.
//
// La restricción: el listado se sirve de UNA consulta. Que exista
// `GET /{id}/blob-parts` no autoriza una petición por renglón — sería un N+1
// sobre el disco del servidor en la ruta más caliente de la pantalla. El
// resumen viaja en la fila; el blob se abre una vez, al abrir un renglón.

const TEST_BASE = "http://api.test/v2";

function montarPantalla() {
  const client = axios.create({ baseURL: TEST_BASE });
  const port = new HttpFailedIntentRepoAdapter(client);
  return render(
    <FailedIntentsProvider port={port}>
      <FailedIntentsScreen />
    </FailedIntentsProvider>,
  );
}

// ventaMultipart es la fila REAL que rompía la pantalla: cuerpo en disco,
// `body: null` en la fila, y el resumen que ahora manda el servidor.
function ventaMultipart(
  n: number,
  overrides: Partial<FailedIntentDTO> = {},
): FailedIntentDTO {
  const nn = String(n).padStart(2, "0");
  return {
    id: `aaaaaaaa-aaaa-aaaa-aaaa-0000000000${nn}`,
    received_at: `2026-08-19T13:${nn}:00.000Z`,
    method: "POST",
    path: "/v2/ventas",
    idempotency_key: `venta-${nn}`,
    request_id: `33333333-3333-3333-3333-0000000000${nn}`,
    // Esto es lo que de verdad llega en una captura multipart. No es un
    // descuido de la prueba: es el contrato.
    body: null,
    body_truncated: false,
    has_blob: true,
    body_content_type: "multipart/form-data; boundary=----X",
    http_status: 422,
    error_code: "articulo_sin_existencia",
    error_message: "sin existencia",
    retry_count: 0,
    status: "new",
    modulo: "ventas",
    resumen: { titulo: `Cliente ${nn}`, monto: "10300.00", referencia: `F-${nn}` },
    ...overrides,
  };
}

// contarBlobParts registra un espía sobre los dos endpoints del blob y
// devuelve el contador. Es el guardián de la restricción de diseño.
//
// **Va DESPUÉS de failedIntentsHandlers**, siempre: msw resuelve con el
// manejador registrado más recientemente, así que ponerlo antes lo dejaría
// tapado por el del paquete y el contador se quedaría en cero pasara lo que
// pasara. La prueba "pide el blob SÓLO al abrir un renglón" es el control
// positivo de este espía: si alguna vez deja de registrar, ESA falla.
function contarBlobParts(): { llamadas: string[] } {
  const registro = { llamadas: [] as string[] };
  server.use(
    http.get(`${ADMIN_BASE}/:id/blob-parts`, ({ params }) => {
      registro.llamadas.push(`blob-parts:${String(params.id)}`);
      return HttpResponse.json({ content_type: "multipart/form-data; boundary=X", parts: [] });
    }),
    http.get(`${ADMIN_BASE}/:id/blob-parts/:index/download`, ({ params }) => {
      registro.llamadas.push(`download:${String(params.id)}:${String(params.index)}`);
      return HttpResponse.text("bytes");
    }),
  );
  return registro;
}

describe("El resumen viaja en el listado", () => {
  it("pinta el nombre del cliente de una venta multipart, que es donde el dato se perdía", async () => {
    server.use(
      ...failedIntentsHandlers({
        list: { items: [ventaMultipart(1)], hasMore: false },
      }),
    );

    montarPantalla();

    await waitFor(() => expect(screen.getByText("Cliente 01")).toBeInTheDocument());
    // Y el monto, que salía "—" por lo mismo.
    expect(screen.getByText("$10,300.00")).toBeInTheDocument();
    expect(screen.queryByText(/sin nombre capturado/i)).toBeNull();
  });

  it("no dispara una sola petición de blob mientras nadie abre un renglón", async () => {
    const items = Array.from({ length: 20 }, (_, k) => ventaMultipart(k + 1));
    server.use(...failedIntentsHandlers({ list: { items, hasMore: false } }));
    const espia = contarBlobParts();

    montarPantalla();

    // Control positivo: la prueba sólo prueba algo si de verdad se pintaron
    // los veinte renglones. Sin esto, una pantalla que no renderiza nada
    // pasaría en verde afirmando "cero peticiones".
    await waitFor(() => expect(screen.getAllByTestId(/^intento-card-/)).toHaveLength(20));

    expect(espia.llamadas).toEqual([]);
  });

  it("pide el blob SÓLO al abrir un renglón, y sólo el de ese renglón", async () => {
    const items = [ventaMultipart(1), ventaMultipart(2), ventaMultipart(3)];
    server.use(
      ...failedIntentsHandlers({
        list: { items, hasMore: false },
        get: { byId: { [items[1].id]: items[1] } },
      }),
    );
    const espia = contarBlobParts();

    const user = userEvent.setup();
    montarPantalla();

    await waitFor(() => expect(screen.getAllByTestId(/^intento-card-/)).toHaveLength(3));
    expect(espia.llamadas).toEqual([]);

    await user.click(screen.getByTestId(`intento-abrir-${items[1].id}`));

    await waitFor(() => expect(espia.llamadas.length).toBeGreaterThan(0));
    // Una sola apertura, y del renglón que se abrió — no de los otros dos.
    expect(espia.llamadas).toEqual([`blob-parts:${items[1].id}`]);
  });
});

describe("El degradado cuando el servidor no manda resumen", () => {
  it("cae a leer el cuerpo cuando la fila es JSON y no trae resumen", async () => {
    const jsonSinResumen = ventaMultipart(1, {
      has_blob: false,
      body_content_type: undefined,
      modulo: undefined,
      resumen: undefined,
      body: {
        cliente: { nombre: "Nombre del cuerpo" },
        tipo_venta: "CREDITO",
        montos: { corto_plazo: "5500.00", anual: "0", contado: "0" },
      },
    });
    server.use(...failedIntentsHandlers({ list: { items: [jsonSinResumen], hasMore: false } }));

    montarPantalla();

    await waitFor(() =>
      expect(screen.getByText("Nombre del cuerpo")).toBeInTheDocument(),
    );
    expect(screen.getByText("$5,500.00")).toBeInTheDocument();
  });

  it("NO inventa un nombre cuando no hay ni resumen ni cuerpo legible", async () => {
    const sinNada = ventaMultipart(1, { modulo: undefined, resumen: undefined });
    server.use(...failedIntentsHandlers({ list: { items: [sinNada], hasMore: false } }));

    montarPantalla();

    // El hueco se declara. Esta pantalla existe para decidir si una venta
    // entró o no; un nombre inventado ahí es peor que admitir que no se sabe.
    await waitFor(() =>
      expect(screen.getByTestId(`intento-sin-nombre-${sinNada.id}`)).toBeInTheDocument(),
    );
    expect(screen.getByText("Sin nombre capturado")).toBeInTheDocument();
  });

  it("muestra la referencia cuando hay ancla pero no nombre", async () => {
    const soloReferencia = ventaMultipart(1, {
      resumen: { referencia: "F-0001" },
    });
    server.use(...failedIntentsHandlers({ list: { items: [soloReferencia], hasMore: false } }));

    montarPantalla();

    await waitFor(() =>
      expect(screen.getByTestId(`intento-referencia-${soloReferencia.id}`)).toBeInTheDocument(),
    );
    expect(screen.getByText("F-0001")).toBeInTheDocument();
    expect(screen.queryByText(/sin nombre capturado/i)).toBeNull();
  });

  it("degrada el módulo a deducirlo de la ruta cuando el servidor no lo manda", async () => {
    const sinModulo = ventaMultipart(1, { modulo: undefined });
    server.use(...failedIntentsHandlers({ list: { items: [sinModulo], hasMore: false } }));

    montarPantalla();

    await waitFor(() => expect(screen.getByText("Cliente 01")).toBeInTheDocument());
    // `/v2/ventas` sigue diciendo que es una venta.
    expect(screen.getByText("Venta")).toBeInTheDocument();
  });
});

describe("El filtro de módulo va al servidor", () => {
  it("manda ?modulo= al pulsar el chip, en vez de recortar la página en memoria", async () => {
    const consultas: Array<string | null> = [];
    server.use(
      ...failedIntentsHandlers({
        list: {
          items: [ventaMultipart(1)],
          hasMore: false,
          assertParams: (url) => consultas.push(url.searchParams.get("modulo")),
        },
      }),
    );

    const user = userEvent.setup();
    montarPantalla();

    await waitFor(() => expect(consultas.length).toBeGreaterThan(0));
    expect(consultas[0]).toBeNull();

    await user.click(screen.getByTestId("filtro-pagos"));
    await waitFor(() => expect(consultas).toContain("pagos"));

    await user.click(screen.getByTestId("filtro-ventas"));
    await waitFor(() => expect(consultas).toContain("ventas"));

    // Y al volver a "Todo" el parámetro desaparece: no se manda "todo" como
    // si fuera un módulo.
    await user.click(screen.getByTestId("filtro-todo"));
    await waitFor(() => expect(consultas.filter((c) => c === null).length).toBeGreaterThan(1));
  });
});

// base64Utf8 codifica como lo hace el servidor: bytes UTF-8 a base64.
//
// `btoa` a secas NO sirve: opera sobre unidades Latin-1, así que una "ó" sale
// como el byte 0xF3, que no es UTF-8 válido, y el visor —que decodifica UTF-8,
// como debe— la pinta como "�". Lo descubrió esta misma prueba. Un nombre de
// cliente mexicano trae acento casi siempre: si la cadena de codificación se
// rompiera de verdad, este helper es lo que hace que la prueba lo cace.
function base64Utf8(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario);
}

describe("El contenido del multipart se puede leer", () => {
  // El cuerpo de una venta con fotos no viene en la fila —vive en disco— pero
  // sus partes SÍ se pueden leer, y son las mismas que ya se piden para pintar
  // las fotos. Antes el panel sólo decía "Subida multipart" y para ver el JSON
  // de la venta había que entrar a "Editar y reenviar".
  const PARTES_CON_CONTENIDO = {
    content_type: "multipart/form-data; boundary=----X",
    parts: [
      {
        index: 0,
        name: "datos",
        kind: "field",
        content_type: "application/json",
        size_bytes: 96,
        // Sin sangría a propósito: el visor tiene que formatearlo.
        value: base64Utf8('{"cliente":{"nombre":"Carmen López"},"tipo_venta":"CREDITO"}'),
      },
      {
        index: 1,
        name: "origen",
        kind: "field",
        content_type: "text/plain",
        size_bytes: 11,
        value: base64Utf8("app-android"),
      },
      {
        index: 2,
        name: "imagen",
        kind: "file",
        content_type: "image/jpeg",
        filename: "ine.jpg",
        size_bytes: 864112,
      },
    ],
  };

  async function abrirDetalle() {
    const venta = ventaMultipart(1);
    server.use(
      ...failedIntentsHandlers({
        list: { items: [venta], hasMore: false },
        get: { byId: { [venta.id]: venta } },
        blobParts: { byId: { [venta.id]: PARTES_CON_CONTENIDO } },
        downloadBlobPart: {
          byKey: { [`${venta.id}:2`]: { bytes: "jpeg", contentType: "image/jpeg" } },
        },
      }),
    );
    const user = userEvent.setup();
    montarPantalla();
    await waitFor(() =>
      expect(screen.getByTestId(`intento-card-${venta.id}`)).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId(`intento-abrir-${venta.id}`));
    return venta;
  }

  it("muestra el JSON del campo `datos`, formateado", async () => {
    await abrirDetalle();

    const campo = await screen.findByTestId("multipart-campo-datos");
    // El nombre del cliente está ahí, legible y CON su acento, sin entrar a
    // editar. El acento no es cosmético: es la prueba de que los bytes del
    // campo se decodifican como UTF-8 de punta a punta.
    expect(campo).toHaveTextContent("Carmen López");
    expect(campo.textContent).not.toContain("\uFFFD");
    expect(campo).toHaveTextContent("CREDITO");
    // Y formateado: el JSON llegó en una línea y sale con saltos.
    expect(campo.querySelector("pre")?.textContent).toContain("\n");
  });

  it("muestra los campos que NO son JSON tal cual, sin fingir que lo son", async () => {
    await abrirDetalle();

    const campo = await screen.findByTestId("multipart-campo-origen");
    expect(campo).toHaveTextContent("app-android");
  });

  it("lista los archivos sin sus bytes", async () => {
    await abrirDetalle();

    const archivo = await screen.findByTestId("multipart-archivo-2");
    expect(archivo).toHaveTextContent("ine.jpg");
    expect(archivo).toHaveTextContent("image/jpeg");
    expect(archivo).toHaveTextContent("844 KB");
  });

  // La restricción, un nivel más abajo: leer el contenido NO puede costar una
  // segunda petición. Las fotos y el visor del cuerpo salen del mismo pedido.
  it("leer el contenido no añade una segunda petición de blob-parts", async () => {
    const venta = ventaMultipart(1);
    server.use(
      ...failedIntentsHandlers({
        list: { items: [venta], hasMore: false },
        get: { byId: { [venta.id]: venta } },
      }),
    );
    const espia = contarBlobParts();

    const user = userEvent.setup();
    montarPantalla();
    await waitFor(() =>
      expect(screen.getByTestId(`intento-card-${venta.id}`)).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId(`intento-abrir-${venta.id}`));

    await waitFor(() => expect(espia.llamadas.length).toBeGreaterThan(0));
    const pedidosDePartes = espia.llamadas.filter((l) => l.startsWith("blob-parts:"));
    expect(pedidosDePartes).toEqual([`blob-parts:${venta.id}`]);
  });
});

describe("El detalle enseña primero lo del negocio", () => {
  it("abre con el nombre y baja los identificadores a Datos técnicos", async () => {
    const venta = ventaMultipart(1);
    server.use(
      ...failedIntentsHandlers({
        list: { items: [venta], hasMore: false },
        get: { byId: { [venta.id]: venta } },
      }),
    );
    contarBlobParts();

    const user = userEvent.setup();
    montarPantalla();

    await waitFor(() => expect(screen.getByTestId(`intento-card-${venta.id}`)).toBeInTheDocument());
    await user.click(screen.getByTestId(`intento-abrir-${venta.id}`));

    await waitFor(() =>
      expect(screen.getByTestId("inspector-quien")).toHaveTextContent("Cliente 01"),
    );
    expect(screen.getByTestId("inspector-rotulo")).toHaveTextContent(/venta seleccionada/i);

    // Los campos técnicos NO se borraron: siguen ahí, dentro de la sección
    // plegada. Cuando algo se atora son con lo que se rastrea.
    const tecnicos = screen.getByTestId("datos-tecnicos");
    expect(tecnicos).toHaveTextContent(venta.request_id);
    expect(tecnicos).toHaveTextContent("POST /v2/ventas");
    // Y están PLEGADOS: lo que se les quitó es el primer lugar, no el sitio.
    expect(tecnicos).not.toHaveAttribute("open");
  });
});
