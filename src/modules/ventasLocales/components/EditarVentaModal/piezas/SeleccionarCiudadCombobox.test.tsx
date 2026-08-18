import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  SeleccionarCiudadCombobox,
  type CiudadOpcion,
} from "./SeleccionarCiudadCombobox";

// Filas tomadas de la forma real del catálogo (CIUDADES + join a ESTADOS),
// incluida la basura que trae producción: acentos y espacio final.
const CATALOGO: CiudadOpcion[] = [
  { id: 338, nombre: "TEHUACÁN", estado: "PUEBLA" },
  { id: 341, nombre: "COYOMEAPAN", estado: "PUEBLA" },
  { id: 352, nombre: "SAN GABRIEL CHILAC", estado: "PUEBLA" },
  { id: 410, nombre: "ORIZABA", estado: "VERACRUZ" },
];

const abrir = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button"));
  return screen.findByPlaceholderText("Buscar ciudad...");
};

describe("SeleccionarCiudadCombobox", () => {
  it("muestra el placeholder cuando no hay ciudad capturada", () => {
    render(
      <SeleccionarCiudadCombobox value="" onChange={vi.fn()} ciudades={CATALOGO} />,
    );
    expect(screen.getByRole("button", { name: /Seleccionar ciudad/ })).toBeInTheDocument();
  });

  it("lista el catálogo completo al abrir", async () => {
    const user = userEvent.setup();
    render(
      <SeleccionarCiudadCombobox value="" onChange={vi.fn()} ciudades={CATALOGO} />,
    );
    await abrir(user);

    expect(screen.getByText("TEHUACÁN")).toBeInTheDocument();
    expect(screen.getByText("COYOMEAPAN")).toBeInTheDocument();
    expect(screen.getByText("SAN GABRIEL CHILAC")).toBeInTheDocument();
    expect(screen.getByText("ORIZABA")).toBeInTheDocument();
  });

  it("filtra al escribir, sin exigir acentos", async () => {
    const user = userEvent.setup();
    render(
      <SeleccionarCiudadCombobox value="" onChange={vi.fn()} ciudades={CATALOGO} />,
    );
    const input = await abrir(user);
    await user.type(input, "tehuacan");

    expect(screen.getByText("TEHUACÁN")).toBeInTheDocument();
    expect(screen.queryByText("ORIZABA")).not.toBeInTheDocument();
    expect(screen.queryByText("COYOMEAPAN")).not.toBeInTheDocument();
  });

  it("también filtra por estado", async () => {
    const user = userEvent.setup();
    render(
      <SeleccionarCiudadCombobox value="" onChange={vi.fn()} ciudades={CATALOGO} />,
    );
    const input = await abrir(user);
    await user.type(input, "veracruz");

    expect(screen.getByText("ORIZABA")).toBeInTheDocument();
    expect(screen.queryByText("TEHUACÁN")).not.toBeInTheDocument();
  });

  it("sin coincidencias avisa que la ciudad se da de alta en Microsip", async () => {
    const user = userEvent.setup();
    render(
      <SeleccionarCiudadCombobox value="" onChange={vi.fn()} ciudades={CATALOGO} />,
    );
    const input = await abrir(user);
    await user.type(input, "zzzz");

    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
    expect(screen.getByText("Créala en Microsip")).toBeInTheDocument();
  });

  it("no ofrece crear la ciudad ni una salida a texto libre", async () => {
    const user = userEvent.setup();
    render(
      <SeleccionarCiudadCombobox value="" onChange={vi.fn()} ciudades={CATALOGO} />,
    );
    const input = await abrir(user);
    await user.type(input, "zzzz");

    // Ni botón de alta, ni el escape a texto libre que sí tiene la app Android.
    expect(screen.queryByText(/Crear/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Agregar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mi ciudad no est/i)).not.toBeInTheDocument();
    // El único campo escribible es el buscador del combobox.
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(input).toHaveAttribute("placeholder", "Buscar ciudad...");
  });

  it("no ofrece vaciar la ciudad: el campo es obligatorio", async () => {
    const user = userEvent.setup();
    render(
      <SeleccionarCiudadCombobox
        value="TEHUACÁN"
        onChange={vi.fn()}
        ciudades={CATALOGO}
      />,
    );
    await abrir(user);

    expect(screen.queryByText(/Sin ciudad/i)).not.toBeInTheDocument();
  });

  it("al elegir una ciudad propaga el nombre del catálogo y cierra", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SeleccionarCiudadCombobox value="" onChange={onChange} ciudades={CATALOGO} />,
    );
    await abrir(user);
    await user.click(screen.getByText("ORIZABA"));

    expect(onChange).toHaveBeenCalledWith("ORIZABA");
    await waitFor(() =>
      expect(screen.queryByPlaceholderText("Buscar ciudad...")).not.toBeInTheDocument(),
    );
  });

  it("una dirección sin ciudad obliga a elegirla del catálogo", async () => {
    // Es el hueco real medido en Microsip: 120 direcciones con CIUDAD_ID NULL
    // (14 de clientes activos). Al editarlas hay que elegir una, y el campo
    // arranca vacío sin marcarse como no reconocido.
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <SeleccionarCiudadCombobox value="" onChange={onChange} ciudades={CATALOGO} />,
    );

    expect(screen.getByRole("button", { name: /Seleccionar ciudad/ })).toBeEnabled();
    expect(screen.queryByText("no reconocida")).not.toBeInTheDocument();

    await abrir(user);
    await user.click(screen.getByText("COYOMEAPAN"));
    expect(onChange).toHaveBeenCalledWith("COYOMEAPAN");

    rerender(
      <SeleccionarCiudadCombobox value="COYOMEAPAN" onChange={onChange} ciudades={CATALOGO} />,
    );
    expect(screen.getByRole("button", { name: /COYOMEAPAN/ })).toBeInTheDocument();
  });

  it("el estado se deriva de la ciudad elegida, nunca se elige aparte", async () => {
    const user = userEvent.setup();
    render(
      <SeleccionarCiudadCombobox value="ORIZABA" onChange={vi.fn()} ciudades={CATALOGO} />,
    );

    // El estado acompaña a la fila elegida: no hay control propio que permita
    // combinar la ciudad de un estado con el estado de otro.
    expect(screen.getByRole("button", { name: /ORIZABA VERACRUZ/ })).toBeInTheDocument();
    await abrir(user);
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });

  it("reconoce la ciudad guardada aunque difiera en acentos y espacios", () => {
    render(
      <SeleccionarCiudadCombobox
        value="tehuacan "
        onChange={vi.fn()}
        ciudades={CATALOGO}
      />,
    );

    // Se muestra el nombre canónico del catálogo, con su estado, sin marca.
    expect(screen.getByText("TEHUACÁN")).toBeInTheDocument();
    expect(screen.getByText("PUEBLA")).toBeInTheDocument();
    expect(screen.queryByText("no reconocida")).not.toBeInTheDocument();
  });

  it("conserva y marca la ciudad guardada que no está en el catálogo", () => {
    const onChange = vi.fn();
    render(
      <SeleccionarCiudadCombobox
        value="SAN JUAN DEL RIO"
        onChange={onChange}
        ciudades={CATALOGO}
      />,
    );

    expect(screen.getByText("SAN JUAN DEL RIO")).toBeInTheDocument();
    expect(screen.getByText("no reconocida")).toBeInTheDocument();
    // Nunca se reescribe el valor guardado por su cuenta.
    expect(onChange).not.toHaveBeenCalled();
  });

  it("no marca nada como no reconocido mientras el catálogo no ha cargado", () => {
    render(
      <SeleccionarCiudadCombobox
        value="SAN JUAN DEL RIO"
        onChange={vi.fn()}
        ciudades={[]}
        cargando
      />,
    );

    expect(screen.getByText("SAN JUAN DEL RIO")).toBeInTheDocument();
    expect(screen.queryByText("no reconocida")).not.toBeInTheDocument();
  });

  it("deshabilita el selector cuando el catálogo no está disponible", () => {
    render(
      <SeleccionarCiudadCombobox value="" onChange={vi.fn()} ciudades={[]} />,
    );

    const trigger = screen.getByRole("button", { name: /Catálogo no disponible/ });
    expect(trigger).toBeDisabled();
  });
});
