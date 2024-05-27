// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDueKnY8pNJnwBNPDKW7u_nuz74O3xV_34",
  authDomain: "msp-db-31fdf.firebaseapp.com",
  projectId: "msp-db-31fdf",
  storageBucket: "msp-db-31fdf.appspot.com",
  messagingSenderId: "156727289232",
  appId: "1:156727289232:web:871f5bcbb762f2ea19bf15",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);
