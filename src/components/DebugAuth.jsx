import { useAuth } from '../contexts/AuthContext';

export default function DebugAuth() {
  const { user, userDoc, loading, isAdmin, isOffline } = useAuth();

  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Debug Auth</h4>
      <p><strong>Loading:</strong> {loading ? 'Sí' : 'No'}</p>
      <p><strong>User:</strong> {user ? 'Logueado' : 'No logueado'}</p>
      <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
      <p><strong>UserDoc:</strong> {userDoc ? 'Existe' : 'No existe'}</p>
      <p><strong>Role:</strong> {userDoc?.role || 'N/A'}</p>
      <p><strong>IsAdmin:</strong> {isAdmin ? 'SÍ' : 'NO'}</p>
      <p><strong>IsOffline:</strong> {isOffline ? 'SÍ' : 'NO'}</p>
      <p><strong>Fallback:</strong> {userDoc?.isOfflineFallback ? 'SÍ' : 'NO'}</p>
      <p><strong>DisplayName:</strong> {user?.displayName || 'N/A'}</p>
    </div>
  );
}