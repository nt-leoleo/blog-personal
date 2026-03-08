import { useState, useEffect } from 'react';
import { BellIcon } from './Icons';

export default function NotificationModal() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Verificar si ya se pidieron las notificaciones
    const notificationPermission = localStorage.getItem('notificationRequested');
    
    if (!notificationPermission && 'Notification' in window) {
      setShowModal(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      localStorage.setItem('notificationRequested', 'true');
      
      if (permission === 'granted') {
        localStorage.setItem('notificationsEnabled', 'true');
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      setShowModal(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('notificationRequested', 'true');
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="notification-modal-overlay">
      <div className="notification-modal">
        <div className="notification-icon">
          <BellIcon size={32} />
        </div>
        <h3>¡Activá las notificaciones!</h3>
        <p>Recibí una notificación cuando suba nuevos posts</p>
        <div className="notification-modal-actions">
          <button 
            onClick={handleEnableNotifications}
            className="btn btn-primary"
          >
            Activar
          </button>
          <button 
            onClick={handleSkip}
            className="btn btn-outline"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}