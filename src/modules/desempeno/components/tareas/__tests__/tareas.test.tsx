import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import {
  VENTA_TAREA,
  ZONA_TAREAS,
  errorTareaFechaPasada,
  errorSinPermisoTareas,
  listaTareasDTO,
  tareaCanceladaDTO,
  tareaConEstadoAtendidaDTO,
  tareaConEstadoPendienteDTO,
  tareaPendienteDTO,
} from "@/test/msw/fixtures/tareas";
import { HttpDesempenoAdapter } from "../../../infrastructure/http/HttpDesempenoAdapter";
import { DesempenoProvider } from "../../../presentation/context/DesempenoProvider";
import { AsignarVisitaDialog } from "../AsignarVisitaDialog";
import { ListaTareas } from "../ListaTareas";

// Visitas P3, Tarea 9: el escritorio asigna, edita (cancelar + asignar otra) y
// cancela visitas. Todo contra MSW con los fixtures del contrato de la Tarea 5
// (src/test/msw/fixtures/tareas.ts, que luego se reemplaza por los goldens).

const TAREAS = "*/v2/visitas/tareas";
const CANCELAR = "*/v2/visitas/tareas/:id/cancelar";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function adapter() {
  return new HttpDesempenoAdapter(axios.create({ baseURL: "http://api.test/v2" }));
}

function montar(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <DesempenoProvider port={adapter()}>{ui}</DesempenoProvider>
    </MemoryRouter>,
  );
}

type Cuerpo = Record<string, unknown>;

function capturarPosts(responder: (n: number) => Response | Promise<Response>) {
  const cuerpos: Cuerpo[] = [];
  server.use(
    http.post(TAREAS, async ({ request }) => {
      cuerpos.push((await request.json()) as Cuerpo);
      return responder(cuerpos.length);
    }),
  );
  return cuerpos;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AsignarVisitaDialog", () => {
  it("dobleClicNoCreaDosTareas: dos clics antes de que React repinte mandan un solo POST", async () => {
    let soltar: () => void = () => {};
    const espera = new Promise<void>((r) => {
      soltar = r;
    });
    const cuerpos = capturarPosts(async () => {
      await espera;
      return HttpResponse.json(tareaPendienteDTO, { status: 201 });
    });
    const onHecho = vi.fn();
    montar(<AsignarVisitaDialog ventaId={VENTA_TAREA} clienteNombre="María Guadalupe Hernández" onHecho={onHecho} onCerrar={vi.fn()} />);

    const boton = screen.getByRole("button", { name: "Asignar visita" });
    // Los dos clics en el mismo act: entre uno y otro no hay render, así que el
    // botón aún no está deshabilitado. Solo la guarda síncrona los detiene.
    act(() => {
      boton.click();
      boton.click();
    });
    await waitFor(() => expect(cuerpos).toHaveLength(1));
    soltar();
    await waitFor(() => expect(onHecho).toHaveBeenCalledTimes(1));
    expect(cuerpos).toHaveLength(1);
  });

  it("elIdSeGeneraAlAbrirNoAlEnviar: el reintento tras un error manda el mismo id", async () => {
    const user = userEvent.setup();
    const generar = vi.spyOn(crypto, "randomUUID");
    const cuerpos = capturarPosts((n) =>
      n === 1
        ? HttpResponse.json({ title: "Internal Server Error", status: 500, detail: "error del servidor" }, { status: 500 })
        : HttpResponse.json(tareaPendienteDTO, { status: 201 }),
    );
    const onHecho = vi.fn();
    montar(<AsignarVisitaDialog ventaId={VENTA_TAREA} clienteNombre="María Guadalupe Hernández" onHecho={onHecho} onCerrar={vi.fn()} />);
    // Al abrir ya existe el id: se generó una vez, antes de cualquier clic.
    expect(generar).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Asignar visita" }));
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Asignar visita" }));
    await waitFor(() => expect(onHecho).toHaveBeenCalledTimes(1));

    expect(cuerpos).toHaveLength(2);
    expect(cuerpos[0].id).toMatch(UUID);
    expect(cuerpos[1].id).toBe(cuerpos[0].id);
    expect(generar).toHaveBeenCalledTimes(1);
    expect(cuerpos[0].venta_id).toBe(VENTA_TAREA);
    expect(cuerpos[0].fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(cuerpos[0]).not.toHaveProperty("reemplaza_a");
  });

  it("fechaPasadaMuestraMensaje: tarea_fecha_pasada se dice en corto y no cierra", async () => {
    const user = userEvent.setup();
    capturarPosts(() => HttpResponse.json(errorTareaFechaPasada, { status: 422 }));
    const onHecho = vi.fn();
    montar(<AsignarVisitaDialog ventaId={VENTA_TAREA} clienteNombre="María Guadalupe Hernández" onHecho={onHecho} onCerrar={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Asignar visita" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("la fecha ya pasó");
    expect(onHecho).not.toHaveBeenCalled();
  });

  it("sin permiso: un 403 dice que no hay permiso", async () => {
    const user = userEvent.setup();
    capturarPosts(() => HttpResponse.json(errorSinPermisoTareas, { status: 403 }));
    montar(<AsignarVisitaDialog ventaId={VENTA_TAREA} clienteNombre="María Guadalupe Hernández" onHecho={vi.fn()} onCerrar={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Asignar visita" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no tienes permiso para asignar visitas");
  });

  it("hora y nota opcionales viajan solo si se llenan", async () => {
    const user = userEvent.setup();
    const cuerpos = capturarPosts(() => HttpResponse.json(tareaPendienteDTO, { status: 201 }));
    montar(<AsignarVisitaDialog ventaId={VENTA_TAREA} clienteNombre="María Guadalupe Hernández" onHecho={vi.fn()} onCerrar={vi.fn()} />);

    await user.type(screen.getByLabelText("hora"), "11:00");
    await user.type(screen.getByLabelText("nota"), "llevar estado de cuenta");
    await user.click(screen.getByRole("button", { name: "Asignar visita" }));
    await waitFor(() => expect(cuerpos).toHaveLength(1));
    expect(cuerpos[0].hora).toBe("11:00");
    expect(cuerpos[0].nota).toBe("llevar estado de cuenta");
  });
});

describe("ListaTareas", () => {
  function servirLista() {
    const urls: URL[] = [];
    server.use(
      http.get(TAREAS, ({ request }) => {
        urls.push(new URL(request.url));
        return HttpResponse.json(listaTareasDTO);
      }),
    );
    return urls;
  }

  it("listaPintaEstadoYQuienAtendio", async () => {
    const urls = servirLista();
    montar(<ListaTareas zonaId={ZONA_TAREAS} />);

    const filas = await screen.findAllByTestId("fila-tarea");
    expect(filas).toHaveLength(4);
    expect(urls[0].searchParams.get("zona_id")).toBe(String(ZONA_TAREAS));
    expect(within(filas[0]).getByText("pendiente")).toBeInTheDocument();
    expect(within(filas[1]).getByText("atendida por Juan Pérez a las 10:31")).toBeInTheDocument();
    expect(within(filas[2]).getByText("cancelada")).toBeInTheDocument();
    expect(within(filas[3]).getByText("no atendida")).toBeInTheDocument();
    // Solo la pendiente se puede editar o cancelar.
    expect(within(filas[0]).getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    for (const f of filas.slice(1)) {
      expect(within(f).queryByRole("button", { name: "Cancelar" })).toBeNull();
      expect(within(f).queryByRole("button", { name: "Editar" })).toBeNull();
    }
  });

  it("atendida sin nombre de cobrador dice solo la hora", async () => {
    server.use(
      http.get(TAREAS, () =>
        HttpResponse.json({
          items: [
            {
              ...tareaConEstadoAtendidaDTO,
              atendida_por: { ...tareaConEstadoAtendidaDTO.atendida_por!, cobrador_nombre: null },
            },
          ],
        }),
      ),
    );
    montar(<ListaTareas zonaId={ZONA_TAREAS} />);
    const [fila] = await screen.findAllByTestId("fila-tarea");
    expect(within(fila).getByText("atendida a las 10:31")).toBeInTheDocument();
  });

  it("cancelarRepetidoEsIgual: el servidor responde igual y la UI manda un solo POST", async () => {
    // Contrato: cancelar dos veces devuelve la misma tarea (200 igual).
    server.use(http.post(CANCELAR, () => HttpResponse.json(tareaCanceladaDTO)));
    const a = adapter();
    const primera = await a.cancelarTarea(tareaPendienteDTO.id);
    const segunda = await a.cancelarTarea(tareaPendienteDTO.id);
    expect(segunda).toEqual(primera);
    expect(primera.canceladaAt).toBe(tareaCanceladaDTO.cancelada_at);

    servirLista();
    const ids: string[] = [];
    server.use(
      http.post(CANCELAR, ({ params }) => {
        ids.push(String(params.id));
        return HttpResponse.json(tareaCanceladaDTO);
      }),
    );
    montar(<ListaTareas zonaId={ZONA_TAREAS} />);
    const filas = await screen.findAllByTestId("fila-tarea");
    const boton = within(filas[0]).getByRole("button", { name: "Cancelar" });
    act(() => {
      boton.click();
      boton.click();
    });
    await waitFor(() => expect(ids).toEqual([tareaPendienteDTO.id]));
    await new Promise((r) => setTimeout(r, 20));
    expect(ids).toHaveLength(1);
  });

  it("editarMandaReemplazaA: editar es cancelar + asignar otra con id nuevo", async () => {
    const user = userEvent.setup();
    servirLista();
    const cuerpos = capturarPosts(() => HttpResponse.json(tareaPendienteDTO, { status: 201 }));
    montar(<ListaTareas zonaId={ZONA_TAREAS} />);

    const filas = await screen.findAllByTestId("fila-tarea");
    await user.click(within(filas[0]).getByRole("button", { name: "Editar" }));
    const dialogo = await screen.findByRole("dialog");
    // La nota de la tarea que se reemplaza viene precargada.
    expect(within(dialogo).getByLabelText("nota")).toHaveValue(tareaConEstadoPendienteDTO.nota);
    await user.click(within(dialogo).getByRole("button", { name: "Asignar visita" }));

    await waitFor(() => expect(cuerpos).toHaveLength(1));
    expect(cuerpos[0].reemplaza_a).toBe(tareaPendienteDTO.id);
    expect(cuerpos[0].id).toMatch(UUID);
    expect(cuerpos[0].id).not.toBe(tareaPendienteDTO.id);
    expect(cuerpos[0].venta_id).toBe(tareaPendienteDTO.venta_id);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
