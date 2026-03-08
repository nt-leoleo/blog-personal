import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SiteHeader() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__left">
          <Link to="/" className="brand-link">
            Blog personal
          </Link>
          <nav className="site-nav">
            <NavLink to="/">Inicio</NavLink>
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          </nav>
        </div>

        <div className="site-header__actions">
          {user ? (
            <>
              <span className="user-chip">{user.displayName || user.email || 'Usuario'}</span>
              <button type="button" className="btn btn-outline" onClick={handleLogout}>
                Salir
              </button>
            </>
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
  );
}
