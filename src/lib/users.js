import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const adminEmailsCollection = collection(db, 'adminEmails');

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

export function isAdminEmail(email = '') {
  return ADMIN_EMAILS.includes(normalizeEmail(email));
}

export async function isEmailAdmin(email = '') {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  // Verificar primero en las variables de entorno
  if (isAdminEmail(normalized)) {
    return true;
  }

  // Verificar en la base de datos
  try {
    const adminRef = doc(db, 'adminEmails', normalized);
    const snapshot = await getDoc(adminRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Error verificando admin en Firestore:', error);
    return false;
  }
}

export async function fetchAdminEmails() {
  const snapshot = await getDocs(query(adminEmailsCollection, orderBy('email', 'asc')));
  return snapshot.docs.map((item) => item.data().email).filter(Boolean);
}

export async function addAdminEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new Error('Correo invalido.');
  }

  await setDoc(
    doc(db, 'adminEmails', normalized),
    {
      email: normalized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function removeAdminEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  await deleteDoc(doc(db, 'adminEmails', normalized));
}

export async function ensureUserDocument(user) {
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  // Verificar si el usuario es admin basado en su email
  const role = (await isEmailAdmin(user.email)) ? 'ADMIN' : 'USER';

  const payload = {
    uid: user.uid,
    name: user.displayName || null,
    email: user.email || null,
    photoURL: user.photoURL || null,
    role,
    updatedAt: serverTimestamp()
  };

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      ...payload,
      createdAt: serverTimestamp()
    });

    return { ...payload, createdAt: new Date() };
  }

  // Actualizar el rol cada vez que el usuario inicia sesión
  await setDoc(userRef, payload, { merge: true });
  
  return {
    ...payload,
    createdAt: snapshot.data()?.createdAt || new Date()
  };
}

export async function getRoleFromUserDoc(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) {
    return 'USER';
  }

  return snapshot.data().role || 'USER';
}
