import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Image from "next/image";
import CommentForm from "@/components/comment-form";
import { authOptions } from "@/lib/auth";
import { formatBytes, formatDate } from "@/lib/format";
import prisma from "@/lib/prisma";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function renderPostBody(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>);
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const [session, post] = await Promise.all([
    getServerSession(authOptions),
    prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        media: {
          orderBy: {
            createdAt: "asc",
          },
        },
        comments: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <article className="space-y-8">
      <Link href="/" className="inline-flex text-sm text-neutral-600 transition hover:text-neutral-900">
        Volver al inicio
      </Link>

      <header className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-500">
          {formatDate(post.createdAt)} por {post.author.name || post.author.email || "Admin"}
        </p>
        <h1 className="text-4xl leading-tight text-neutral-900">{post.title}</h1>
        <div className="prose-blog text-base">{renderPostBody(post.content)}</div>
      </header>

      {post.media.length > 0 && (
        <section className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl text-neutral-900">Adjuntos</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {post.media.map((file) => {
              if (file.mimeType.startsWith("image/")) {
                return (
                  <figure key={file.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
                    <Image
                      src={file.url}
                      alt={file.fileName}
                      width={1200}
                      height={900}
                      className="h-64 w-full object-cover"
                    />
                    <figcaption className="border-t border-neutral-200 px-3 py-2 text-xs text-neutral-600">
                      {file.fileName}
                    </figcaption>
                  </figure>
                );
              }

              if (file.mimeType.startsWith("audio/")) {
                return (
                  <div key={file.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="mb-3 text-sm font-medium text-neutral-700">{file.fileName}</p>
                    <audio controls className="w-full">
                      <source src={file.url} type={file.mimeType} />
                    </audio>
                  </div>
                );
              }

              return (
                <a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-link flex items-center justify-between gap-4 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700 transition hover:border-neutral-400 hover:bg-white"
                >
                  <span className="truncate">{file.fileName}</span>
                  <span className="shrink-0 text-xs text-neutral-500">{formatBytes(file.size)}</span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-2xl text-neutral-900">Comentarios ({post.comments.length})</h2>

        {session?.user ? (
          <CommentForm postId={post.id} />
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            Para comentar tenes que <Link className="underline" href="/login">ingresar</Link> con Instagram o correo.
          </div>
        )}

        <div className="space-y-3">
          {post.comments.length === 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
              Todavia no hay comentarios.
            </div>
          )}

          {post.comments.map((comment) => (
            <div key={comment.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                <span>{comment.user.name || comment.user.email || "Anonimo"}</span>
                <span>{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm leading-relaxed text-neutral-700">{comment.content}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

