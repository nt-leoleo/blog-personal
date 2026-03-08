// Proxy para Firestore que funciona con adblockers
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, optimizeFirestoreConnection } from './firebase';

// Cache local robusto con persistencia
const localCache = {
  posts: new Map(),
  users: new Map(),
  lastUpdate: {
    posts: 0,
    users: 0
  }
};

// Configuración optimizada
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutos (reducido)
const RETRY_ATTEMPTS = 2; // Reducido de 3 a 2
const RETRY_DELAY = 500; // Reducido de 1000 a 500ms
const OPERATION_TIMEOUT = 8000; // 8 segundos máximo por operación

// Cargar cache desde localStorage al iniciar
function loadCacheFromStorage() {
  try {
    const savedPosts = localStorage.getItem('firestore_cache_posts');
    const savedUsers = localStorage.getItem('firestore_cache_users');
    const savedTimestamps = localStorage.getItem('firestore_cache_timestamps');
    
    if (savedPosts) {
      const posts = JSON.parse(savedPosts);
      posts.forEach(post => localCache.posts.set(post.id, post));
    }
    
    if (savedUsers) {
      const users = JSON.parse(savedUsers);
      users.forEach(user => localCache.users.set(user.id, user));
    }
    
    if (savedTimestamps) {
      localCache.lastUpdate = JSON.parse(savedTimestamps);
    }
    
    console.log('📦 Cache cargado desde localStorage');
  } catch (error) {
    console.warn('⚠️ Error cargando cache:', error.message);
  }
}

// Guardar cache en localStorage
function saveCacheToStorage() {
  try {
    localStorage.setItem('firestore_cache_posts', JSON.stringify(Array.from(localCache.posts.values())));
    localStorage.setItem('firestore_cache_users', JSON.stringify(Array.from(localCache.users.values())));
    localStorage.setItem('firestore_cache_timestamps', JSON.stringify(localCache.lastUpdate));
  } catch (error) {
    console.warn('⚠️ Error guardando cache:', error.message);
  }
}

// Función para reintentar operaciones con timeout
async function retryOperation(operation, attempts = RETRY_ATTEMPTS) {
  for (let i = 0; i < attempts; i++) {
    try {
      // Agregar timeout a cada operación
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), OPERATION_TIMEOUT);
      });
      
      const result = await Promise.race([operation(), timeoutPromise]);
      return result;
    } catch (error) {
      await handleFirestoreError(error);
      
      if (i === attempts - 1) {
        throw error;
      }
      
      // Backoff exponencial más agresivo
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(1.5, i)));
    }
  }
}

// Wrapper para operaciones de lectura con cache persistente
async function cachedRead(cacheKey, operation, cacheDuration = CACHE_DURATION) {
  const now = Date.now();
  const cached = localCache[cacheKey];
  const lastUpdate = localCache.lastUpdate[cacheKey];
  
  // Usar cache si está disponible y no ha expirado
  if (cached && cached.size > 0 && (now - lastUpdate) < cacheDuration) {
    console.log(`📦 Usando ${cacheKey} desde cache (${cached.size} items)`);
    return Array.from(cached.values());
  }
  
  try {
    // Optimizar conexión antes de la operación
    await optimizeFirestoreConnection();
    
    console.log(`🔄 Consultando ${cacheKey} desde Firestore...`);
    const startTime = Date.now();
    const result = await retryOperation(operation);
    const duration = Date.now() - startTime;
    
    // Actualizar cache
    localCache[cacheKey].clear();
    result.forEach((item, index) => {
      localCache[cacheKey].set(item.id || index, item);
    });
    localCache.lastUpdate[cacheKey] = now;
    
    // Guardar en localStorage
    saveCacheToStorage();
    
    console.log(`✅ ${cacheKey} obtenidos y cacheados: ${result.length} items en ${duration}ms`);
    return result;
    
  } catch (error) {
    console.error(`❌ Error obteniendo ${cacheKey}:`, error.message);
    
    // Si hay cache, usarlo como fallback
    if (cached && cached.size > 0) {
      console.log(`🔄 Usando cache expirado de ${cacheKey} como fallback (${cached.size} items)`);
      return Array.from(cached.values());
    }
    
    // Si no hay cache, devolver array vacío
    console.log(`📭 No hay ${cacheKey} disponibles offline`);
    return [];
  }
}

// API pública
export const firestoreProxy = {
  // Obtener posts con límite optimizado
  async getPosts(limitCount = 10) { // Reducido de 20 a 10
    return cachedRead('posts', async () => {
      const snapshot = await getDocs(
        query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        )
      );
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
      }));
    });
  },

  // Obtener post por slug con cache local
  async getPostBySlug(slug) {
    try {
      return await retryOperation(async () => {
        const snapshot = await getDocs(
          query(collection(db, 'posts'), where('slug', '==', slug), limit(1))
        );
        
        if (snapshot.empty) return null;
        
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
        };
      });
    } catch (error) {
      console.error('Error obteniendo post por slug:', error.message);
      
      // Buscar en cache local
      const cachedPosts = Array.from(localCache.posts.values());
      const cachedPost = cachedPosts.find(post => post.slug === slug);
      
      if (cachedPost) {
        console.log('📦 Post encontrado en cache local');
        return cachedPost;
      }
      
      return null;
    }
  },

  // Crear post
  async createPost(postData) {
    try {
      return await retryOperation(async () => {
        const docRef = await addDoc(collection(db, 'posts'), {
          ...postData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Invalidar cache
        localCache.posts.clear();
        localCache.lastUpdate.posts = 0;
        
        return { id: docRef.id };
      });
    } catch (error) {
      console.error('Error creando post:', error);
      
      // Fallback: guardar en localStorage para sincronizar después
      const offlinePost = {
        id: `offline_${Date.now()}`,
        ...postData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOffline: true
      };
      
      const offlinePosts = JSON.parse(localStorage.getItem('offlinePosts') || '[]');
      offlinePosts.push(offlinePost);
      localStorage.setItem('offlinePosts', JSON.stringify(offlinePosts));
      
      console.log('📱 Post guardado offline para sincronizar después');
      return { id: offlinePost.id, isOffline: true };
    }
  },

  // Obtener usuarios/administradores
  async getUsers() {
    return cachedRead('users', async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  },

  // Crear/actualizar usuario
  async ensureUser(userData) {
    try {
      return await retryOperation(async () => {
        const userRef = doc(db, 'users', userData.uid);
        await updateDoc(userRef, {
          ...userData,
          updatedAt: serverTimestamp()
        });
        
        // Invalidar cache de usuarios
        localCache.users.clear();
        localCache.lastUpdate.users = 0;
        
        return userData;
      });
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      
      // Fallback: usar datos locales
      return {
        ...userData,
        isOffline: true,
        updatedAt: new Date()
      };
    }
  },

  // Sincronizar datos offline
  async syncOfflineData() {
    const offlinePosts = JSON.parse(localStorage.getItem('offlinePosts') || '[]');
    
    if (offlinePosts.length === 0) {
      return { synced: 0, failed: 0 };
    }
    
    let synced = 0;
    let failed = 0;
    
    for (const post of offlinePosts) {
      try {
        await this.createPost(post);
        synced++;
      } catch (error) {
        console.error('Error sincronizando post offline:', error);
        failed++;
      }
    }
    
    if (synced > 0) {
      localStorage.removeItem('offlinePosts');
      console.log(`✅ Sincronizados ${synced} posts offline`);
    }
    
    return { synced, failed };
  },

  // Verificar conectividad
  async checkConnection() {
    try {
      await retryOperation(async () => {
        await getDocs(query(collection(db, 'posts'), limit(1)));
      }, 1); // Solo un intento para verificación rápida
      
      return true;
    } catch (error) {
      return false;
    }
  }
};

// Inicializar cache al cargar el módulo
loadCacheFromStorage();

export default firestoreProxy;