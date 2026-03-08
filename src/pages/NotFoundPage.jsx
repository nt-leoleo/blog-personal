import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="stack-md">
      <h1>Pagina no encontrada</h1>
      <p className="state-message">No existe la ruta que intentaste abrir.</p>
      <Link to="/" className="btn btn-primary btn-fit">
        Volver al inicio
      </Link>
    </div>
  );
}
