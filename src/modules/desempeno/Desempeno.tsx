import { ClientesContainer } from "@/modules/clientes";
import { DesempenoContainer } from "./presentation/composition/DesempenoContainer";
import { DesempenoScreen } from "./components/DesempenoScreen";

// Entrada del módulo. ClientesContainer da contexto a PagoModal, VentaModal y
// ClienteFicha, que la ficha abre en su pila de modales (D11).
export function Desempeno({ puedeConfigurar }: { puedeConfigurar: boolean }) {
  return (
    <DesempenoContainer>
      <ClientesContainer>
        <DesempenoScreen puedeConfigurar={puedeConfigurar} />
      </ClientesContainer>
    </DesempenoContainer>
  );
}
