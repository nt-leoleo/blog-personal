import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AccountModal from './AccountModal';
import { MoonIcon, SunIcon } from './Icons';

export default function SiteHeader() {
  const { user, isAdmin, userDoc, isOffline } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showAccountModal, setShowAccountModal] = useState(false);

  // FORZAR ADMIN para debugging - verificar múltiples condiciones
  const forceAdmin = user && (
    isAdmin || 
    userDoc?.role === 'ADMIN' ||
    user.email === 'pederneraleonardo729@gmail.com' ||
    user.email?.toLowerCase().includes('pederneraleonardo729')
  );

  console.log('🔍 SiteHeader - Estado de admin:', {
    user: !!user,
    email: user?.email,
    isAdmin,
    userDocRole: userDoc?.role,
    forceAdmin,
    isOffline
  });

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <div className="site-header__left">
            <Link to="/" className="brand-link">
              blog personal 143
            </Link>
            <nav className="site-nav">
              <NavLink to="/">Inicio</NavLink>
              {/* Mostrar siempre para tu email específico */}
              {(forceAdmin || user?.email === 'pederneraleonardo729@gmail.com') && (
                <NavLink to="/admin" style={{ 
                  background: forceAdmin ? 'green' : 'red',
                  color: 'white',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px'
                }}>
                  Subir {isOffline ? '(Offline)' : ''}
                </NavLink>
              )}
            </nav>
          </div>

          <div className="site-header__actions">
            <button
              onClick={toggleDarkMode}
              className="theme-toggle"
              title={isDarkMode ? 'Modo claro' : 'Modo nocturno'}
            >
              {isDarkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
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
