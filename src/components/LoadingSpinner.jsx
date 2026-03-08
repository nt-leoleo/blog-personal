export default function LoadingSpinner({ size = 'md', message = 'Cargando...' }) {
  const sizeClasses = {
    sm: 'loading-spinner-sm',
    md: 'loading-spinner-md',
    lg: 'loading-spinner-lg'
  };

  return (
    <div className="loading-container">
      <div className={`loading-spinner ${sizeClasses[size]}`}>
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}