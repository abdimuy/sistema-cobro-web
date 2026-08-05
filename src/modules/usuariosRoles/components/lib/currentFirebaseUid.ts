import { auth } from "../../../../../firebase";

// getCurrentFirebaseUid reads the signed-in Firebase user's uid the same way
// the rest of the app does (see e.g. modules/*/infrastructure/http/apiClient.ts
// or AuthContext.tsx: auth.currentUser). Returns "" when nobody is signed in
// — noPuedeQuitarseSuPropioRolInmutable treats an empty uid as "never block".
export function getCurrentFirebaseUid(): string {
  return auth.currentUser?.uid ?? "";
}
