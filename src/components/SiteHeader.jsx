import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AccountModal from './AccountModal';
import { MoonIcon, SunIcon, BellIcon, BellActiveIcon, BellOffIcon } from './Icons';
import { toggleNotifications, areNotificationsEnabled } from '../lib/notifications';

export default function SiteHeader() {
  const { user, isAdmin, userDoc, isOffline } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // FORZAR ADMIN - verificaciones múltiples y específicas
  const isTargetEmail = user?.email === 'pederneraleonardo729@gmail.com';
  const forceAdmin = user && (
    isAdmin || 
    userDoc?.role === 'ADMIN' ||
    isTargetEmail ||
    user.email?.toLowerCase().includes('pederneraleonardo729')
  );

  // GARANTIZAR que aparezca para el email específico
  const shouldShowAdminButton = forceAdmin || isTargetEmail;

  // Verificar estado de notificaciones al cargar
  useEffect(() => {
    setNotificationsEnabled(areNotificationsEnabled());
  }, []);

  const handleToggleNotifications = async () => {
    const newState = await toggleNotifications();
    setNotificationsEnabled(newState);
  };

  // console.log('🔍 SiteHeader - Estado de admin:', {
  //   user: !!user,
  //   email: user?.email,
  //   isAdmin,
  //   userDocRole: userDoc?.role,
  //   forceAdmin,
  //   isTargetEmail,
  //   shouldShowAdminButton,
  //   isOffline
  // });

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
              {/* GARANTIZAR que aparezca para el email específico */}
              {shouldShowAdminButton && (
                <NavLink 
                  to="/admin" 
                  style={{ 
                    background: isTargetEmail ? '#00ff00' : (forceAdmin ? '#0066cc' : '#ff6600'),
                    color: 'white',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    textDecoration: 'none'
                  }}
                >
                  Subir {isOffline ? '(Offline)' : ''}
                </NavLink>
              )}
            </nav>
          </div>

          <div className="site-header__actions">
            <button
              onClick={handleToggleNotifications}
              className="notification-toggle"
              title={notificationsEnabled ? 'Notificaciones activadas' : 'Notificaciones desactivadas'}
            >
              {notificationsEnabled ? (
                <BellActiveIcon size={20} />
              ) : (
                <BellOffIcon size={20} />
              )}
            </button>

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
