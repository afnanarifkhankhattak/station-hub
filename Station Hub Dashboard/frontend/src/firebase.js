import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCYbYjcMnGg5v1GI2Irjs_s4xmqsGLzbf8",
  authDomain: "station-hub-3fda8.firebaseapp.com",
  projectId: "station-hub-3fda8",
  storageBucket: "station-hub-3fda8.firebasestorage.app",
  messagingSenderId: "994736565413",
  appId: "1:994736565413:web:ebc592d3ced17e9723714c",
  measurementId: "G-QNQ08CNXD9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);