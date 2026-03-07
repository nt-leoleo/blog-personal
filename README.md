# Blog Personal

Sitio de blog personal con estilo moderno/minimalista y soporte para:

- Publicaciones de texto
- Subida de fotos, audio y cualquier archivo
- Grabacion de audio desde el navegador
- Comentarios por usuarios autenticados
- Login de usuarios por correo/clave
- Login opcional con Google (OAuth)
- Login opcional con Instagram (OAuth)
- Cuenta admin para publicar contenido

## Stack

- Next.js (App Router)
- Prisma + PostgreSQL
- NextAuth
- Tailwind CSS

## 1) Instalar

```bash
npm install
```

## 2) Variables de entorno

Copia `.env.example` a `.env` y completa:

- `DATABASE_URL` (PostgreSQL)
- `NEXTAUTH_SECRET`
- (Opcional) `AUTH_SECRET` (alias de `NEXTAUTH_SECRET`)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- Opcional: `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
- Opcional: `INSTAGRAM_CLIENT_ID` y `INSTAGRAM_CLIENT_SECRET`

## 3) Base de datos

```bash
npm run db:push
npm run db:seed
```

Esto crea:

- Tablas en PostgreSQL
- Cuenta admin inicial
- Un post de ejemplo
- Admin de Instagram inicial: `gazetheblackmoon`

## 4) Levantar entorno dev

```bash
npm run dev
```

## Accesos

- Admin: usa `ADMIN_EMAIL` + `ADMIN_PASSWORD` y entra a `/admin`
- Admin por Instagram: `@gazetheblackmoon` (y los que agregues en la seccion de configuracion de `/admin`)
- Usuarios normales: se registran en `/register` para comentar

## Instagram Login

Para habilitar login con Instagram en desarrollo:

1. Crea una app en Meta for Developers (Instagram Basic Display).
2. Define una URL publica `https` para tu app (ejemplo con ngrok: `https://tu-url.ngrok-free.app`).
3. Configura `NEXTAUTH_URL` con esa URL.
4. Configura `Valid OAuth Redirect URI` como:
   - `https://tu-url.ngrok-free.app/api/auth/callback/instagram`
5. Copia `Client ID` y `Client Secret` a `.env`.

Ruta API de arranque de login Instagram:

- `GET /api/instagram/login?callbackUrl=/`

Si no configuras estas variables, el sitio igual funciona con login por correo.

## Deploy en Vercel

1. Crea una base con Vercel Postgres.
2. En Variables de Entorno del proyecto configura:
   - `DATABASE_URL` (puede apuntar a `POSTGRES_PRISMA_URL` de Vercel)
   - `NEXTAUTH_SECRET` (o `AUTH_SECRET`)
   - `NEXTAUTH_URL` con tu dominio final (ej: `https://tu-sitio.vercel.app`)
   - OAuth de Google/Instagram si los usas.
3. Ejecuta una vez `npm run db:push` y `npm run db:seed` contra esa base.

