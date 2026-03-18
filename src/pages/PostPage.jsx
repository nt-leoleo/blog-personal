﻿iimport { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addCommentToPost, fetchComments, fetchPostBySlug } from '../lib/blog';
import { formatBytes, formatDate } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';
import { sendCommentNotification } from '../lib/notifications';

function renderParagraphs(content) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export default function PostPage() {
  const { slug } = useParams();
  const { user, isAdmin } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingComment, setSavingComment] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadPost = async () => {
      try {
        setLoading(true);
        const found = await fetchPostBySlug(slug);

        if (!found) {
          if (mounted) {
            setPost(null);
            setComments([]);
          }
          return;
        }

        const postComments = await fetchComments(found.id);

        if (mounted) {
          setPost(found);
          setComments(postComments);
        }
      } catch (err) {
        // console.error(err);
        if (mounted) {
          setError('No se pudo cargar la publicacion.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPost();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const submitComment = async (event) => {
    event.preventDefault();
    const content = commentText.trim();

    if (content.length < 2 || !post || !user) {
      setError('El comentario es demasiado corto.');
      return;
    }

    setSavingComment(true);
    setError('');

    try {
      await addCommentToPost({ postId: post.id, content, user });
      const postComments = await fetchComments(post.id);
      setComments(postComments);
      setCommentText('');
      setPost((prev) => (prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev));
      
      // Enviar notificación a los admins
      const userName = user.displayName || user.email || 'Anónimo';
      sendCommentNotification(userName, content, post.title, isAdmin);
    } catch (err) {
      // console.error(err);
      setError('No se pudo publicar el comentario.');
    } finally {
      setSavingComment(false);
    }
  };

  if (loading) {
    return <p className="state-message">Cargando publicacion...</p>;
  }

  if (!post) {
    return (
      <div className="stack-md">
        <p className="state-message">No encontramos esa publicacion.</p>
        <Link to="/" className="text-link">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <article className="stack-xl">
      <Link to="/" className="text-link">
        Volver al inicio
      </Link>

      <header className="panel stack-md">
        <p className="meta-text">
          {formatDate(post.createdAt)} por {post.authorName || 'Admin'}
        </p>
        <h1>{post.title}</h1>
        <div className="prose-blog">
          {renderParagraphs(post.content).map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>
          ))}
        </div>
      </header>

      {post.media?.length > 0 && (
        <section className="panel stack-md">
          <h2>Adjuntos</h2>
          <div className="media-grid">
            {post.media.map((file) => {
              if (file.mimeType?.startsWith('image/')) {
                return (
                  <figure key={file.url} className="media-card">
                    <img src={file.url} alt={file.fileName} loading="lazy" />
                    <figcaption>{file.fileName}</figcaption>
                  </figure>
                );
              }

              if (file.mimeType?.startsWith('video/')) {
                return (
                  <figure key={file.url} className="media-card">
                    <video controls preload="metadata" style={{ width: '100%', maxHeight: '500px' }}>
                      <source src={file.url} type={file.mimeType} />
                      Tu navegador no soporta videos.
                    </video>
                    <figcaption>{file.fileName}</figcaption>
                  </figure>
                );
              }

              if (file.mimeType?.startsWith('audio/')) {
                return (
                  <div key={file.url} className="media-card audio-card">
                    <p>{file.fileName}</p>
                    <audio controls preload="metadata">
                      <source src={file.url} type={file.mimeType} />
                    </audio>
                  </div>
                );
              }

              return (
                <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="file-link-card">
                  <span>{file.fileName}</span>
                  <span>{formatBytes(file.size)}</span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <section className="stack-md">
        <h2>Comentarios ({comments.length})</h2>

        {user ? (
          <form onSubmit={submitComment} className="panel stack-sm">
            <label htmlFor="comment" className="label">
              Deja tu comentario
            </label>
            <textarea
              id="comment"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              rows={4}
              className="input"
              placeholder="Escribi algo..."
              disabled={savingComment}
            />
            <button type="submit" className="btn btn-primary" disabled={savingComment}>
              {savingComment ? 'Publicando...' : 'Publicar comentario'}
            </button>
          </form>
        ) : (
          <div className="panel muted">
            Para comentar tenes que <Link to="/login" className="text-link">ingresar</Link> con Google o correo.
          </div>
        )}

        {error && <p className="state-error">{error}</p>}

        <div className="stack-sm">
          {comments.length === 0 && <div className="panel muted">Todavia no hay comentarios.</div>}
          {comments.map((comment) => (
            <div key={comment.id} className="panel comment-card">
              <div className="meta-row">
                <span>{comment.userName || 'Anonimo'}</span>
                <span>{formatDate(comment.createdAt)}</span>
              </div>
              <p>{comment.content}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
