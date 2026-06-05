// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// TEMP DEV: pointed at msp-dev-96ff5. Restore the prod config from
// firebase.ts.prod-backup before shipping. The appId below is a placeholder
// (Android-app variant) because no Web app is registered in the dev project
// yet; Auth and Firestore work without a Web-specific appId, but if you need
// Analytics, register a Web app at
// https://console.firebase.google.com/project/msp-dev-96ff5/overview
// and replace `appId` with the value shown.
const firebaseConfig = {
  apiKey: "AIzaSyAx9Ts4kGoqEmzDiI-mQCp8Jd4FZhczxos",
  authDomain: "msp-dev-96ff5.firebaseapp.com",
  projectId: "msp-dev-96ff5",
  storageBucket: "msp-dev-96ff5.appspot.com",
  messagingSenderId: "305734432149",
  appId: "1:305734432149:web:placeholder",
};

// Initialize Firebase - Primary app for admin
export const app = initializeApp(firebaseConfig);

// Initialize Firebase - Secondary app for user creation (avoids session conflicts)
export const secondaryApp = initializeApp(firebaseConfig, "secondary");

export const db = getFirestore(app);

export const auth = getAuth(app);

export const secondaryAuth = getAuth(secondaryApp);
