import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '../lib/blog';
import { formatDate } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';

function mediaLabel(mimeType) {
  if (!mimeType) return null;
  if (mimeType.startsWith('image/')) return 'Foto';
  if (mimeType.startsWith('audio/')) return 'Audio';
  return 'Archivo';
}

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isOffline } = useAuth();

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // console.log('🏠 Cargando posts en HomePage...');
      
      // Forzar recarga sin cache si venimos de crear un post
      const forceReload = sessionStorage.getItem('forceReloadPosts') === 'true';
      if (forceReload) {
        localStorage.removeItem('firestore_cache_posts');
        sessionStorage.removeItem('forceReloadPosts');
      }
      
      // Cargar solo los primeros 8 posts para mejorar rendimiento
      const data = await fetchPosts(true, 8);
      setPosts(data);
      
      if (data.length === 0 && !isOffline) {
        setError('No hay publicaciones disponibles.');
      }
    } catch (err) {
      // console.error('❌ Error cargando posts:', err);
      setError('No se pudieron cargar las publicaciones. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  }, [isOffline]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <div className="stack-xl">
      <section className="panel hero-panel">
        <p className="eyebrow">BLOG PERSONAL 143</p>
        <h1>Aca subo mis webadas</h1>
        <p>Para comentar tenés que entrar con tu cuenta de Google o correo, wachín.</p>
        {isOffline && (
          <div className="offline-notice">
            ⚠️ Modo offline - Algunas funciones pueden estar limitadas
          </div>
        )}
      </section>

      <section className="stack-md">
        <div className="row-between">
          <h2>Publicaciones recientes</h2>
          {isOffline && <span className="offline-badge">Offline</span>}
        </div>

        {loading && <p className="state-message">Cargando publicaciones...</p>}
        {error && (
          <div className="state-error">
            {error}
            {isOffline && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                Intenta recargar la página cuando tengas conexión.
              </div>
            )}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="panel muted">
            {isOffline 
              ? 'No hay posts disponibles offline. Conectate a internet para ver las publicaciones.'
              : 'Aun no hay posts. Cuando el admin publique, van a aparecer aca.'
            }
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="post-grid">
            {posts.map((post) => {
              const firstMedia = post.media?.[0];
              return (
                <Link key={post.id} to={`/posts/${post.slug}`} className="post-card-link">
                  <article className="post-card-twitter">
                    <div className="meta-row">
                      <span>{post.authorName || 'Admin'}</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>

                    <h3>{post.title}</h3>

                    <div className="post-content-full">
                      {post.content.split('\n').map((line, i) => (
                        <p key={i}>{line || '\u00A0'}</p>
                      ))}
                    </div>

                    {firstMedia?.mimeType?.startsWith('image/') && (
                      <div className="post-media-preview">
                        <img src={firstMedia.url} alt={post.title} loading="lazy" />
                      </div>
                    )}

                    {firstMedia?.mimeType?.startsWith('video/') && (
                      <div className="post-media-preview">
                        <video src={firstMedia.url} controls preload="metadata" />
                      </div>
                    )}

                    <div className="post-stats">
                      <span>{post.commentsCount || 0} comentarios</span>
                      {post.mediaCount > 0 && <span>· {post.mediaCount} adjunto{post.mediaCount === 1 ? '' : 's'}</span>}
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
