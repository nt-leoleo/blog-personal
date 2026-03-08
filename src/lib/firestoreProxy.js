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
import { db } from './firebase';

// Cache local robusto
const localCache = {
  posts: new Map(),
  users: new Map(),
  lastUpdate: {
    posts: 0,
    users: 0
  }
};

// Configuración
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// Función para reintentar operaciones
async function retryOperation(operation, attempts = RETRY_ATTEMPTS) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await operation();
    } catch (error) {
      // Solo loggear en el último intento para evitar spam
      if (i === attempts - 1) {
        console.log(`Operación falló después de ${attempts} intentos:`, error.message);
      }
      
      if (i === attempts - 1) {
        throw error;
      }
      
      // Esperar antes del siguiente intento (backoff exponencial)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, i)));
    }
  }
}

// Wrapper para operaciones de lectura con cache
async function cachedRead(cacheKey, operation, cacheDuration = CACHE_DURATION) {
  const now = Date.now();
  const cached = localCache[cacheKey];
  const lastUpdate = localCache.lastUpdate[cacheKey];
  
  // Usar cache si está disponible y no ha expirado
  if (cached && cached.size > 0 && (now - lastUpdate) < cacheDuration) {
    console.log(`📦 Usando ${cacheKey} desde cache local`);
    return Array.from(cached.values());
  }
  
  try {
    console.log(`🔄 Consultando ${cacheKey} desde Firestore...`);
    const result = await retryOperation(operation);
    
    // Actualizar cache
    localCache[cacheKey].clear();
    result.forEach((item, index) => {
      localCache[cacheKey].set(item.id || index, item);
    });
    localCache.lastUpdate[cacheKey] = now;
    
    console.log(`✅ ${cacheKey} obtenidos y cacheados:`, result.length);
    return result;
    
  } catch (error) {
    console.error(`❌ Error obteniendo ${cacheKey}:`, error);
    
    // Si hay cache, usarlo como fallback
    if (cached && cached.size > 0) {
      console.log(`🔄 Usando cache expirado de ${cacheKey} como fallback`);
      return Array.from(cached.values());
    }
    
    // Si no hay cache, devolver array vacío
    console.log(`📭 No hay ${cacheKey} disponibles offline`);
    return [];
  }
}

// API pública
export const firestoreProxy = {
  // Obtener posts
  async getPosts(limitCount = 20) {
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

  // Obtener post por slug
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
      console.error('Error obteniendo post por slug:', error);
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

// Inicializar cache
localCache.posts = new Map();
localCache.users = new Map();

export default firestoreProxy;