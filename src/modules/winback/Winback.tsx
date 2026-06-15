import { WinbackContainer } from "./presentation/composition/WinbackContainer";
import { WinbackScreen } from "./components/WinbackScreen";

// Module entry point. The router renders <Winback /> directly;
// WinbackContainer wires up the HTTP adapter and provides it to the subtree
// via context so every hook reads the port from context — tests bypass this
// and use WinbackProvider directly with a fake port.
export default function Winback() {
  return (
    <WinbackContainer>
      <WinbackScreen />
    </WinbackContainer>
  );
}
