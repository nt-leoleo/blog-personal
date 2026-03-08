import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function mapAuthError(error) {
  if (!error?.code) return 'No se pudo crear la cuenta.';
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Ese correo ya esta registrado.';
    case 'auth/invalid-email':
      return 'Correo invalido.';
    case 'auth/weak-password':
      return 'La clave debe tener al menos 6 caracteres.';
    default:
      return 'No se pudo crear la cuenta.';
  }
}

export default function RegisterPage() {
  const { registerWithEmail, loginWithGoogle, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const callbackUrl = params.get('callbackUrl') || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleRegister = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      await registerWithEmail({ name, email, password });
      navigate(callbackUrl);
    } catch (err) {
      setMessage(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setMessage('');
    setSubmitting(true);

    try {
      await loginWithGoogle();
      navigate(callbackUrl);
    } catch {
      setMessage('No se pudo continuar con Google.');
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
        <h1>Crear cuenta</h1>
        <p>Registrate con correo para poder comentar en el blog.</p>
      </header>

      <div className="panel stack-md">
        <button type="button" onClick={handleGoogle} className="btn btn-primary" disabled={submitting}>
          Continuar con Google
        </button>

        <div className="divider">o registrarte con correo</div>

        <form onSubmit={handleRegister} className="stack-sm">
          <label className="label" htmlFor="name">Nombre</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="input"
            placeholder="Tu nombre"
          />

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
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input"
            placeholder="Minimo 6 caracteres"
          />

          {message && <p className="state-error">{message}</p>}

          <button type="submit" disabled={submitting} className="btn btn-outline">
            {submitting ? 'Creando cuenta...' : 'Crear cuenta con correo'}
          </button>
        </form>
      </div>

      <p className="auth-footer">
        Ya tienes cuenta? <Link to="/login" className="text-link">Ingresar</Link>
      </p>
    </div>
  );
}
