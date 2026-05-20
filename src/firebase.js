import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBBegsQ52r38HQLEkkl6-QbmlYTA0gfb8k",
  authDomain: "laktik-photon.firebaseapp.com",
  databaseURL: "https://laktik-photon-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "laktik-photon",
  storageBucket: "laktik-photon.firebasestorage.app",
  messagingSenderId: "419310233292",
  appId: "1:419310233292:web:ee046d47d1d70c511f4469",
  measurementId: "G-5HM6M7G5PB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  fetchSignInMethodsForEmail,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  where
};

export default app;