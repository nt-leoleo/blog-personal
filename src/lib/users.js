import firestoreProxy from './firestoreProxy';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

// Cache para admins
let adminEmailsCache = null;
let adminCacheTime = 0;
const ADMIN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

export function isAdminEmail(email = '') {
  return ADMIN_EMAILS.includes(normalizeEmail(email));
}

export async function isEmailAdmin(email = '') {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  // console.log('🔍 Verificando admin para:', normalized);

  // Verificar primero en las variables de entorno
  if (isAdminEmail(normalized)) {
    // console.log('✅ Es admin por variable de entorno');
    return true;
  }

  // Verificar en cache
  if (adminEmailsCache && (Date.now() - adminCacheTime) < ADMIN_CACHE_DURATION) {
    const isInCache = adminEmailsCache.includes(normalized);
    // console.log('📦 Verificado en cache:', isInCache);
    return isInCache;
  }

  // Verificar usando el proxy (con reintentos y fallback)
  try {
    // console.log('🔥 Consultando admins via proxy...');
    const adminEmails = await fetchAdminEmails();
    const exists = adminEmails.includes(normalized);
    // console.log('🔥 Resultado proxy:', exists);
    return exists;
  } catch (error) {
    // console.error('❌ Error verificando admin:', error);
    
    // Fallback: si es el email específico del .env, considerarlo admin
    if (normalized === 'pederneraleonardo729@gmail.com') {
      // console.log('🔄 Fallback: email específico reconocido como admin');
      return true;
    }
    
    return false;
  }
}

export async function fetchAdminEmails() {
  // Siempre empezar con los emails del .env
  const envAdmins = [...ADMIN_EMAILS];
  
  // Verificar cache
  if (adminEmailsCache && (Date.now() - adminCacheTime) < ADMIN_CACHE_DURATION) {
    return adminEmailsCache;
  }

  try {
    // Intentar obtener usuarios de Firestore
    const users = await firestoreProxy.getUsers();
    const firestoreAdmins = users
      .filter(user => user.role === 'ADMIN')
      .map(user => user.email)
      .filter(Boolean);
    
    // Combinar emails del .env con los de Firestore (sin duplicados)
    const allAdminEmails = [...new Set([...envAdmins, ...firestoreAdmins])];
    
    // Actualizar cache
    adminEmailsCache = allAdminEmails;
    adminCacheTime = Date.now();
    
    // console.log('✅ Admin emails obtenidos:', allAdminEmails);
    return allAdminEmails;
    
  } catch (error) {
    // console.error('❌ Error obteniendo admin emails de Firestore:', error);
    
    // Fallback: usar solo los emails de variables de entorno
    adminEmailsCache = envAdmins;
    adminCacheTime = Date.now();
    
    // console.log('📦 Usando admins del .env:', envAdmins);
    return envAdmins;
  }
}

export async function addAdminEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new Error('Correo invalido.');
  }

  try {
    // Crear un usuario admin usando el proxy
    // Generar un UID único basado en el email
    const uid = `admin_${normalized.replace(/[^a-z0-9]/g, '_')}`;
    
    const adminUser = {
      uid: uid,
      email: normalized,
      role: 'ADMIN',
      name: null,
      photoURL: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await firestoreProxy.ensureUser(adminUser);
    
    // Invalidar cache
    adminEmailsCache = null;
    
    // console.log('✅ Admin email agregado:', normalized);
    
  } catch (error) {
    // console.error('❌ Error agregando admin email:', error);
    throw new Error('No se pudo agregar el administrador. Verifica tu conexión.');
  }
}

export async function removeAdminEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  
  // TODO: Implementar eliminación en el proxy
  // console.log('⚠️ Eliminación de admin no implementada aún');
  
  // Invalidar cache
  adminEmailsCache = null;
}

export async function ensureUserDocument(user) {
  // console.log('👤 Creando/actualizando documento de usuario para:', user.email);
  
  try {
    // Verificar si el usuario es admin basado en su email
    const isAdmin = await isEmailAdmin(user.email);
    const role = isAdmin ? 'ADMIN' : 'USER';
    
    // console.log('🔑 Rol asignado:', role, 'para', user.email);

    const userData = {
      uid: user.uid,
      name: user.displayName || null,
      email: user.email || null,
      photoURL: user.photoURL || null,
      role,
      updatedAt: new Date()
    };

    const result = await firestoreProxy.ensureUser(userData);
    
    // console.log('✅ Usuario actualizado via proxy');
    return result;
    
  } catch (error) {
    // console.error('❌ Error actualizando usuario:', error);
    
    // Fallback: crear documento local
    const isAdmin = isAdminEmail(user.email) || user.email === 'pederneraleonardo729@gmail.com';
    
    return {
      uid: user.uid,
      name: user.displayName || null,
      email: user.email || null,
      photoURL: user.photoURL || null,
      role: isAdmin ? 'ADMIN' : 'USER',
      isOffline: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

export async function getRoleFromUserDoc(uid) {
  try {
    const users = await firestoreProxy.getUsers();
    const user = users.find(u => u.uid === uid);
    return user?.role || 'USER';
  } catch (error) {
    // console.error('Error obteniendo rol de usuario:', error);
    return 'USER';
  }
}
