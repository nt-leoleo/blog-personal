import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import InstagramAdminsManager from "@/app/admin/instagram-admins-manager";
import PostEditor from "@/app/admin/post-editor";
import { authOptions } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import prisma from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const [posts, instagramAdmins] = await Promise.all([
    prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            comments: true,
            media: true,
          },
        },
      },
    }),
    prisma.adminInstagram.findMany({
      orderBy: {
        username: "asc",
      },
      select: {
        username: true,
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl text-neutral-900">Panel de administracion</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Desde aca podes publicar cualquier cosa: texto, fotos, audios grabados o archivos adjuntos.
        </p>
      </section>

      <PostEditor />
      <InstagramAdminsManager usernames={instagramAdmins.map((entry) => entry.username)} />

      <section className="space-y-3">
        <h2 className="text-2xl text-neutral-900">Tus publicaciones</h2>
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            No hay publicaciones todavia.
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-neutral-900">{post.title}</p>
                  <span className="text-xs text-neutral-500">{formatDate(post.createdAt)}</span>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  {post._count.media} adjuntos - {post._count.comments} comentarios
                </p>
                <Link href={`/posts/${post.slug}`} className="mt-3 inline-flex text-xs font-medium underline">
                  Ver post
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
