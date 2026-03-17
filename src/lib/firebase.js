import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork, initializeFirestore } from 'firebase/firestore';
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

// Configurar Auth para no mantener estado persistente innecesario
auth.settings.appVerificationDisabledForTesting = false;

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ 
  prompt: 'select_account'
});

// Inicializar Firestore con configuración optimizada
// Desactivar listeners en tiempo real para reducir conexiones
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: false, // Desactivar long polling
  experimentalAutoDetectLongPolling: false, // No detectar automáticamente
  cacheSizeBytes: 40000000, // 40MB de cache local
});

// Configuración de red optimizada
let networkEnabled = true;

export async function optimizeFirestoreConnection() {
  try {
    if (!networkEnabled) {
      await enableNetwork(db);
      networkEnabled = true;
      // console.log('🔄 Red de Firestore habilitada');
    }
  } catch (error) {
    // console.warn('⚠️ No se pudo optimizar la conexión:', error.message);
  }
}

export async function handleFirestoreError(error) {
  // console.error('🔥 Error de Firestore:', error.code, error.message);
  
  // Si hay problemas de red, intentar reconectar
  if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
    try {
      await disableNetwork(db);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await enableNetwork(db);
      // console.log('🔄 Reconexión de Firestore intentada');
    } catch (reconnectError) {
      // console.error('❌ Error en reconexión:', reconnectError.message);
    }
  }
}

// Optimizaciones de rendimiento
export { enableNetwork, disableNetwork };
