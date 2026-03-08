import { isEmailAdmin, addAdminEmail } from './users';

// Función para verificar y asegurar que un correo sea admin
export async function ensureAdminAccess(email) {
  try {
    const isAdmin = await isEmailAdmin(email);
    
    if (!isAdmin) {
      console.log(`Agregando ${email} como administrador...`);
      await addAdminEmail(email);
      console.log(`${email} ahora es administrador`);
      return true;
    }
    
    console.log(`${email} ya es administrador`);
    return true;
  } catch (error) {
    console.error('Error verificando/agregando admin:', error);
    return false;
  }
}

// Función para verificar el estado actual de admin de un correo
export async function checkAdminStatus(email) {
  try {
    const isAdmin = await isEmailAdmin(email);
    console.log(`Estado de admin para ${email}:`, isAdmin ? 'SÍ es admin' : 'NO es admin');
    return isAdmin;
  } catch (error) {
    console.error('Error verificando estado de admin:', error);
    return false;
  }
}

// Lista de correos que deben ser admin por defecto
const DEFAULT_ADMIN_EMAILS = [
  'pederneraleonardo729@gmail.com'
];

// Función para inicializar admins por defecto
export async function initializeDefaultAdmins() {
  console.log('Verificando administradores por defecto...');
  
  for (const email of DEFAULT_ADMIN_EMAILS) {
    await ensureAdminAccess(email);
  }
  
  console.log('Verificación de administradores completada');
}