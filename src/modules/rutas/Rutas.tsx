import { RutasContainer } from "./presentation/composition/RutasContainer";
import { RutasScreen } from "./components/RutasScreen";

// Module entry point. The router renders <Rutas /> directly;
// RutasContainer wires up the HTTP adapter and provides it to the subtree
// via context so every hook reads the port from context — tests bypass this
// and use RutasProvider directly with a fake port.
export function Rutas() {
  return (
    <RutasContainer>
      <RutasScreen />
    </RutasContainer>
  );
}
