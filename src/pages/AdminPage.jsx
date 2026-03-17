import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPost, fetchPosts } from '../lib/blog';
import { formatBytes, formatDate } from '../lib/format';
import { addAdminEmail, fetchAdminEmails, removeAdminEmail } from '../lib/users';
import { sendPostNotification } from '../lib/notifications';
import { useAuth } from '../contexts/AuthContext';
import { MicIcon, MicOffIcon, TrashIcon } from '../components/Icons';

const MAX_FILES = 20;
const MAX_FILE_SIZE = 30 * 1024 * 1024;
const FALLBACK_AUDIO_TYPE = 'audio/webm';

function validateFiles(files) {
  if (files.length > MAX_FILES) {
    return `Solo se permiten ${MAX_FILES} archivos por publicacion.`;
  }

  const oversized = files.find((file) => file.size > MAX_FILE_SIZE);
  if (oversized) {
    return `El archivo ${oversized.name} supera el limite de ${formatBytes(MAX_FILE_SIZE)}.`;
  }

  return '';
}

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return FALLBACK_AUDIO_TYPE;
  }

  const supported = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  const found = supported.find((type) => MediaRecorder.isTypeSupported(type));
  return found || FALLBACK_AUDIO_TYPE;
}

export default function AdminPage() {
  const { user } = useAuth();

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [recordedAudios, setRecordedAudios] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [admins, setAdmins] = useState([]);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminsMessage, setAdminsMessage] = useState('');

  const allFiles = useMemo(() => [...files, ...recordedAudios], [files, recordedAudios]);
  const filesError = useMemo(() => validateFiles(allFiles), [allFiles]);

  const loadPosts = useCallback(async () => {
    try {
      setLoadingPosts(true);
      // Usar cache y limitar a 10 posts para admin
      const data = await fetchPosts(true, 10);
      setPosts(data);
    } catch (error) {
      // console.error(error);
      setMessage('No se pudieron cargar las publicaciones.');
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const loadAdmins = useCallback(async () => {
    try {
      setAdminsLoading(true);
      const data = await fetchAdminEmails();
      setAdmins(data);
    } catch (error) {
      // console.error(error);
      setAdminsMessage('No se pudo cargar la lista de admins.');
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    loadAdmins();
  }, []);

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    setFiles(selected);
  };

  const startRecording = async () => {
    if (!navigator?.mediaDevices) {
      setRecordingError('Tu navegador no soporta grabacion de audio.');
      return;
    }

    try {
      setRecordingError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setIsRecording(false);

        const merged = new Blob(chunksRef.current, {
          type: recorder.mimeType || FALLBACK_AUDIO_TYPE
        });

        if (merged.size > 0) {
          const ext = merged.type.includes('mp4') ? 'm4a' : 'webm';
          const file = new File([merged], `audio-${Date.now()}.${ext}`, {
            type: merged.type || FALLBACK_AUDIO_TYPE
          });
          setRecordedAudios((prev) => [...prev, file]);
        }

        chunksRef.current = [];
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      };

      chunksRef.current = [];
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setRecordingError('No se pudo acceder al microfono.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const removeRecordedAudio = (index) => {
    setRecordedAudios((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!title.trim() || !content.trim()) {
      setMessage('Titulo y contenido son obligatorios.');
      return;
    }

    if (filesError) {
      setMessage(filesError);
      return;
    }

    if (!user) {
      setMessage('Sesion invalida. Volve a iniciar sesion.');
      return;
    }

    setSaving(true);

    try {
      await createPost({
        title: title.trim(),
        content: content.trim(),
        files: allFiles,
        user
      });

      // Enviar notificación del nuevo post
      sendPostNotification(title.trim());

      // El cache se invalida automáticamente en el proxy
      // invalidatePostsCache(); // Ya no es necesario

      setTitle('');
      setContent('');
      setFiles([]);
      setRecordedAudios([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setMessage('Publicacion creada.');
      await loadPosts();
    } catch (error) {
      // console.error(error);
      setMessage('No se pudo crear la publicacion. Revisa Firebase/Storage.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async (event) => {
    event.preventDefault();
    setAdminsMessage('');

    const email = adminEmailInput.trim().toLowerCase();
    if (!email) {
      setAdminsMessage('Escribe un correo valido.');
      return;
    }

    setAdminActionLoading(true);
    try {
      await addAdminEmail(email);
      setAdminEmailInput('');
      setAdminsMessage('Admin agregado.');
      await loadAdmins();
    } catch (error) {
      // console.error(error);
      setAdminsMessage('No se pudo agregar el admin.');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleRemoveAdmin = async (email) => {
    setAdminsMessage('');
    setAdminActionLoading(true);

    try {
      await removeAdminEmail(email);
      setAdminsMessage('Admin removido.');
      await loadAdmins();
    } catch (error) {
      // console.error(error);
      setAdminsMessage('No se pudo remover el admin.');
    } finally {
      setAdminActionLoading(false);
    }
  };

  return (
    <div className="stack-xl">
      <section className="panel">
        <h1>Panel de administracion</h1>
        <p>Desde aca podes publicar texto, fotos, audios o cualquier archivo.</p>
      </section>

      <form onSubmit={handleSubmit} className="panel stack-md">
        <h2>Nueva publicacion</h2>

        <label className="label" htmlFor="title">Titulo</label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="input"
          placeholder="Titulo de la publicacion"
          required
        />

        <label className="label" htmlFor="content">Contenido</label>
        <textarea
          id="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={8}
          className="input"
          placeholder="Subi texto libre, pensamientos, updates..."
          required
        />

        <label className="label" htmlFor="files">Adjuntos (fotos, audio, pdf, zip, etc.)</label>
        <input
          id="files"
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFiles}
          className="input file-input"
        />

        <div className="panel stack-sm record-panel">
          <div className="row-between wrap-row">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'} btn-with-icon`}
            >
              {isRecording ? <MicOffIcon size={16} /> : <MicIcon size={16} />}
              {isRecording ? 'Detener grabacion' : 'Grabar audio'}
            </button>
            <span className="meta-text">
              {isRecording ? 'Grabando...' : 'Agrega notas de voz al post.'}
            </span>
          </div>

          {recordingError && <p className="state-error">{recordingError}</p>}

          {recordedAudios.length > 0 && (
            <ul className="stack-sm">
              {recordedAudios.map((file, index) => (
                <li key={`${file.name}-${index}`} className="file-row">
                  <span>{file.name}</span>
                  <span>{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeRecordedAudio(index)}
                    className="btn btn-outline btn-xs btn-with-icon"
                  >
                    <TrashIcon size={12} />
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {allFiles.length > 0 && (
          <ul className="stack-sm">
            {allFiles.map((file) => (
              <li key={`${file.name}-${file.lastModified}`} className="file-row">
                <span>{file.name}</span>
                <span>{formatBytes(file.size)}</span>
              </li>
            ))}
          </ul>
        )}

        {(filesError || message) && (
          <p className={filesError ? 'state-error' : 'state-message'}>{filesError || message}</p>
        )}

        <button type="submit" disabled={saving} className="btn btn-primary btn-fit">
          {saving ? 'Publicando...' : 'Publicar'}
        </button>
      </form>

      <section className="panel stack-md">
        <h2>Admins</h2>
        <p className="meta-text">Agrega o quita admins por correo.</p>

        <form onSubmit={handleAddAdmin} className="row-between wrap-row">
          <input
            type="email"
            value={adminEmailInput}
            onChange={(event) => setAdminEmailInput(event.target.value)}
            className="input"
            placeholder="admin@dominio.com"
            required
          />
          <button type="submit" disabled={adminActionLoading} className="btn btn-primary">
            Agregar admin
          </button>
        </form>

        {adminsMessage && <p className="state-message">{adminsMessage}</p>}

        {adminsLoading ? (
          <p className="state-message">Cargando admins...</p>
        ) : admins.length === 0 ? (
          <div className="panel muted">No hay admins agregados en Firestore.</div>
        ) : (
          <div className="stack-sm">
            {admins.map((email) => (
              <div key={email} className="file-row">
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAdmin(email)}
                  disabled={adminActionLoading}
                  className="btn btn-outline btn-xs btn-with-icon"
                >
                  <TrashIcon size={12} />
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="stack-md">
        <h2>Tus publicaciones</h2>

        {loadingPosts && <p className="state-message">Cargando publicaciones...</p>}

        {!loadingPosts && posts.length === 0 && <div className="panel muted">No hay publicaciones todavia.</div>}

        {!loadingPosts && posts.length > 0 && (
          <div className="stack-sm">
            {posts.map((post) => (
              <article key={post.id} className="panel post-row">
                <div className="row-between">
                  <p className="post-title-inline">{post.title}</p>
                  <span className="meta-text">{formatDate(post.createdAt)}</span>
                </div>
                <p className="meta-text">
                  {post.mediaCount || 0} adjuntos - {post.commentsCount || 0} comentarios
                </p>
                <Link to={`/posts/${post.slug}`} className="text-link">
                  Ver post
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
