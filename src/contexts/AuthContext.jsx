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
import { ensureUserDocument } from '../lib/users';

const AuthContext = createContext(null);

// Cache para evitar múltiples llamadas a Firestore
let userDocCache = new Map();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('🔐 Estado de autenticación cambió:', currentUser?.email || 'No logueado');
      
      if (!currentUser) {
        setUser(null);
        setUserDoc(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        // Verificar cache primero
        const cacheKey = currentUser.uid;
        if (userDocCache.has(cacheKey)) {
          const cachedDoc = userDocCache.get(cacheKey);
          // Cache válido por 10 minutos
          if (Date.now() - cachedDoc.timestamp < 10 * 60 * 1000) {
            console.log('📦 Usando documento de usuario desde cache');
            setUserDoc(cachedDoc.data);
            setLoading(false);
            return;
          }
        }

        console.log('🔄 Obteniendo documento de usuario desde Firestore');
        const profile = await ensureUserDocument(currentUser);
        
        console.log('✅ Documento de usuario obtenido:', profile);
        
        // Actualizar cache
        userDocCache.set(cacheKey, {
          data: profile,
          timestamp: Date.now()
        });
        
        setUserDoc(profile);
      } catch (error) {
        console.error('❌ No se pudo sincronizar usuario en Firestore', error);
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

    // Actualizar cache
    userDocCache.set(credential.user.uid, {
      data: profile,
      timestamp: Date.now()
    });

    setUserDoc(profile);
    return credential.user;
  };

  const loginWithEmail = async ({ email, password }) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    // El perfil se actualizará en onAuthStateChanged
    return credential.user;
  };

  const loginWithGoogle = async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    // El perfil se actualizará en onAuthStateChanged
    return credential.user;
  };

  const logout = async () => {
    // Limpiar cache al cerrar sesión
    userDocCache.clear();
    await signOut(auth);
  };

  const isAdmin = Boolean(userDoc?.role === 'ADMIN');
  
  // Debug logging
  useEffect(() => {
    if (user && userDoc) {
      console.log('🎯 Estado final de admin:', {
        email: user.email,
        role: userDoc.role,
        isAdmin: isAdmin
      });
    }
  }, [user, userDoc, isAdmin]);

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
