// Estado de una pestaña cuando el API responde un 409 que no se arregla
// reintentando (semana vencida, zona excluida): título y mensaje del servidor,
// sin botón.
export function EstadoConflicto({ titulo, mensaje }: { titulo: string; mensaje: string }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-[14px] bg-dsm-tarjeta px-6 py-12 text-center ring-1 ring-border"
    >
      <p className="font-serif text-xl">{titulo}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{mensaje}</p>
    </div>
  );
}
