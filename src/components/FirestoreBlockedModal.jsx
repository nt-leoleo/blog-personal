import { useState, useEffect } from 'react';
import { XIcon } from './Icons';

export default function FirestoreBlockedModal({ isBlocked, onRetry, consecutiveFailures = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);

  useEffect(() => {
    // Solo mostrar si:
    // 1. Realmente está bloqueado
    // 2. Ha habido múltiples fallos consecutivos (3+)
    // 3. No ha sido mostrado antes
    // 4. El usuario no lo ha descartado
    if (isBlocked && consecutiveFailures >= 3 && !hasBeenShown && !userDismissed) {
      // Esperar un poco más para evitar falsos positivos
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasBeenShown(true);
      }, 5000); // 5 segundos de delay adicional
      
      return () => clearTimeout(timer);
    }
  }, [isBlocked, consecutiveFailures, hasBeenShown, userDismissed]);

  const handleClose = () => {
    setIsVisible(false);
    setUserDismissed(true);
    // Guardar en localStorage que el usuario descartó el modal
    localStorage.setItem('firestoreModalDismissed', 'true');
  };

  const handleRetry = () => {
    setIsVisible(false);
    setHasBeenShown(false);
    setUserDismissed(false);
    localStorage.removeItem('firestoreModalDismissed');
    onRetry();
  };

  const handleDisableAdblock = () => {
    window.open('https://support.google.com/chrome/answer/7632919?hl=es', '_blank');
  };

  // Verificar si el usuario ya descartó el modal anteriormente
  useEffect(() => {
    const dismissed = localStorage.getItem('firestoreModalDismissed');
    if (dismissed === 'true') {
      setUserDismissed(true);
    }
  }, []);

  // No mostrar si no es visible o si hay menos de 3 fallos consecutivos
  if (!isVisible || consecutiveFailures < 3) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 style={{ color: '#ff6600', margin: 0 }}>
            🚫 Problema de Conexión
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
              Detectamos problemas persistentes para conectar con la base de datos.
            </p>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Esto puede deberse a un adblocker o extensión de privacidad que está bloqueando la conexión.
            </p>
          </div>

          <h3 style={{ marginTop: 0 }}>Posibles soluciones:</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#00aa00' }}>
              ✅ Opción 1: Verificar adblocker
            </h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
              Si tienes uBlock Origin, AdBlock u otro bloqueador, prueba deshabilitarlo temporalmente para este sitio.
            </p>
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
              📖 Ver instrucciones
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#ff6600' }}>
              🔄 Opción 2: Recargar la página
            </h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
              A veces es solo un problema temporal de red.
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#6600cc' }}>
              🌐 Opción 3: Probar otro navegador
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Chrome, Firefox, Safari o Edge sin extensiones.
            </p>
          </div>

          <div style={{ 
            background: '#e7f3ff', 
            border: '1px solid #b3d9ff', 
            borderRadius: '8px', 
            padding: '12px',
            fontSize: '13px',
            color: '#0066cc'
          }}>
            <strong>Nota:</strong> El blog seguirá funcionando en modo básico, pero algunas funciones como crear posts pueden estar limitadas hasta resolver la conexión.
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
            🔄 Reintentar
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
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}