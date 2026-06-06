export function isNuevoEditor(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("nuevoEditor") === "1";
}
