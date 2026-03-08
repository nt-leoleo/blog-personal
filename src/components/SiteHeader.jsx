import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AccountModal from './AccountModal';

export default function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showAccountModal, setShowAccountModal] = useState(false);

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <div className="site-header__left">
            <Link to="/" className="brand-link">
              Blog personal
            </Link>
            <nav className="site-nav">
              <NavLink to="/">Inicio</NavLink>
              {isAdmin && <NavLink to="/admin">Subir</NavLink>}
            </nav>
          </div>

          <div className="site-header__actions">
            <button
              onClick={toggleDarkMode}
              className="theme-toggle"
              title={isDarkMode ? 'Modo claro' : 'Modo nocturno'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {user ? (
              <button
                onClick={() => setShowAccountModal(true)}
                className="user-profile-btn"
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Perfil" 
                    className="profile-photo"
                  />
                ) : (
                  <div className="profile-placeholder">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">
                  Ingresar
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <AccountModal 
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
    </>
  );
}
