import slugify from 'slugify';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  startAfter
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebase';

const postsCollection = collection(db, 'posts');

// Cache simple para posts
let postsCache = null;
let postsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date(value);
};

export const formatPostFromDoc = (docSnapshot) => {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    slug: data.slug,
    title: data.title,
    content: data.content,
    authorName: data.authorName || data.authorEmail || 'Admin',
    authorId: data.authorId,
    media: data.media || [],
    mediaCount: data.mediaCount || 0,
    commentsCount: data.commentsCount || 0,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt)
  };
};

export async function fetchPosts(useCache = true, limitCount = 20) {
  // Verificar cache
  if (useCache && postsCache && (Date.now() - postsCacheTime) < CACHE_DURATION) {
    console.log('📦 Usando posts desde cache');
    return postsCache;
  }

  try {
    console.log('🔥 Consultando posts desde Firestore...');
    const snapshot = await getDocs(
      query(
        postsCollection, 
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
    );
    
    const posts = snapshot.docs.map(formatPostFromDoc);
    console.log('✅ Posts obtenidos:', posts.length);
    
    // Actualizar cache
    if (useCache) {
      postsCache = posts;
      postsCacheTime = Date.now();
    }
    
    return posts;
  } catch (error) {
    console.error('❌ Error obteniendo posts:', error);
    
    // Si hay cache, devolverlo aunque esté expirado
    if (postsCache) {
      console.log('🔄 Usando cache expirado como fallback');
      return postsCache;
    }
    
    // Si no hay cache, devolver array vacío
    console.log('📭 No hay posts disponibles offline');
    return [];
  }
}

// Invalidar cache cuando se crea un post
export function invalidatePostsCache() {
  postsCache = null;
  postsCacheTime = 0;
}

export async function fetchPostBySlug(slug) {
  const snapshot = await getDocs(query(postsCollection, where('slug', '==', slug), limit(1)));
  if (snapshot.empty) {
    return null;
  }
  return formatPostFromDoc(snapshot.docs[0]);
}

export async function fetchComments(postId, limitCount = 50) {
  const commentsRef = collection(db, 'posts', postId, 'comments');
  const snapshot = await getDocs(
    query(
      commentsRef, 
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
  );

  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      content: data.content,
      userName: data.userName || data.userEmail || 'Anonimo',
      userEmail: data.userEmail || null,
      createdAt: toDate(data.createdAt)
    };
  });
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

  while (true) {
    const existing = await getDocs(query(postsCollection, where('slug', '==', candidate), limit(1)));
    if (existing.empty) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function uploadMediaFiles(slug, files) {
  const uploads = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (!file || file.size === 0) continue;

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
  }

  return uploads;
}

export async function createPost({ title, content, files, user }) {
  const slug = await buildUniqueSlug(title);
  const media = await uploadMediaFiles(slug, files);

  const created = await addDoc(postsCollection, {
    slug,
    title,
    content,
    authorId: user.uid,
    authorName: user.displayName || null,
    authorEmail: user.email || null,
    media,
    mediaCount: media.length,
    commentsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Invalidar cache después de crear un post
  invalidatePostsCache();

  return {
    id: created.id,
    slug,
    mediaCount: media.length
  };
}

export async function addCommentToPost({ postId, content, user }) {
  const commentsRef = collection(db, 'posts', postId, 'comments');

  await addDoc(commentsRef, {
    content,
    userId: user.uid,
    userName: user.displayName || null,
    userEmail: user.email || null,
    createdAt: serverTimestamp()
  });

  await updateDoc(doc(db, 'posts', postId), {
    commentsCount: increment(1),
    updatedAt: serverTimestamp()
  });
}
