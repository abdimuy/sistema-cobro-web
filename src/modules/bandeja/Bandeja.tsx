import { BandejaContainer } from "./presentation/composition/BandejaContainer";
import { BandejaScreen } from "./presentation/BandejaScreen";

// Module entry point. The router renders <Bandeja /> directly;
// BandejaContainer wires up the HTTP adapter and provides it to the
// subtree via context so every hook reads the port from context — tests
// bypass this and use BandejaProvider directly with a fake port.
export function Bandeja() {
  return (
    <BandejaContainer>
      <BandejaScreen />
    </BandejaContainer>
  );
}

export default Bandeja;
