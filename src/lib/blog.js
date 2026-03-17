import slugify from 'slugify';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';
import firestoreProxy from './firestoreProxy';

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
};

export const formatPostFromDoc = (data) => {
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    content: data.content,
    authorName: data.authorName || data.authorEmail || 'Admin',
    authorId: data.authorId,
    media: data.media || [],
    mediaCount: data.mediaCount || 0,
    commentsCount: data.commentsCount || 0,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    isOffline: data.isOffline || false
  };
};

export async function fetchPosts(useCache = true, limitCount = 20) {
  try {
    const posts = await firestoreProxy.getPosts(limitCount);
    return posts.map(formatPostFromDoc);
  } catch (error) {
    // console.error('Error en fetchPosts:', error);
    return [];
  }
}

export async function fetchPostBySlug(slug) {
  try {
    const post = await firestoreProxy.getPostBySlug(slug);
    return post ? formatPostFromDoc(post) : null;
  } catch (error) {
    // console.error('Error en fetchPostBySlug:', error);
    return null;
  }
}

export async function fetchComments(postId, limitCount = 50) {
  // Los comentarios se manejan por separado por ahora
  // TODO: Implementar en el proxy si es necesario
  return [];
}

function makeBaseSlug(title) {
  return (
    slugify(title, {
      lower: true,
      strict: true,
      trim: true
    }) || `post-${Date.now()}`
  );
}

async function buildUniqueSlug(title) {
  const base = makeBaseSlug(title);
  let candidate = base;
  let suffix = 2;

  // Verificar unicidad usando el proxy
  while (true) {
    const existing = await firestoreProxy.getPostBySlug(candidate);
    if (!existing) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
    
    // Evitar bucle infinito
    if (suffix > 100) {
      return `${base}-${Date.now()}`;
    }
  }
}

async function uploadMediaFiles(slug, files) {
  const uploads = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (!file || file.size === 0) continue;

    try {
      const safeName = file.name.replace(/\s+/g, '-');
      const storagePath = `posts/${slug}/${Date.now()}-${index}-${safeName}`;
      const storageRef = ref(storage, storagePath);
      const uploaded = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploaded.ref);

      uploads.push({
        url,
        path: storagePath,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size
      });
    } catch (error) {
      // console.error('Error subiendo archivo:', error);
      // Continuar con otros archivos
    }
  }

  return uploads;
}

export async function createPost({ title, content, files, user }) {
  try {
    const slug = await buildUniqueSlug(title);
    const media = await uploadMediaFiles(slug, files);

    const postData = {
      slug,
      title,
      content,
      authorId: user.uid,
      authorName: user.displayName || null,
      authorEmail: user.email || null,
      media,
      mediaCount: media.length,
      commentsCount: 0
    };

    const result = await firestoreProxy.createPost(postData);

    return {
      id: result.id,
      slug,
      mediaCount: media.length,
      isOffline: result.isOffline || false
    };
  } catch (error) {
    // console.error('Error en createPost:', error);
    throw error;
  }
}

export async function addCommentToPost({ postId, content, user }) {
  // TODO: Implementar comentarios en el proxy
  // console.log('Comentarios no implementados aún en modo proxy');
}

// Funciones de utilidad
export async function syncOfflineData() {
  return await firestoreProxy.syncOfflineData();
}

export async function checkFirestoreConnection() {
  return await firestoreProxy.checkConnection();
}
