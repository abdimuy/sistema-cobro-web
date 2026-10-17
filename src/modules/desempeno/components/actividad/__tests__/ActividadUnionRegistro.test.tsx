import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActividadTab } from "../ActividadTab";
import { renderConDesempeno } from "../../../test/renderConDesempeno";
import { FakeDesempenoPort, makeActividadPago, makePaginaActividad, makeRegistradoPor, makeUsuarioTablero } from "../../../application/__tests__/fakeDesempenoPort";
import type { FiltrosActividad } from "../../../domain/entities";

const LUPITA = { usuarioUid: "uid-lupita", cobradorId: 11600, nombre: "GUADALUPE ROMERO NAVA", origen: "app" as const };
const OFICINA = { usuarioUid: null, cobradorId: null, nombre: "Oficina", origen: "oficina" as const };
const JUAN = makeRegistradoPor({ usuarioUid: "uid-juan", nombre: "JUAN CARLOS MENDEZ" });
const opciones = () => within(screen.getByLabelText("Registró")).getAllByRole("option").map((o) => o.textContent);

describe("Registró: unión de lo visto en la ficha", () => {
  it("con una persona elegida se puede pasar a otra sin volver a Todos", async () => {
    const user = userEvent.setup();
    const port = new FakeDesempenoPort();
    const todos = [JUAN, OFICINA, LUPITA];
    port.actividadResponse = () => {
      const f = port.actividadCalls[port.actividadCalls.length - 1]!.filtros as FiltrosActividad;
      const quien = f.registradoPor[0];
      const items = todos
        .filter((r) => !quien || (quien === "oficina" ? r.origen === "oficina" : r.usuarioUid === quien))
        .map((r, i) => makeActividadPago({ id: `pago:${i}`, registradoPor: r }));
      return makePaginaActividad({ items });
    };
    renderConDesempeno(<ActividadTab usuario={makeUsuarioTablero()} onAbrirActividad={() => {}} />, { port });
    await waitFor(() => expect(opciones()).toEqual(["Todos", "GUADALUPE ROMERO NAVA", "JUAN CARLOS MENDEZ", "Oficina"]));
    await user.selectOptions(screen.getByLabelText("Registró"), "uid-lupita");
    await waitFor(() => expect(port.actividadCalls[port.actividadCalls.length - 1]!.filtros.registradoPor).toEqual(["uid-lupita"]));
    expect(opciones()).toEqual(["Todos", "GUADALUPE ROMERO NAVA", "JUAN CARLOS MENDEZ", "Oficina"]);
    await user.selectOptions(screen.getByLabelText("Registró"), "uid-juan");
    await waitFor(() => expect(port.actividadCalls[port.actividadCalls.length - 1]!.filtros.registradoPor).toEqual(["uid-juan"]));
  });
});
