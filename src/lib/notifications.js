// Función para enviar notificación cuando se crea un nuevo post
export function sendPostNotification(postTitle) {
  // Verificar si las notificaciones están habilitadas
  const notificationsEnabled = localStorage.getItem('notificationsEnabled');
  
  if (notificationsEnabled === 'true' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('¡Nuevo post disponible!', {
        body: `Se publicó: "${postTitle}"`,
        icon: '/favicon.ico', // Puedes cambiar esto por tu icono
        tag: 'new-post', // Evita notificaciones duplicadas
        requireInteraction: false
      });
    } catch (error) {
      console.error('Error al enviar notificación:', error);
    }
  }
}

// Función para verificar y solicitar permisos de notificación
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}