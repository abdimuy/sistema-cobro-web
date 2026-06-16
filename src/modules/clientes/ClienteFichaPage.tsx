import { useParams } from "react-router-dom";
import { ClientesContainer } from "./presentation/composition/ClientesContainer";
import { ClienteFicha } from "./components/ficha/ClienteFicha";

export function ClienteFichaPage() {
  const { id } = useParams<{ id: string }>();
  const clienteId = Number(id);

  if (!id || !Number.isFinite(clienteId) || clienteId <= 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 px-8 text-center">
        <p className="font-serif text-xl font-normal text-foreground">
          Cliente no válido
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">
          El identificador "{id}" no corresponde a ningún cliente.
        </p>
      </div>
    );
  }

  return (
    <ClientesContainer>
      <ClienteFicha clienteId={clienteId} />
    </ClientesContainer>
  );
}

export default ClienteFichaPage;
