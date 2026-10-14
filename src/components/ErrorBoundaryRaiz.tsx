import { Component, type ErrorInfo, type ReactNode } from "react";
import { registrar } from "@/lib/bitacora";

interface Props {
  children: ReactNode;
  /** Inyectable para pruebas; por defecto recarga la ventana. */
  recargar?: () => void;
}

interface State {
  error: Error | null;
}

/**
 * Última red de la app: si algo lanza durante el render, React desmonta todo
 * el árbol y la ventana queda vacía (sólo el fondo). Con este límite se ve un
 * aviso con un botón para recargar, y el error queda en el log en disco.
 */
export class ErrorBoundaryRaiz extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    registrar(
      "error",
      `error de render: ${error.message}\n${error.stack ?? ""}\n${info.componentStack ?? ""}`,
    );
  }

  private recargar = () => {
    if (this.props.recargar) this.props.recargar();
    else window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground"
      >
        <p className="text-base font-medium">Algo falló al mostrar esta pantalla</p>
        <button
          type="button"
          onClick={this.recargar}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Recargar
        </button>
      </div>
    );
  }
}
