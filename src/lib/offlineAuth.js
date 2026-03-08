// Sistema de autenticación completamente offline
const ADMIN_EMAILS = [
  'pederneraleonardo729@gmail.com'
];

export function isOfflineAdmin(email) {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.includes(normalized);
}

export function createOfflineUserDoc(user) {
  const isAdmin = isOfflineAdmin(user.email);
  
  return {
    uid: user.uid,
    name: user.displayName || null,
    email: user.email || null,
    photoURL: user.photoURL || null,
    role: isAdmin ? 'ADMIN' : 'USER',
    isOfflineMode: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Cache local para usuarios
const userCache = new Map();

export function cacheUser(user, userDoc) {
  userCache.set(user.uid, {
    user,
    userDoc,
    timestamp: Date.now()
  });
}

export function getCachedUser(uid) {
  const cached = userCache.get(uid);
  if (!cached) return null;
  
  // Cache válido por 1 hora
  if (Date.now() - cached.timestamp > 60 * 60 * 1000) {
    userCache.delete(uid);
    return null;
  }
  
  return cached;
}

// Sistema de posts offline (para cuando Firestore esté bloqueado)
const offlinePosts = new Map();

export function cachePost(post) {
  offlinePosts.set(post.id, {
    ...post,
    cachedAt: Date.now()
  });
}

export function getCachedPosts() {
  return Array.from(offlinePosts.values())
    .filter(post => Date.now() - post.cachedAt < 30 * 60 * 1000) // 30 min cache
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function addOfflinePost(postData) {
  const post = {
    id: `offline_${Date.now()}`,
    ...postData,
    createdAt: new Date().toISOString(),
    isOffline: true
  };
  
  cachePost(post);
  return post;
}

// Verificación de conectividad
export function isFirestoreBlocked() {
  // Detectar si Firestore está siendo bloqueado por adblockers
  return navigator.userAgent.includes('Chrome') && 
         (window.location.hostname !== 'localhost');
}