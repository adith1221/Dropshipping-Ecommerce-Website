import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: replace with your own Firebase config from the Firebase console
const firebaseConfig = {
 apiKey: "AIzaSyCIGSkTyEPnmnmZLNRJOzaOPWhnR3Ni6kw",
  authDomain: "pico-737e7.firebaseapp.com",
  projectId: "pico-737e7",
  storageBucket: "pico-737e7.firebasestorage.app",
  messagingSenderId: "1024058129028",
  appId: "1:1024058129028:web:2fd72bb6a1df1adbc3e0d1",
  measurementId: "G-Y4TX64D6DN"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

