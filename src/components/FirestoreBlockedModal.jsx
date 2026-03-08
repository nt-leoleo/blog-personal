import { useState, useEffect } from 'react';
import { XIcon } from './Icons';

export default function FirestoreBlockedModal({ isBlocked, onRetry }) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    if (isBlocked && !hasBeenShown) {
      setIsVisible(true);
      setHasBeenShown(true);
    }
  }, [isBlocked, hasBeenShown]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleRetry = () => {
    setIsVisible(false);
    setHasBeenShown(false);
    onRetry();
  };

  const handleDisableAdblock = () => {
    // Abrir instrucciones en nueva pestaña
    window.open('https://support.google.com/chrome/answer/7632919?hl=es', '_blank');
  };

  if (!isVisible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 style={{ color: '#ff6600', margin: 0 }}>
            🚫 Conexión Bloqueada
          </h2>
          <button onClick={handleClose} className="modal-close">
            <XIcon size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ 
            background: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '20px' 
          }}>
            <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>
              Tu adblocker está bloqueando la conexión a la base de datos.
            </p>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Esto impide que puedas crear posts, ver la lista de administradores y usar todas las funciones del blog.
            </p>
          </div>

          <h3 style={{ marginTop: 0 }}>Soluciones:</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#00aa00' }}>
              ✅ Opción 1: Deshabilitar adblocker para este sitio
            </h4>
            <ol style={{ margin: '0 0 12px 20px', fontSize: '14px' }}>
              <li>Haz clic en el ícono de tu adblocker (uBlock Origin, AdBlock, etc.)</li>
              <li>Selecciona "Deshabilitar en este sitio" o "Pausar en este sitio"</li>
              <li>Recarga la página</li>
            </ol>
            <button 
              onClick={handleDisableAdblock}
              style={{
                background: '#0066cc',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📖 Ver instrucciones detalladas
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#ff6600' }}>
              🔄 Opción 2: Probar en modo incógnito
            </h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
              Abre una ventana de incógnito (Ctrl+Shift+N) donde los adblockers suelen estar deshabilitados.
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#6600cc' }}>
              🌐 Opción 3: Cambiar de navegador
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Prueba con otro navegador que no tenga adblockers instalados.
            </p>
          </div>

          <div style={{ 
            background: '#f8f9fa', 
            border: '1px solid #dee2e6', 
            borderRadius: '8px', 
            padding: '12px',
            fontSize: '13px',
            color: '#6c757d'
          }}>
            <strong>¿Por qué pasa esto?</strong><br />
            Los adblockers bloquean conexiones a <code>firestore.googleapis.com</code> 
            porque algunos sitios maliciosos usan servicios similares. Tu blog es completamente 
            seguro, pero el adblocker no puede distinguirlo.
          </div>
        </div>

        <div className="modal-footer">
          <button 
            onClick={handleRetry}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔄 Reintentar conexión
          </button>
          
          <button 
            onClick={handleClose}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginLeft: '10px'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}