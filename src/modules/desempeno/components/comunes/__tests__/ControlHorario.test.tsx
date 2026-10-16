import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DesempenoProvider } from "../../../presentation/context/DesempenoProvider";
import { FakeDesempenoPort } from "../../../application/__tests__/fakeDesempenoPort";
import { ControlHorario } from "../ControlHorario";
import { FINES_HORARIO, INICIOS_HORARIO, finTrasInicio } from "../../../presentation/opcionesHorario";
import { leerColumnasGuardadas } from "../../../presentation/actividadPreferencias";

describe("ControlHorario (D21)", () => {
  beforeEach(() => localStorage.clear());

  it("ofrece 00:00–23:00 de inicio y 00:30–23:30 más 23:59 de fin", () => {
    expect(INICIOS_HORARIO[0]).toBe("00:00");
    expect(INICIOS_HORARIO[INICIOS_HORARIO.length - 1]).toBe("23:00");
    expect(INICIOS_HORARIO).toHaveLength(47);
    expect(FINES_HORARIO[0]).toBe("00:30");
    expect(FINES_HORARIO[FINES_HORARIO.length - 2]).toBe("23:30");
    expect(FINES_HORARIO[FINES_HORARIO.length - 1]).toBe("23:59");
    expect(FINES_HORARIO).toHaveLength(48);
  });

  it("si el inicio queda en o después del fin, el fin se recorre a inicio + 1 h, máximo 23:59", () => {
    expect(finTrasInicio("18:00", "17:00")).toBe("19:00");
    expect(finTrasInicio("18:00", "18:00")).toBe("19:00");
    expect(finTrasInicio("23:00", "18:00")).toBe("23:59");
    expect(finTrasInicio("22:30", "18:00")).toBe("23:30");
    expect(finTrasInicio("08:00", "18:00")).toBe("18:00");
  });

  it("las preferencias guardadas siguen siendo opciones válidas", () => {
    for (const h of ["07:00", "07:30", "08:00", "08:30", "09:00"]) expect(INICIOS_HORARIO).toContain(h);
    for (const h of ["17:00", "17:30", "18:00", "18:30", "19:00"]) expect(FINES_HORARIO).toContain(h);
  });

  it("elegir un inicio posterior al fin recorre el fin en pantalla", async () => {
    render(
      <DesempenoProvider port={new FakeDesempenoPort()}>
        <ControlHorario />
      </DesempenoProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Horario" }));
    await userEvent.selectOptions(screen.getByLabelText("Inicio de horario"), "20:00");
    expect(screen.getByLabelText("Inicio de horario")).toHaveValue("20:00");
    expect(screen.getByLabelText("Fin de horario")).toHaveValue("21:00");
  });
});

describe("columnas de Actividad (D28)", () => {
  beforeEach(() => localStorage.clear());

  it("una lista v1 guardada sin nota gana nota una sola vez y se guarda en v2", () => {
    localStorage.setItem("desempeno.actividad.columnas.v1", JSON.stringify(["tipo", "hora", "cliente", "monto"]));
    expect(leerColumnasGuardadas(localStorage)).toEqual(["tipo", "hora", "cliente", "monto", "nota"]);
    expect(JSON.parse(localStorage.getItem("desempeno.actividad.columnas.v2")!)).toEqual(["tipo", "hora", "cliente", "monto", "nota"]);
  });

  it("si después la oculta, se respeta", () => {
    localStorage.setItem("desempeno.actividad.columnas.v1", JSON.stringify(["tipo", "hora"]));
    localStorage.setItem("desempeno.actividad.columnas.v2", JSON.stringify(["tipo", "hora"]));
    expect(leerColumnasGuardadas(localStorage)).toEqual(["tipo", "hora"]);
  });

  it("sin nada guardado usa las de por defecto", () => {
    expect(leerColumnasGuardadas(localStorage)).toBeNull();
  });

  it("una v1 con basura no restaura nada equivocado", () => {
    localStorage.setItem("desempeno.actividad.columnas.v1", JSON.stringify(["tipo", "inventada"]));
    expect(leerColumnasGuardadas(localStorage)).toBeNull();
    localStorage.setItem("desempeno.actividad.columnas.v1", "{no es json");
    expect(leerColumnasGuardadas(localStorage)).toBeNull();
  });

  it("un almacenamiento que lanza no tumba la lectura", () => {
    const roto = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("x"); } } as unknown as Storage;
    expect(leerColumnasGuardadas(roto)).toBeNull();
  });
});
