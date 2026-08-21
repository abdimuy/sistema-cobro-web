import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { IntentoAgrupado } from "../domain/entities";
import { COPY, type AccionMutante } from "./accionesCopy";

// ConfirmarAccionDialog es el paso obligatorio de toda acción que MUTA.
//
// Ninguna se ejecuta al primer clic, y no es paranoia: reenviar crea una venta
// o aplica un pago de verdad. El costo de un clic de más es un segundo; el de
// un reenvío accidental es un cargo duplicado a un cliente.
//
// Tres reglas que el diálogo cumple siempre:
//
//   1. **Dice sobre QUÉ.** El nombre del cliente y el monto, no "este
//      intento". Quien tiene ocho tarjetas abiertas necesita saber cuál está
//      a punto de tocar.
//   2. **El botón repite el verbo del que lo abrió.** "Reenviar" abre un
//      diálogo cuyo botón dice "Reenviar" — no "Aceptar", no "Sí, continuar".
//      El verbo es lo que la persona buscaba y es lo que debe encontrar.
//   3. **Reenviar con cuerpo editado pide DOS confirmaciones**, porque manda
//      datos distintos a los que capturó el vendedor.
export function ConfirmarAccionDialog({
  accion,
  intento,
  pending,
  onConfirm,
  onCancel,
}: {
  // accion en null mantiene el diálogo cerrado.
  accion: AccionMutante | null;
  intento: IntentoAgrupado | null;
  pending: boolean;
  onConfirm: (accion: AccionMutante) => void;
  onCancel: () => void;
}) {
  const [confirmadoUnaVez, setConfirmadoUnaVez] = useState(false);

  // Cada apertura arranca en el primer paso. Sin esto, cerrar a mitad de la
  // doble confirmación y volver a abrir dejaría el segundo clic a un clic de
  // distancia.
  useEffect(() => {
    if (accion === null) setConfirmadoUnaVez(false);
  }, [accion]);

  if (accion === null || intento === null) return null;

  const copy = COPY[accion];
  const segundoPaso = copy.segundoPaso;
  const enSegundoPaso = confirmadoUnaVez && segundoPaso !== undefined;

  return (
    <AlertDialog
      open
      onOpenChange={(abierto) => {
        if (!abierto) onCancel();
      }}
    >
      <AlertDialogContent data-testid={`confirmar-${accion}`}>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.titulo}</AlertDialogTitle>
          <AlertDialogDescription data-testid="confirmar-cuerpo">
            {enSegundoPaso && segundoPaso
              ? segundoPaso(intento)
              : copy.cuerpo(intento)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            data-testid="confirmar-boton"
            disabled={pending}
            onClick={(e) => {
              // El AlertDialogAction de Radix cierra al hacer clic; en la
              // doble confirmación el primer clic tiene que dejarlo abierto.
              e.preventDefault();
              if (segundoPaso && !confirmadoUnaVez) {
                setConfirmadoUnaVez(true);
                return;
              }
              onConfirm(accion);
            }}
          >
            {pending ? copy.gerundio : copy.verbo}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
