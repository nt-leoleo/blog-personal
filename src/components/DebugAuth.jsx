import { useAuth } from '../contexts/AuthContext';

export default function DebugAuth() {
  const { user, userDoc, loading, isAdmin, isOffline } = useAuth();

  // Mostrar siempre en desarrollo, no solo cuando PROD es false
  const isDev = !import.meta.env.PROD || window.location.hostname === 'localhost';
  
  if (!isDev) return null;

  const handleForceAdmin = () => {
    console.log('🔧 Forzando recarga de permisos...');
    window.location.reload();
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '11px',
      zIndex: 9999,
      maxWidth: '320px',
      border: '2px solid #00ff00'
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#00ff00' }}>🔍 DEBUG AUTH</h4>
      <p><strong>Loading:</strong> {loading ? '🔄 Sí' : '✅ No'}</p>
      <p><strong>User:</strong> {user ? '✅ Logueado' : '❌ No logueado'}</p>
      <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
      <p><strong>UserDoc:</strong> {userDoc ? '✅ Existe' : '❌ No existe'}</p>
      <p><strong>Role:</strong> {userDoc?.role || 'N/A'}</p>
      <p><strong>IsAdmin:</strong> {isAdmin ? '✅ SÍ' : '❌ NO'}</p>
      <p><strong>IsOffline:</strong> {isOffline ? '⚠️ SÍ' : '✅ NO'}</p>
      <p><strong>Fallback:</strong> {userDoc?.isOfflineFallback ? '⚠️ SÍ' : '✅ NO'}</p>
      <p><strong>DisplayName:</strong> {user?.displayName || 'N/A'}</p>
      
      {user?.email === 'pederneraleonardo729@gmail.com' && (
        <div style={{ marginTop: '8px', padding: '4px', background: 'green', borderRadius: '4px' }}>
          ✅ EMAIL CORRECTO - Deberías ser admin
        </div>
      )}
      
      <button 
        onClick={handleForceAdmin}
        style={{
          marginTop: '8px',
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
    </div>
  );
}