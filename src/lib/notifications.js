// Función para enviar notificación cuando se crea un nuevo post
export async function sendPostNotification(postTitle, postContent, imageUrl = null) {
  // Verificar si las notificaciones están habilitadas
  const notificationsEnabled = localStorage.getItem('notificationsEnabled');
  
  if (notificationsEnabled === 'true' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      // Truncar contenido a 100 caracteres
      const truncatedContent = postContent.length > 100 
        ? postContent.substring(0, 100) + '...' 
        : postContent;

      const options = {
        body: truncatedContent,
        icon: imageUrl || '/favicon.ico',
        tag: 'new-post',
        requireInteraction: false,
        badge: '/favicon.ico'
      };

      // Si hay imagen, agregarla como preview
      if (imageUrl) {
        options.image = imageUrl;
      }

      new Notification(`📝 ${postTitle}`, options);
    } catch (error) {
      // console.error('Error al enviar notificación:', error);
    }
  }
}

// Función para enviar notificación cuando alguien comenta (solo para admins)
export async function sendCommentNotification(userName, commentContent, postTitle, isAdmin = false) {
  // Solo enviar a admins
  if (!isAdmin) return;

  const notificationsEnabled = localStorage.getItem('notificationsEnabled');
  
  if (notificationsEnabled === 'true' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      // Truncar comentario a 80 caracteres
      const truncatedComment = commentContent.length > 80 
        ? commentContent.substring(0, 80) + '...' 
        : commentContent;

      new Notification(`💬 ${userName} comentó`, {
        body: `En "${postTitle}":\n${truncatedComment}`,
        icon: '/favicon.ico',
        tag: 'new-comment',
        requireInteraction: false,
        badge: '/favicon.ico'
      });
    } catch (error) {
      // console.error('Error al enviar notificación de comentario:', error);
    }
  }
}

// Función para verificar y solicitar permisos de notificación
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    // console.log('Este navegador no soporta notificaciones');
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

// Función para verificar si las notificaciones están habilitadas
export function areNotificationsEnabled() {
  return localStorage.getItem('notificationsEnabled') === 'true' && 
         'Notification' in window && 
         Notification.permission === 'granted';
}

// Función para activar/desactivar notificaciones
export async function toggleNotifications() {
  const currentState = localStorage.getItem('notificationsEnabled') === 'true';
  
  if (!currentState) {
    // Intentar activar
    const granted = await requestNotificationPermission();
    if (granted) {
      localStorage.setItem('notificationsEnabled', 'true');
      return true;
    }
    return false;
  } else {
    // Desactivar
    localStorage.setItem('notificationsEnabled', 'false');
    return false;
  }
}