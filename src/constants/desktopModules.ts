import { DESKTOP_MODULES, PUBLIC_MODULES } from './modules';

/**
 * Interruptores que se pintan en la pantalla de usuarios (Firestore
 * `MODULOS_DESKTOP`). Se DERIVA de DESKTOP_MODULES a propósito: mientras fue una
 * lista escrita a mano se quedó atrás de las pantallas nuevas —Clientes, Rutas,
 * Bandeja— y no había forma de concederlas sin hacer admin al usuario.
 *
 * Toda pantalla del escritorio tiene su interruptor. La única exclusión son los
 * módulos públicos (Inicio), que no se conceden porque siempre están.
 */
export const desktopModules = DESKTOP_MODULES
  .filter(module => !PUBLIC_MODULES.includes(module.key))
  .map(({ key, label }) => ({ key, label }));
