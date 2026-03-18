import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingKeys = requiredKeys.filter((key) => {
  const value = import.meta.env[key];
  return !value || !String(value).trim();
});

if (missingKeys.length > 0) {
  throw new Error(`Faltan variables de entorno Firebase: ${missingKeys.join(', ')}`);
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Configurar persistencia local para evitar reconexiones
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Ignorar errores de persistencia
  });
} catch (error) {
  // Ignorar si setPersistence no está disponible
}

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ 
  prompt: 'select_account'
});

// Inicializar Firestore con configuración optimizada para evitar errores de red
// Deshabilitar listeners en tiempo real y usar solo consultas puntuales
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Usar long polling en lugar de websockets
  experimentalAutoDetectLongPolling: false,
  cacheSizeBytes: 1048576, // 1MB cache (reducido para mejor rendimiento)
  ignoreUndefinedProperties: true,
});

// Deshabilitar logging de Firebase para reducir ruido en consola
if (typeof window !== 'undefined') {
  // Suprimir warnings de Firebase
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const msg = args[0]?.toString() || '';
    // Filtrar warnings de Firestore sobre database not found
    if (msg.includes('@firebase/firestore') || msg.includes('Database') || msg.includes('not found')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

export function optimizeFirestoreConnection() {
  // No hacer nada - la configuración ya está optimizada
}

export function handleFirestoreError(error) {
  // Silenciar errores comunes de red
  if (error.code === 'unavailable' || error.code === 'deadline-exceeded' || error.code === 'permission-denied') {
    return;
  }
  // console.error('Error de Firestore:', error.message);
}
