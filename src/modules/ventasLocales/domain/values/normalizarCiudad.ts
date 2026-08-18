// Espeja `domain.NormalizeCiudad` del servidor Go
// (internal/ventas/domain/ciudad_normalize.go) y `normalizeCiudad` de la app
// Android: descompone, quita marcas diacríticas, recompone, mayúsculas y
// colapsa espacios.
//
// Sin esto, el catálogo de producción —que trae acentos y espacios finales,
// "COYOMEAPAN ", "ESPERANZA "— hace que una ciudad ya guardada se vea como no
// reconocida cuando en realidad sí empata contra CIUDADES.
//
// Igual que en el servidor, la regla es a propósito conservadora: acentos,
// mayúsculas y espacios, nada más. No intenta reconciliar los casi-duplicados
// del catálogo ("TLACHICHUCA" contra "TLACHICHUCA, PUE"); adivinar cuál de los
// dos quiso decir el capturista es como se manda un cliente al estado
// equivocado.
export const normalizarCiudad = (valor: string): string =>
  valor
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .normalize("NFC")
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
