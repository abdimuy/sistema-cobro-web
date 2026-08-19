import { DESKTOP_MODULES, PUBLIC_MODULES } from './modules';

/**
 * Interruptores que se pintan en la pantalla de usuarios (Firestore
 * `MODULOS_DESKTOP`). Se DERIVA de DESKTOP_MODULES a propósito: mientras fue una
 * lista escrita a mano se quedó atrás de las pantallas nuevas —Clientes, Rutas,
 * Bandeja— y no había forma de concederlas sin hacer admin al usuario.
 *
 * Quedan fuera:
 *  - los módulos públicos (Inicio), que no se conceden porque siempre están;
 *  - los módulos con `requiredRole`, reservados a esos roles: mostrar su
 *    interruptor sería mentir, porque encenderlo no daría acceso.
 */
export const desktopModules = DESKTOP_MODULES
  .filter(module => !PUBLIC_MODULES.includes(module.key))
  .filter(module => !module.requiredRole || module.requiredRole.length === 0)
  .map(({ key, label }) => ({ key, label }));
