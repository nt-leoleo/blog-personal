import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function mapAuthError(error) {
  if (!error?.code) return 'No se pudo iniciar sesion.';
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o clave incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta mas tarde.';
    default:
      return 'No se pudo iniciar sesion.';
  }
}

export default function LoginPage() {
  const { loginWithEmail, loginWithGoogle, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const callbackUrl = params.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCredentials = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await loginWithEmail({ email, password });
      navigate(callbackUrl);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSubmitting(true);

    try {
      await loginWithGoogle();
      navigate(callbackUrl);
    } catch {
      setError('No se pudo iniciar sesion con Google.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="state-message">Cargando...</p>;
  }

  return (
    <div className="auth-wrapper">
      <header className="auth-header">
        <h1>Ingresar</h1>
        <p>Necesitas una cuenta para comentar publicaciones.</p>
      </header>

      <div className="panel stack-md">
        <button type="button" onClick={handleGoogle} className="btn btn-primary" disabled={submitting}>
          Continuar con Google
        </button>

        <div className="divider">o ingresar con correo</div>

        <form onSubmit={handleCredentials} className="stack-sm">
          <label className="label" htmlFor="email">Correo</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
            placeholder="tu-correo@dominio.com"
          />

          <label className="label" htmlFor="password">Clave</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input"
            placeholder="********"
          />

          {error && <p className="state-error">{error}</p>}

          <button type="submit" disabled={submitting} className="btn btn-outline">
            {submitting ? 'Ingresando...' : 'Ingresar con correo'}
          </button>
        </form>
      </div>

      <p className="auth-footer">
        No tenes cuenta? <Link to="/register" className="text-link">Registrate</Link>
      </p>
    </div>
  );
}
