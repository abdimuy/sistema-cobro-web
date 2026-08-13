// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Config por modo de Vite, igual que `src/constants/api.ts`. Los fallbacks son
// los de PRODUCCIÓN a propósito: un build sin `.env` sale apuntando a prod, no
// a dev. Antes esto era un archivo fijo con los valores de dev commiteados y un
// `firebase.ts.prod-backup` al lado — la v1.14.0 se publicó autenticando contra
// msp-dev-96ff5 porque nadie restauró el respaldo antes de compilar.
//
// El entorno de pruebas comparte el proyecto Firebase de dev (msp-dev-96ff5);
// sus valores viven en `.env.development` y `.env.test`.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyDRXzWxvwZcs9qVjKvrjoMOOynPwyF0sBo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "msp-db-1c2ce.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "msp-db-1c2ce",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "msp-db-1c2ce.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID ?? "519103475417",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:519103475417:web:d1b83f6d6e17d6e2d898c8",
};

// Initialize Firebase - Primary app for admin
export const app = initializeApp(firebaseConfig);

// Initialize Firebase - Secondary app for user creation (avoids session conflicts)
export const secondaryApp = initializeApp(firebaseConfig, "secondary");

export const db = getFirestore(app);

export const auth = getAuth(app);

export const secondaryAuth = getAuth(secondaryApp);
