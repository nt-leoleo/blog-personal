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
import { ensureUserDocument, isAdminEmail } from '../lib/users';

const AuthContext = createContext(null);

// Cache para evitar múltiples llamadas a Firestore
let userDocCache = new Map();

// Sistema de manejo de errores
let isFirestoreBlocked = false;
let lastErrorTime = 0;
const ERROR_COOLDOWN = 30000; // 30 segundos

function shouldLogError() {
  const now = Date.now();
  if (now - lastErrorTime > ERROR_COOLDOWN) {
    lastErrorTime = now;
    return true;
  }
  return false;
}

function detectFirestoreBlock(error) {
  const errorMessage = error?.message || '';
  const isNetworkError = errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
                        errorMessage.includes('offline') ||
                        errorMessage.includes('network') ||
                        errorMessage.includes('Failed to get document');
  
  if (isNetworkError && !isFirestoreBlocked) {
    isFirestoreBlocked = true;
    if (shouldLogError()) {
      // console.warn('🚫 Firestore bloqueado por adblocker - Modo offline activado');
    }
  }
  
  return isNetworkError;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let unsubscribe;
    let mounted = true;
    
    // Usar un timeout para evitar múltiples llamadas rápidas
    const timeoutId = setTimeout(() => {
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!mounted) return;
        
        // console.log('🔐 Estado de autenticación cambió:', currentUser?.email || 'No logueado');
        
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
              // console.log('📦 Usando documento de usuario desde cache');
              setUserDoc(cachedDoc.data);
              setLoading(false);
              return;
            }
          }

          // Si ya sabemos que Firestore está bloqueado, usar fallback directamente
          if (isFirestoreBlocked) {
            throw new Error('Firestore bloqueado - usando fallback');
          }

          // console.log('🔄 Obteniendo documento de usuario desde Firestore');
          const profile = await ensureUserDocument(currentUser);
          
          if (!mounted) return;
          
          // console.log('✅ Documento de usuario obtenido:', profile);
          
          // Actualizar cache
          userDocCache.set(cacheKey, {
            data: profile,
            timestamp: Date.now()
          });
          
          setUserDoc(profile);
          setIsOffline(false);
          
          // Reset del estado de bloqueo si fue exitoso
          if (isFirestoreBlocked) {
            isFirestoreBlocked = false;
            // console.log('✅ Firestore reconectado');
          }
        } catch (error) {
          if (!mounted) return;
          
          const isBlocked = detectFirestoreBlock(error);
          
          if (shouldLogError()) {
            // console.error('❌ No se pudo sincronizar usuario en Firestore:', isBlocked ? 'Bloqueado por adblocker' : error.message);
            // console.log('🔄 Activando modo offline - Firestore bloqueado');
          }
          setIsOffline(true);
          
          // FALLBACK: Usar verificación local si Firestore falla
          const isAdminLocal = isAdminEmail(currentUser.email) || 
                             currentUser.email === 'pederneraleonardo729@gmail.com';
          const fallbackDoc = {
            uid: currentUser.uid,
            name: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            role: isAdminLocal ? 'ADMIN' : 'USER',
            isOfflineFallback: true
          };
          
          // console.log('🔄 Usando fallback offline:', fallbackDoc);
          setUserDoc(fallbackDoc);
          
          // Actualizar cache con fallback
          userDocCache.set(currentUser.uid, {
            data: fallbackDoc,
            timestamp: Date.now()
          });
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      });
    }, 100); // Delay de 100ms para evitar múltiples llamadas

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const registerWithEmail = async ({ name, email, password }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    if (name?.trim()) {
      await updateProfile(credential.user, { displayName: name.trim() });
    }

    try {
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
    } catch (error) {
      // console.error('Error creando documento de usuario, usando fallback');
      const isAdminLocal = isAdminEmail(credential.user.email) || 
                         credential.user.email === 'pederneraleonardo729@gmail.com';
      const fallbackDoc = {
        uid: credential.user.uid,
        name: credential.user.displayName,
        email: credential.user.email,
        photoURL: credential.user.photoURL,
        role: isAdminLocal ? 'ADMIN' : 'USER',
        isOfflineFallback: true
      };
      setUserDoc(fallbackDoc);
    }

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

  // FORZAR ADMIN para email específico - múltiples verificaciones
  const isAdmin = Boolean(
    userDoc?.role === 'ADMIN' || 
    user?.email === 'pederneraleonardo729@gmail.com' ||
    user?.email?.toLowerCase().includes('pederneraleonardo729') ||
    (user?.email && isAdminEmail(user.email))
  );
  
  // Debug logging
  useEffect(() => {
    if (user && userDoc) {
      // console.log('🎯 Estado final de admin:', {
      //   email: user.email,
      //   role: userDoc.role,
      //   isAdmin: isAdmin,
      //   isOffline: isOffline,
      //   isFallback: userDoc.isOfflineFallback
      // });
    }
  }, [user, userDoc, isAdmin, isOffline]);

  const value = useMemo(
    () => ({
      user,
      userDoc,
      loading,
      isAdmin,
      isOffline,
      registerWithEmail,
      loginWithEmail,
      loginWithGoogle,
      logout
    }),
    [user, userDoc, loading, isAdmin, isOffline]
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
