import { ConfiguracionContainer } from "./presentation/composition/ConfiguracionContainer";
import { ConfiguracionShell } from "./components/ConfiguracionShell";

// Module entry point. The router renders <Configuracion /> directly;
// ConfiguracionContainer wires up the HTTP adapter and provides it to the
// subtree via context so every hook reads the port from context — tests
// bypass this and use ConfiguracionProvider directly with a fake port.
export function Configuracion() {
  return (
    <ConfiguracionContainer>
      <ConfiguracionShell />
    </ConfiguracionContainer>
  );
}

export default Configuracion;
