import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Pastikan inisialisasi aplikasi hanya berjalan satu kali
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi layanan Firebase
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// EKSPOR HANYA SATU KALI DI SINI AGAR TYPESCRIPT TIDAK MARAH
export { app, auth, db, storage };
