# Blog Personal (React + Firebase)

Blog personal migrado a React con Vite y Firebase.

## Funcionalidades

- Publicaciones con texto
- Subida de imagenes, audio y archivos
- Grabacion de audio desde el navegador
- Comentarios para usuarios autenticados
- Login con email/password
- Login con Google
- Panel admin para crear publicaciones
- Gestion de admins por email desde el panel

## Stack

- React 19
- Vite
- React Router
- Firebase Auth
- Firestore
- Firebase Storage

## Requisitos

- Node.js 18+ (recomendado 20+)
- Proyecto Firebase con Auth, Firestore y Storage habilitados

## Instalacion

```bash
npm install
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (opcional)
- `VITE_ADMIN_EMAILS` (emails admin separados por coma)

## Desarrollo

```bash
npm run dev
```

## Build produccion

```bash
npm run build
npm run preview
```

## Rutas

- `/` listado de posts
- `/posts/:slug` detalle del post y comentarios
- `/login` login
- `/register` registro
- `/admin` panel de publicacion (solo admin)

## Modelo de datos (Firestore)

- `users/{uid}`
- `adminEmails/{email}`
- `posts/{postId}`
- `posts/{postId}/comments/{commentId}`

## Deploy

Se puede desplegar como sitio estatico (Vercel, Netlify, Firebase Hosting).
Recordar configurar las mismas variables `VITE_*` en el proveedor de deploy.

