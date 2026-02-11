import { initializeApp, getApps } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBbFmV1FabIZc-ZI-wTr4JvAoHd67nOyys",
  authDomain: "prompt2web-auth.firebaseapp.com",
  projectId: "prompt2web-auth",
  storageBucket: "prompt2web-auth.firebasestorage.app",
  messagingSenderId: "159147217562",
  appId: "1:159147217562:web:8c80fb3f5ec6a7e1870523",
  measurementId: "G-74MFBCL19E",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

export {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  type User,
}
