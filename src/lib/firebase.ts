import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCmnrotFdzLVuatdPyzy8SBJAxJ9sum-5E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "stevtech-aafbd.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "stevtech-aafbd",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "stevtech-aafbd.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "912924979662",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:912924979662:web:5043d6d8fad73822867b9f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HBQJSKK1H2",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);