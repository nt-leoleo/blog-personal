import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '../lib/blog';
import { formatDate } from '../lib/format';

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

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      // Cargar solo los primeros 10 posts para mejorar rendimiento
      const data = await fetchPosts(true, 10);
      setPosts(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las publicaciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <div className="stack-xl">
      <section className="panel hero-panel">
        <p className="eyebrow">BLOG PERSONAL 143</p>
        <h1>Aca subo mis webadas</h1>
        <p>Para comentar tenés que entrar con tu cuenta de Google o correo, wachín.</p>
      </section>

      <section className="stack-md">
        <div className="row-between">
          <h2>Publicaciones recientes</h2>
        </div>

        {loading && <p className="state-message">Cargando publicaciones...</p>}
        {error && <p className="state-error">{error}</p>}

        {!loading && !error && posts.length === 0 && (
          <div className="panel muted">Aun no hay posts. Cuando el admin publique, van a aparecer aca.</div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="post-grid">
            {posts.map((post) => {
              const firstMedia = post.media?.[0];
              return (
                <article key={post.id} className="post-card">
                  <div className="meta-row">
                    <span>{formatDate(post.createdAt)}</span>
                    <span>{post.commentsCount || 0} comentarios</span>
                  </div>

                  <h3>
                    <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                  </h3>

                  <p className="excerpt">{post.content}</p>

                  <div className="chip-row">
                    <span className="chip">{post.mediaCount || 0} adjunto{post.mediaCount === 1 ? '' : 's'}</span>
                    {firstMedia?.mimeType && <span className="chip">{mediaLabel(firstMedia.mimeType)}</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
