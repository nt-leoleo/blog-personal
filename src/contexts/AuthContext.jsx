import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { ensureUserDocument, getRoleFromUserDoc, isAdminEmail } from '../lib/users';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setUserDoc(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        const profile = await ensureUserDocument(currentUser);
        setUserDoc(profile);
      } catch (error) {
        console.error('No se pudo sincronizar usuario en Firestore', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const registerWithEmail = async ({ name, email, password }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    if (name?.trim()) {
      await updateProfile(credential.user, { displayName: name.trim() });
    }

    const profile = await ensureUserDocument({
      ...credential.user,
      displayName: name?.trim() || credential.user.displayName
    });

    setUserDoc(profile);
    return credential.user;
  };

  const loginWithEmail = async ({ email, password }) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const role = await getRoleFromUserDoc(credential.user.uid);
    setUserDoc((prev) => ({ ...prev, role }));
    return credential.user;
  };

  const loginWithGoogle = async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    const profile = await ensureUserDocument(credential.user);
    setUserDoc(profile);
    return credential.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = Boolean(userDoc?.role === 'ADMIN' || isAdminEmail(user?.email || ''));

  const value = useMemo(
    () => ({
      user,
      userDoc,
      loading,
      isAdmin,
      registerWithEmail,
      loginWithEmail,
      loginWithGoogle,
      logout
    }),
    [user, userDoc, loading, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
