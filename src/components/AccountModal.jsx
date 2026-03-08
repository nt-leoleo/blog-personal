import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function AccountModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      await updateProfile(user, {
        displayName: displayName.trim()
      });
      setMessage('Perfil actualizado correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setMessage('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Configuración de cuenta</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="account-info">
          {user?.photoURL && (
            <img 
              src={user.photoURL} 
              alt="Foto de perfil" 
              className="profile-photo-large"
            />
          )}
          <p className="user-email">{user?.email}</p>
        </div>

        <form onSubmit={handleSave} className="stack-sm">
          <label className="label" htmlFor="displayName">
            Nombre para mostrar
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
            placeholder="Tu nombre"
          />

          <div className="setting-row">
            <span>Modo nocturno</span>
            <button
              type="button"
              onClick={toggleDarkMode}
              className={`toggle-btn ${isDarkMode ? 'active' : ''}`}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>

          {message && (
            <p className={message.includes('Error') ? 'state-error' : 'state-message'}>
              {message}
            </p>
          )}

          <div className="modal-actions">
            <button 
              type="submit" 
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button 
              type="button"
              onClick={handleLogout}
              className="btn btn-outline btn-danger-outline"
            >
              Cerrar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}