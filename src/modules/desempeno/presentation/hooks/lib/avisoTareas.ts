// Aviso de "las tareas cambiaron" dentro del módulo. Asignar visita se abre
// desde varios lugares (fila de Cuentas, detalle de actividad, la lista misma)
// y la lista de tareas de la ficha tiene que recargar sin que esos lugares se
// conozcan entre sí.
type Oyente = () => void;
const oyentes = new Set<Oyente>();

export function avisarCambioDeTareas(): void {
  for (const o of [...oyentes]) o();
}

export function escucharCambioDeTareas(oyente: Oyente): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}
