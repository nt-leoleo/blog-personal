import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import FirestoreDiagnostic from './FirestoreDiagnostic';

export default function DebugAuth() {
  const { user, userDoc, loading, isAdmin, isOffline } = useAuth();
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // Mostrar siempre en desarrollo Y para el email específico
  const isDev = !import.meta.env.PROD || window.location.hostname === 'localhost';
  const isTargetUser = user?.email === 'pederneraleonardo729@gmail.com';
  
  if (!isDev && !isTargetUser) return null;

  const handleForceAdmin = () => {
    // console.log('🔧 Forzando recarga de permisos...');
    window.location.reload();
  };

  const handleClearCache = () => {
    // console.log('🗑️ Limpiando cache...');
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const handleDiagnostic = () => {
    setShowDiagnostic(true);
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: isOffline ? 'rgba(255,100,0,0.95)' : 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '11px',
        zIndex: 9999,
        maxWidth: '320px',
        border: `2px solid ${isOffline ? '#ff6600' : '#00ff00'}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: isOffline ? '#ffaa00' : '#00ff00' }}>
          🔍 DEBUG AUTH {isOffline ? '(OFFLINE)' : '(ONLINE)'}
        </h4>
        <p><strong>Loading:</strong> {loading ? '🔄 Sí' : '✅ No'}</p>
        <p><strong>User:</strong> {user ? '✅ Logueado' : '❌ No logueado'}</p>
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        <p><strong>UserDoc:</strong> {userDoc ? '✅ Existe' : '❌ No existe'}</p>
        <p><strong>Role:</strong> {userDoc?.role || 'N/A'}</p>
        <p><strong>IsAdmin:</strong> {isAdmin ? '✅ SÍ' : '❌ NO'}</p>
        <p><strong>IsOffline:</strong> {isOffline ? '⚠️ SÍ' : '✅ NO'}</p>
        <p><strong>Fallback:</strong> {userDoc?.isOfflineFallback ? '⚠️ SÍ' : '✅ NO'}</p>
        <p><strong>DisplayName:</strong> {user?.displayName || 'N/A'}</p>
        <p><strong>PhotoURL:</strong> {user?.photoURL ? '✅ Sí' : '❌ No'}</p>
        
        {user?.email === 'pederneraleonardo729@gmail.com' && (
          <div style={{ marginTop: '8px', padding: '6px', background: '#00aa00', borderRadius: '4px' }}>
            ✅ EMAIL CORRECTO - Deberías ver el botón "Subir"
          </div>
        )}
        
        {!isAdmin && user?.email === 'pederneraleonardo729@gmail.com' && (
          <div style={{ marginTop: '4px', padding: '6px', background: '#cc0000', borderRadius: '4px' }}>
            ⚠️ PROBLEMA: Email correcto pero no es admin
          </div>
        )}

        {isOffline && (
          <div style={{ marginTop: '4px', padding: '6px', background: '#ff6600', borderRadius: '4px' }}>
            🚫 Firestore con problemas de conexión
          </div>
        )}
        
        <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleForceAdmin}
            style={{
              padding: '4px 8px',
              background: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            🔄 Recargar
          </button>
          
          <button 
            onClick={handleClearCache}
            style={{
              padding: '4px 8px',
              background: '#cc6600',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            🗑️ Cache
          </button>

          <button 
            onClick={handleDiagnostic}
            style={{
              padding: '4px 8px',
              background: '#cc0066',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            🔍 Diagnóstico
          </button>
        </div>
      </div>

      {showDiagnostic && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 10000
        }}>
          <FirestoreDiagnostic />
          <button
            onClick={() => setShowDiagnostic(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}