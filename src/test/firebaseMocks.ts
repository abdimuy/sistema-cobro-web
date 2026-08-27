import { vi } from "vitest";

// Mocks reutilizables de los SDK de Firebase para pruebas de componentes.
//
// Este repo no mockeaba `firebase/auth` ni `firebase/firestore` en ningún
// lado: las pantallas que los usan no tenían prueba. El archivo existe para
// que el patrón se escriba UNA vez y quede legible:
//
//   vi.mock("firebase/auth", async (importOriginal) => ({
//     ...(await importOriginal<typeof import("firebase/auth")>()),
//     ...firebaseAuthModuleMock(),
//   }));
//
// Se conserva el módulo real y sólo se sustituyen las funciones que tocan la
// red (getAuth, createUserWithEmailAndPassword, signOut, getFirestore, doc,
// setDoc). Así ningún otro export que el árbol importe se vuelve `undefined`.

export type FakeUser = {
  uid: string;
  email: string | null;
  getIdToken: () => Promise<string>;
};

export type FakeAuth = {
  // Nombre de la app de Firebase a la que pertenece: "[DEFAULT]" es la del
  // admin que opera la pantalla; "secondary" es la que se usa para crear
  // usuarios sin tumbar la sesión del admin (ver firebase.ts).
  appName: string;
  readonly currentUser: FakeUser | null;
  authStateReady: () => Promise<void>;
};

const ADMIN: FakeUser = {
  uid: "admin-uid",
  email: "oficina@muebleriamsp.mx",
  getIdToken: async () => "token-del-admin",
};

// Firebase restaura la sesión de forma ASÍNCRONA: hasta que `authStateReady()`
// resuelve, `currentUser` es null. Ese es el fallo real que el `await
// auth.authStateReady()` del interceptor previene — sin él, la primera llamada
// tras un refresh en frío sale sin cabecera y el backend responde 401.
//
// El mock lo modela en vez de tener `currentUser` puesto desde el principio:
// así, si alguien quita ese `await`, la cabecera se va vacía y las pruebas se
// caen. Con un `currentUser` siempre presente, quitarlo no rompía nada.
let adminSesionRestaurada = false;

// Sesión del admin. Es la que firma las llamadas al API — el interceptor de
// `apiClient` lee ESTA, nunca la secundaria.
export const fakeAdminAuth: FakeAuth = {
  appName: "[DEFAULT]",
  get currentUser() {
    return adminSesionRestaurada ? ADMIN : null;
  },
  authStateReady: async () => {
    adminSesionRestaurada = true;
  },
};

// App secundaria: aquí nace el usuario nuevo y de aquí se cierra sesión.
export const fakeSecondaryAuth: FakeAuth = {
  appName: "secondary",
  currentUser: null,
  authStateReady: async () => {},
};

export const firebaseAuthSpies = {
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(async () => {}),
};

export const firestoreSpies = {
  setDoc: vi.fn(async () => {}),
  doc: vi.fn((_db: unknown, collection: string, id: string) => ({
    collection,
    id,
  })),
};

export function firebaseAuthModuleMock() {
  return {
    getAuth: vi.fn((app?: { name?: string }) =>
      app?.name === "secondary" ? fakeSecondaryAuth : fakeAdminAuth,
    ),
    createUserWithEmailAndPassword:
      firebaseAuthSpies.createUserWithEmailAndPassword,
    signOut: firebaseAuthSpies.signOut,
  };
}

export function firebaseFirestoreModuleMock() {
  return {
    getFirestore: vi.fn(() => ({ __fake: "firestore" })),
    doc: firestoreSpies.doc,
    setDoc: firestoreSpies.setDoc,
  };
}

// makeFakeUserCredential arma lo que devuelve createUserWithEmailAndPassword.
export function makeFakeUserCredential(uid: string, email: string) {
  return {
    user: { uid, email, getIdToken: async () => `token-de-${uid}` },
  };
}

// resetFirebaseMocks limpia las llamadas y restaura las implementaciones por
// default. Llámalo en un beforeEach.
export function resetFirebaseMocks() {
  // Cada prueba arranca como un refresh en frío: la sesión aún no está
  // restaurada y sólo `authStateReady()` la deja lista.
  adminSesionRestaurada = false;
  firebaseAuthSpies.createUserWithEmailAndPassword.mockReset();
  firebaseAuthSpies.signOut.mockReset();
  firebaseAuthSpies.signOut.mockImplementation(async () => {});
  firestoreSpies.setDoc.mockReset();
  firestoreSpies.setDoc.mockImplementation(async () => {});
  firestoreSpies.doc.mockClear();
}
