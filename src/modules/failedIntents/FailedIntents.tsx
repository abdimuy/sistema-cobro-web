import { FailedIntentsContainer } from "./presentation/composition/FailedIntentsContainer";
import { FailedIntentsScreen } from "./components/FailedIntentsScreen";

// Module entry point. The router renders <FailedIntents/> directly;
// FailedIntentsContainer wires up the HTTP adapter and provides it to
// the subtree via context so every hook reads the port from context.
export default function FailedIntents() {
  return (
    <FailedIntentsContainer>
      <FailedIntentsScreen />
    </FailedIntentsContainer>
  );
}
