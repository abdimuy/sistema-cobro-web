import { ClientesContainer } from "./presentation/composition/ClientesContainer";
import { ClientesScreen } from "./components/ClientesScreen";

export function Clientes() {
  return (
    <ClientesContainer>
      <ClientesScreen />
    </ClientesContainer>
  );
}
